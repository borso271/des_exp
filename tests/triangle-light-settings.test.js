const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');

(async () => {
  // This checks real UI/settings handlers without a GPU. Shader compilation
  // and appearance are checked separately in a WebGL-capable browser.
  const dom = new JSDOM(fs.readFileSync('triangle-light/index.html', 'utf8'), {runScripts:'outside-only'});
  const {window} = dom;
  try {
    const errors = [];
    let download;
    window.console.error = error => errors.push(error.message);
    window.HTMLCanvasElement.prototype.getContext = () => null;
    window.requestAnimationFrame = () => 1;
    window.Blob = Blob;
    window.URL.createObjectURL = blob => {download = blob; return 'blob:test';};
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = () => {};
    for (const file of ['js/shared/color-palettes.js', 'triangle-light/palette.js', 'triangle-light/app.js']) {
      window.eval(fs.readFileSync(file, 'utf8'));
    }
    assert.equal(errors.length, 1);
    assert.match(errors[0], /WebGL 2 is unavailable/);
    const input = (key, value, type='input') => {
      const element = window.document.getElementById(`p-${key}`);
      element.value = String(value);
      element.dispatchEvent(new window.Event(type));
    };
    const value = key => window.document.getElementById(`p-${key}`).value;
    const click = id => window.document.getElementById(id).click();
    const load = async payload => {
      const file = window.document.getElementById('file');
      const text = JSON.stringify(payload);
      Object.defineProperty(file, 'files', {configurable:true, value:[{size:text.length, text:async()=>text}]});
      file.dispatchEvent(new window.Event('change'));
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(window.document.getElementById('message').textContent, 'Settings loaded.');
    };

    input('paletteStyle', 'sunset', 'change');
    input('baseHue', 20);
    input('colorVariation', 75);
    click('save');
    const generated = JSON.parse(await download.text());
    assert.equal(generated.parameters.paletteStyle, 'sunset');
    assert.equal(generated.parameters.baseHue, 20);
    assert.equal(generated.parameters.colorVariation, 75);
    click('reset');
    await load(generated);
    for (const key of ['paletteStyle','baseHue','colorVariation',...Object.keys(window.TrianglePalette.reference)]) {
      assert.equal(value(key), String(generated.parameters[key]));
    }

    input('coreColor', '#ff8866');
    assert.equal(value('paletteStyle'), 'custom');
    input('width', 0.7);
    assert.equal(value('coreColor'), '#ff8866');
    click('save');
    const custom = JSON.parse(await download.text());
    click('reset');
    await load(custom);
    assert.equal(value('coreColor'), '#ff8866');
    assert.equal(value('paletteStyle'), 'custom');

    // Old settings lack palette controls. Import must keep all four colors.
    for (const key of ['paletteStyle','baseHue','colorVariation']) delete custom.parameters[key];
    await load(custom);
    assert.equal(value('paletteStyle'), 'custom');
    assert.equal(value('coreColor'), '#ff8866');
    click('reset');
    for (const [key, color] of Object.entries(window.TrianglePalette.reference)) assert.equal(value(key), color);
    assert.equal(value('paletteStyle'), 'reference');
    const floor = window.document.getElementById('p-floorEnabled');
    assert.equal(floor.checked, true);
    input('floorBounce', 0.42);
    floor.click();
    assert.equal(floor.checked, false);
    assert.equal(window.document.getElementById('p-floorBounce').disabled, true);
    click('save');
    const noFloor = JSON.parse(await download.text());
    assert.equal(noFloor.parameters.floorEnabled, false);
    click('reset');
    assert.equal(floor.checked, true);
    await load(noFloor);
    assert.equal(floor.checked, false);
    floor.click();
    assert.equal(value('floorBounce'), '0.42', 'floor adjustments survive toggling');
    assert.equal(window.document.getElementById('p-floorBounce').disabled, false);
    delete noFloor.parameters.floorEnabled;
    await load(noFloor);
    assert.equal(floor.checked, true, 'legacy settings keep the floor');
    noFloor.parameters.floorEnabled = 'false';
    await load(noFloor);
    assert.equal(floor.checked, true, 'only a boolean can change floor visibility');
    console.log('PASS: triangle palette/floor UI, JSON round trips, and legacy settings');
  } finally {
    window.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
