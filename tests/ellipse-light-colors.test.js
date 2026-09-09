const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');

const context = vm.createContext({window:{}});
for (const file of ['js/shared/color-palettes.js', 'turrell-ellipse-light/palette.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:file});
}
const {EllipsePalette: palette, ColorPalettes: colors} = context.window;
const plain = value => JSON.parse(JSON.stringify(value));
const keys = ['bg', ...palette.fieldKeys];
const fieldColors = state => keys.map(key => state[key]);
const hsl = hex => colors.rgbToHsl(colors.hexToRgb(hex));
const original = palette.study('reference');
assert.equal(original.backgroundMode, 'related');
palette.fieldKeys.forEach(key => assert.equal(original[key], palette.reference[key], 'reference ellipse colors are preserved'));
assert.deepEqual(fieldColors(palette.generate(original)), fieldColors(original), 'default background matches its palette controls');
for (const type of colors.generatedTypes) {
  const state = palette.applyChange(original, {paletteStyle:type});
  assert.equal(state.paletteStyle, type);
  assert.deepEqual(palette.generate(state), palette.generate(state), `${type}: deterministic`);
  fieldColors(state).forEach(hex => assert.match(hex, /^#[0-9a-f]{6}$/));
  assert.deepEqual(fieldColors(palette.restore(plain(state))), fieldColors(state), `${type}: JSON colors round trip`);
}
const silver = palette.study('silver');
fieldColors(silver).forEach(hex => assert.equal(hsl(hex).saturation, 0));
const amber = palette.study('amber');
assert.ok(hsl(amber.c5).lightness > hsl(amber.c1).lightness + 30, 'luminous profile brightens inward');
const eclipse = palette.study('eclipse');
assert.ok(hsl(eclipse.c1).lightness > hsl(eclipse.c5).lightness + 50, 'dark core reverses the lightness profile');
const rotated = palette.applyChange(amber, {hueRotation:90});
keys.forEach(key => assert.ok(Math.abs((hsl(rotated[key]).hue-hsl(amber[key]).hue+360)%360-90) < 2));
const reversed = palette.applyChange(original, {reversePalette:true});
assert.equal(reversed.c1, original.c5);
assert.equal(reversed.c5, original.c1);
const returning = palette.applyChange(original, {progression:'return'});
assert.equal(returning.c1, returning.c5);
assert.equal(returning.c2, returning.c4);
assert.equal(returning.c3, original.c5);
assert.equal(palette.position(0, {...original, paletteOffset:-100}), 0);
assert.equal(palette.position(4, {...original, paletteOffset:100}), 1);
assert.equal(palette.sample(['#000000','#ffffff'], .5, 'rgb'), '#bcbcbc');
assert.equal(palette.sample(['#000000','#ffffff'], .2, 'steps'), '#000000');
const captured = palette.applyChange(rotated, {c3:'#123456'});
assert.equal(captured.paletteStyle, 'custom');
assert.equal(captured.c3, '#123456');
keys.filter(key => key !== 'c3').forEach(key => assert.equal(captured[key], rotated[key], 'manual edit preserves other colors'));
assert.deepEqual(fieldColors(palette.generate(captured)), fieldColors(captured));
assert.deepEqual(fieldColors(palette.restore(plain(captured))), fieldColors(captured));
const invalid = palette.sanitize({saturation:NaN, brightness:Infinity, paletteStyle:'bad', reversePalette:'false', customColors:['no']});
assert.deepEqual(plain(invalid), plain(palette.defaults));

(async () => {
  const errors = [], uniforms = {};
  let download;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  // GPU-independent integration checks use the real DOM, script loading,
  // controls, settings handlers and uniform uploads. Visual QA uses real WebGL.
  const gl = {
    createShader:()=>({}), shaderSource(){}, compileShader(){}, getShaderParameter:()=>true,
    createProgram:()=>({}), attachShader(){}, linkProgram(){}, getProgramParameter:()=>true,
    useProgram(){}, bindVertexArray(){}, createVertexArray:()=>({}), getUniformLocation:(_, name)=>name,
    uniform1f(){}, uniform2f(){}, uniform4f(){}, viewport(){}, drawArrays(){},
    uniform3f:(name,...values)=>uniforms[name]=values
  };
  const dom = await JSDOM.fromFile(path.resolve('turrell-ellipse-light/index.html'), {
    runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, virtualConsole,
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = () => gl;
      window.requestAnimationFrame = () => 1;
      window.Blob = Blob;
      window.URL.createObjectURL = blob => {download=blob; return 'blob:test';};
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = () => {};
      window.HTMLCanvasElement.prototype.toBlob = callback => callback(new Blob(['test']));
    }
  });
  try {
    await new Promise(resolve => dom.window.addEventListener('load', resolve, {once:true}));
    const {window} = dom, doc = window.document;
    const $ = id => doc.getElementById(id);
    const state = () => plain(window.ellipseLight.getParameters());
    const input = (key, value) => {
      const el = doc.querySelector(`[data-k="${key}"]`);
      if (el.type === 'checkbox') el.checked=value; else el.value=String(value);
      el.dispatchEvent(new window.Event(el.tagName==='SELECT'||el.type==='checkbox'?'change':'input'));
    };
    const study = name => {$('colorStudy').value=name; $('colorStudy').dispatchEvent(new window.Event('change'));};
    const save = async () => {$('saveBtn').click(); return JSON.parse(await download.text());};
    const load = async payload => {
      const text = JSON.stringify(payload);
      Object.defineProperty($('fileInput'), 'files', {configurable:true,value:[{text:async()=>text}]});
      $('fileInput').dispatchEvent(new window.Event('change'));
      await new Promise(resolve=>setImmediate(resolve));
    };
    assert.equal(errors.length, 0, errors.map(String).join('\n'));
    assert.deepEqual(fieldColors(state()), fieldColors(original));
    assert.equal($('backgroundMode').value, 'related');
    assert.equal($('p-backgroundOffset').disabled, false);
    const {presets} = await import('../showcase/presets.js');
    for (const preset of presets.filter(preset => preset.lab === 'ellipse')) {
      $('resetBtn').click();
      window.ellipseLight.setParameters(preset.preset);
      const initial = state();
      assert.equal(initial.backgroundMode, 'related', `${preset.id}: related background by default`);
      palette.fieldKeys.forEach(key => assert.equal(initial[key], preset.preset[key], `${preset.id}: preserves ellipse palette`));
      assert.deepEqual(fieldColors(initial), fieldColors(palette.generate(initial)), `${preset.id}: displayed background follows the outer ellipse`);
      assert.doesNotThrow(() => window.ellipseLight.validateState(initial));
      await load(await save());
      assert.deepEqual(state(), initial, `${preset.id}: complete JSON retains the related background`);
    }
    $('resetBtn').click();
    input('centerX', .7);
    study('dusk');
    assert.equal(state().centerX, .7, 'color studies keep geometry');
    input('progression', 'ease-in'); input('paletteSpan', 65); input('paletteOffset', -10);
    input('hueRotation', 25); input('saturation', 85); input('backgroundMode', 'opposite');
    const generated = await save();
    $('resetBtn').click();
    window.ellipseLight.setParameters(generated);
    assert.deepEqual(state(), generated, 'public API can restore its own snapshot');
    $('resetBtn').click();
    await load(generated);
    assert.deepEqual(state(), generated, 'all settings and displayed colors round trip');
    assert.equal($('status').textContent, 'Settings loaded.');
    const before = state();
    input('c4', '#123456');
    assert.equal(state().paletteStyle, 'custom');
    keys.filter(key=>key!=='c4').forEach(key=>assert.equal(state()[key],before[key]));
    input('radiusX', .5);
    assert.equal(state().c4, '#123456');
    const custom = await save();
    $('resetBtn').click(); await load(custom);
    assert.deepEqual(state(), custom, 'custom palette round trips');
    const legacy = {...custom};
    Object.keys(palette.defaults).forEach(key=>delete legacy[key]);
    study('violet'); await load(legacy);
    assert.deepEqual(fieldColors(state()), fieldColors(custom), 'old files preserve exact colors');
    assert.equal(state().hueRotation, 0, 'legacy imports do not inherit current adjustments');
    await load({unrelated:true});
    assert.equal($('status').textContent, 'Could not load JSON.');
    assert.deepEqual(fieldColors(state()), fieldColors(custom), 'bad import leaves composition unchanged');
    study('amber');
    const seeded = state(); $('newPalette').click();
    assert.notDeepEqual(fieldColors(state()), fieldColors(seeded));
    input('radiusY', .6);
    const reSeeded = state(); input('rotation', 10);
    assert.deepEqual(fieldColors(state()), fieldColors(reSeeded), 'geometry never rerandomizes colors');
    input('lightProfile', 'palette'); assert.equal($('p-lightStrength').disabled, true);
    input('backgroundMode', 'manual'); assert.equal($('p-backgroundOffset').disabled, true);
    input('paletteStyle', 'grayscale'); assert.equal($('newPalette').disabled, true);
    assert.equal($('base-hue-row').hidden, true);
    $('resetColors').click();
    assert.equal(state().rotation, 10); assert.equal(state().radiusY, .6);
    assert.deepEqual(fieldColors(state()), fieldColors(original));
    study('eclipse');
    const exported = state();
    $('exportWidth').value='640'; $('exportBtn').click();
    keys.forEach(key=>{
      const uniform=key==='bg'?'uBg':`u${key[0].toUpperCase()}${key[1]}`;
      assert.deepEqual(uniforms[uniform], Object.values(colors.hexToRgb(exported[key])).map(value=>value/255));
    });
    assert.match($('status').textContent, /Exported 640/);
    $('resetBtn').click();
    assert.deepEqual(fieldColors(state()), fieldColors(original));
    assert.equal(state().centerX, .485);
    assert.equal(errors.length, 0, errors.map(String).join('\n'));
    console.log('PASS: ellipse color mapping, lightness profiles, manual edits, stable seeds, UI, JSON compatibility and export uniforms');
  } finally {dom.window.close();}
})().catch(error => {console.error(error); process.exitCode=1;});
