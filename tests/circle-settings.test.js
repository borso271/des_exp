const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const errors = [];
  const downloads = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = await JSDOM.fromFile(path.join(__dirname, '../circle.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: false });
      window.requestAnimationFrame = () => 1;
      window.cancelAnimationFrame = () => {};
      window.URL.createObjectURL = () => 'blob:configuration';
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, {once:true}));
  const { document, CircleApp: app } = dom.window;
  const change = (id, value) => {
    const input = document.getElementById(id);
    if (input.type === 'checkbox') input.checked = value;
    else input.value = String(value);
    input.dispatchEvent(new dom.window.Event(input.tagName === 'SELECT' ? 'change' : 'input'));
  };
  const withoutDate = data => { const result = JSON.parse(JSON.stringify(data)); delete result.exportedAt; return result; };
  const initial = app.settings.capture();
  const fields = [...document.querySelectorAll('#controls-panel input:not([type="file"]), #controls-panel select')];
  assert.equal(Object.keys(initial.controls).length, fields.length, 'every control must be saved');
  for (const family of app.geometryRegistry.names()) {
    change('geometry-type', family);
    change('palette-type', 'monochrome');
    change('base-hue', 28);
    change('color-variability', 80);
    change('color-count', 16);
    change('frame-preset', 'landscape');
    change('logo-effect', 'glass');
    change('logo-effect-blur', 12);
    change('render-style', 'luminous');
    document.getElementById('randomize-luminous').click();
    document.getElementById('shuffle-palette').click();
    const saved = app.settings.capture();
    const savedColors = [...app.state.palette.colors];
    app.settings.apply(JSON.stringify(initial));
    app.settings.apply(JSON.stringify(saved));
    assert.deepEqual(withoutDate(app.settings.capture()), withoutDate(saved), `${family} must round-trip`);
    assert.deepEqual([...app.state.palette.colors], savedColors, 'shuffled colors must be restored');
    assert.equal(app.state.geometry.type, family);
    assert.equal(app.state.frame.width, 1080);
    assert.equal(app.state.overlays.logoEffect, 'glass');
    assert.equal(document.querySelector('#geometry-type').value, family);
    assert.equal(document.querySelector('#frame-preset').value, 'landscape');
  }
  for (const family of ['rings', 'polygons', 'superellipse']) {
    change('geometry-type', family);
    change('render-style', 'solid');
    for (const [rings, sectors] of [[1, 1], [3, 5], [24, 32]]) {
      change('ring-count', rings);
      change('sector-count', sectors);
      app.renderer.render(1.5);
      const paths = [...document.querySelectorAll('#cells path')];
      assert.equal(paths.length, rings * sectors);
      paths.forEach(path => {
        assert.ok(path.getAttribute('d').length > 0);
        assert.ok(!/NaN|Infinity|undefined/.test(path.getAttribute('d')));
        assert.equal(path.getAttribute('fill-rule'), 'evenodd');
        assert.match(path.getAttribute('fill'), /^hsl\(/);
      });
      if (sectors % 2 === 1) {
        assert.equal(app.state.symmetry, 'none');
        assert.equal(document.querySelector('#symmetry-mode option[value="four-way"]').disabled, true);
      }
      const saved = app.settings.capture();
      app.settings.apply(JSON.stringify(initial));
      app.settings.apply(JSON.stringify(saved));
      assert.deepEqual(withoutDate(app.settings.capture()), withoutDate(saved));
    }
    change('ring-count', 6);
    change('sector-count', 1);
    change('render-style', 'luminous');
    app.renderer.render(2);
    const ringPaths = [...document.querySelectorAll('#cells path')];
    assert.equal(ringPaths.length, 6);
    assert.equal(document.querySelectorAll('#luminous-materials pattern').length, 6,
      'undivided rings have one luminous material per ring');
    ringPaths.forEach((path, index) => {
      assert.equal((path.getAttribute('d').match(/M /g) || []).length, index === 0 ? 1 : 2,
        'whole rings use closed outer and inner contours');
      if (family === 'rings') {
        assert.equal((path.getAttribute('d').match(/A /g) || []).length, index === 0 ? 2 : 4,
          'full circles need two SVG arcs per contour');
      }
    });
  }
  const legacy = JSON.parse(JSON.stringify(initial));
  delete legacy.controls['ring-count'];
  delete legacy.controls['sector-count'];
  delete legacy.controls['gradient-type'];
  delete legacy.controls['gradient-angle'];
  delete legacy.controls['gradient-reverse'];
  app.settings.apply(JSON.stringify(legacy));
  assert.equal(app.state.geometry.ringCount, 8);
  assert.equal(app.state.geometry.sectorCount, 16);
  assert.equal(app.state.rendering.gradientType, 'linear');
  assert.equal(app.state.rendering.gradientAngle, 90);
  assert.equal(app.state.rendering.gradientReverse, false);

  for (const family of app.geometryRegistry.names()) {
    change('geometry-type', family);
    change('render-style', 'gradient');
    change('gradient-type', 'linear');
    change('gradient-angle', 0);
    app.renderer.render(2);
    const paths = [...document.querySelectorAll('#cells path')];
    const geometryBefore = paths.map(p => p.getAttribute('d'));
    assert.equal(document.querySelectorAll('#palette-gradients linearGradient').length, paths.length);
    assert.equal(document.querySelector('#gradient-angle').disabled, false);
    assert.equal(document.querySelector('#luminous-bloom').closest('.control-group').hidden, true);
    const first = document.querySelector('#palette-gradients linearGradient');
    assert.equal(Number(first.getAttribute('x1')), 0);
    assert.equal(Number(first.getAttribute('x2')), 1);
    assert.equal(Number(first.getAttribute('y1')), Number(first.getAttribute('y2')));
    change('gradient-angle', 90);
    assert.ok(Math.abs(Number(first.getAttribute('x1')) - Number(first.getAttribute('x2'))) < 1e-10);
    change('palette-type', 'ocean');
    change('color-count', 6);
    const stopsBefore = [...first.children].map(stop => stop.getAttribute('stop-color'));
    assert.equal(stopsBefore.length, 6);
    assert.equal(stopsBefore[0], paths[0].getAttribute('data-palette-color'));
    change('gradient-reverse', true);
    assert.deepEqual([...first.children].map(stop => stop.getAttribute('stop-color')), stopsBefore.slice().reverse());
    change('gradient-type', 'radial');
    assert.equal(document.querySelectorAll('#palette-gradients radialGradient').length, paths.length);
    assert.equal(document.querySelector('#gradient-direction-group').hidden, true);
    assert.equal(document.querySelector('#gradient-angle').disabled, true);
    assert.deepEqual(paths.map(p => p.getAttribute('d')), geometryBefore, 'gradient changes preserve geometry');
    paths.forEach(path => {
      const id = path.getAttribute('fill').slice(5, -1);
      assert.equal(document.getElementById(id).tagName, 'radialGradient');
    });
    const saved = app.settings.capture();
    app.settings.apply(JSON.stringify(initial));
    app.settings.apply(JSON.stringify(saved));
    assert.deepEqual(withoutDate(app.settings.capture()), withoutDate(saved));
    change('render-style', 'solid');
    document.querySelectorAll('#cells path').forEach(path => assert.equal(path.getAttribute('fill'), path.getAttribute('data-palette-color')));
    change('render-style', 'luminous');
    change('render-style', 'gradient');
    assert.equal(document.querySelectorAll('#palette-gradients radialGradient').length, document.querySelectorAll('#cells path').length);
    change('gradient-reverse', false);
  }

  change('text-content', 'manifesto');
  assert.equal(app.state.overlays.textContent, 'manifesto');
  assert.equal(document.querySelector('.event-copy').dataset.content, 'manifesto');
  assert.equal(document.querySelector('.logo-graphic').classList.contains('is-hidden'), true);
  assert.equal(document.getElementById('show-be-arts-logo').disabled, true);
  assert.deepEqual([...document.querySelectorAll('.manifesto-top span')].map(span => span.textContent), ['NO', 'SOMOS']);
  assert.equal(document.querySelector('.manifesto-bottom').textContent, 'ESPECTADORES');
  const manifesto = app.settings.capture();
  app.settings.apply(JSON.stringify(initial));
  app.settings.apply(JSON.stringify(manifesto));
  assert.deepEqual(withoutDate(app.settings.capture()), withoutDate(manifesto));
  const legacyText = JSON.parse(JSON.stringify(initial));
  delete legacyText.controls['text-content'];
  app.settings.apply(JSON.stringify(legacyText));
  assert.equal(app.state.overlays.textContent, 'event');
  assert.equal(document.querySelector('.logo-graphic').classList.contains('is-hidden'), false);
  assert.equal(document.getElementById('show-be-arts-logo').disabled, false);

  const valid = app.settings.capture();
  const invalidFiles = ['{', '{}', JSON.stringify({...valid, version: 999})];
  for (const [key, value] of [['moving-shape-count', 1000000], ['geometry-type', 'unknown'], ['show-be-arts-logo', 'yes'], ['logo-accent', 'url(malicious)']]) {
    invalidFiles.push(JSON.stringify({...valid, controls: {...valid.controls, [key]:value}}));
  }
  invalidFiles.push(JSON.stringify({...valid, palette: {...valid.palette, cellNoise: []}}));
  for (const text of invalidFiles) {
    const before = withoutDate(app.settings.capture());
    assert.throws(() => app.settings.apply(text));
    assert.deepEqual(withoutDate(app.settings.capture()), before, 'invalid imports must not modify the editor');
  }
  document.getElementById('download-configuration').click();
  assert.match(downloads.at(-1), /^circle-.*-configuration.json$/);
  assert.equal(document.getElementById('configuration-status').textContent, 'Configuration downloaded.');
  const fileInput = document.getElementById('load-configuration');
  Object.defineProperty(fileInput, 'files', {configurable:true, value:[{size:100, text: async () => JSON.stringify(initial)}]});
  fileInput.dispatchEvent(new dom.window.Event('change'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.getElementById('configuration-status').textContent, 'Configuration loaded.');
  assert.deepEqual(withoutDate(app.settings.capture()), withoutDate(initial));
  assert.equal(fileInput.disabled, false);
  assert.equal(errors.length, 0, errors.map(String).join('\n'));
  console.log('PASS: all circle controls and palette state round-trip for every geometry; invalid files are atomic; download/load UI works');
  dom.window.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
