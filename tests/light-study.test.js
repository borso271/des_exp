const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {JSDOM} = require('jsdom');

test('Light study preserves controls, settings, frame scheduling, and PNG exports', async () => {
  const html = fs.readFileSync('light/index.html', 'utf8');
  const dom = new JSDOM(html, {runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom;
  const frames = new Map();
  const submissions = [];
  const downloads = [];
  const errors = [];
  const values = {};
  let nextFrame = 0;
  let activeUniforms = [];

  // Exercise real renderer control flow with a minimal GPU substitute. Actual
  // shader compilation and appearance are checked in a WebGL-capable browser.
  const gl = {
    LINK_STATUS: 1, ACTIVE_UNIFORMS: 2, MAX_RENDERBUFFER_SIZE: 3, MAX_VIEWPORT_DIMS: 4,
    FRAGMENT_SHADER: 5, VERTEX_SHADER: 6,
    createShader: type => ({type}),
    shaderSource(shader, source) {
      if (shader.type === this.FRAGMENT_SHADER) {
        activeUniforms = [...source.matchAll(/uniform\s+\w+\s+([^;]+);/g)]
          .flatMap(match => match[1].split(','));
      }
    },
    compileShader() {}, getShaderParameter: () => true, deleteShader() {},
    createProgram: () => ({}), attachShader() {}, linkProgram() {},
    getProgramParameter: (_, key) => key === 1 ? true : activeUniforms.length,
    createVertexArray: () => ({}), bindVertexArray() {}, useProgram() {},
    getActiveUniform: (_, index) => ({name: activeUniforms[index]}),
    getUniformLocation: (_, name) => name,
    getParameter: key => key === 3 ? 8192 : [8192, 8192], disable() {}, viewport() {},
    uniform1f: (name, value) => { values[name] = value; },
    uniform2f() {}, uniform3fv: (name, value) => { values[name] = Array.from(value); },
    drawArrays: () => submissions.push({...values})
  };

  window.HTMLCanvasElement.prototype.getContext = () => gl;
  window.HTMLCanvasElement.prototype.toBlob = function (callback) {
    const blob = new Blob([JSON.stringify({width: this.width, height: this.height})], {type: 'image/png'});
    queueMicrotask(() => callback(blob));
  };
  window.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.Blob = Blob;
  window.URL.createObjectURL = blob => { downloads.push(blob); return 'blob:test'; };
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = () => {};
  window.console.error = error => errors.push(error.message);

  const flushFrame = (time = 1000) => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(time));
  };
  const plain = value => JSON.parse(JSON.stringify(value));
  const doc = window.document;
  const input = (selector, value, event = 'input') => {
    const element = doc.querySelector(selector);
    element.value = value;
    element.dispatchEvent(new window.Event(event));
  };
  const load = async data => {
    const file = doc.getElementById('file');
    const text = JSON.stringify(data);
    Object.defineProperty(file, 'files', {configurable: true, value: [{size: text.length, text: async () => text}]});
    file.dispatchEvent(new window.Event('change'));
    await new Promise(resolve => setImmediate(resolve));
  };

  try {
    for (const script of doc.querySelectorAll('script[src]')) {
      assert.equal(script.defer, true);
      window.eval(fs.readFileSync(path.join('light', script.getAttribute('src').split('?')[0]), 'utf8'));
    }
    const api = window.volumetricLight;
    assert.equal(api, window.lightStudy);
    assert.equal(api.getDiagnostics().ready, true);
    assert.equal(doc.querySelectorAll('#fields details').length, 5);
    assert.equal(doc.querySelectorAll('#fields label.row').length, 39);
    const defaults = plain(api.getParameters());
    assert.equal(defaults.bloom, 0);
    flushFrame();
    assert.equal(frames.size, 0, 'static mode stops after one frame');
    assert.equal(submissions.at(-1).uTime, 0);

    const copy = api.getParameters();
    copy.zoom = 2;
    assert.equal(api.getParameters().zoom, 1, 'API returns a copy');
    input('[data-key="zoom"][type="range"]', '1.4');
    assert.equal(api.getParameters().zoom, 1.4);
    assert.equal(doc.querySelector('[data-key="zoom"][type="number"]').value, '1.4');
    api.setParameters({apexX: 20, beamTint: '#ABCDEF'});
    assert.equal(api.getParameters().apexX, 0.95);
    assert.equal(api.getParameters().beamTint, '#abcdef');
    const beforeInvalid = plain(api.getParameters());
    assert.throws(() => api.setParameters({zoom: 1.9, unknown: 1}), /Unknown parameter/);
    assert.deepEqual(plain(api.getParameters()), beforeInvalid, 'invalid patches are atomic');
    assert.throws(() => api.setParameters({quality: 3}), /Quality/);
    assert.throws(() => api.setParameters({animate: 'yes'}), /boolean/);
    const complete = plain(api.getState());
    for (const invalid of [
      {parameters: {zoom: 1}, time: 0},
      {...complete, time: -1},
      {...complete, parameters: {...complete.parameters, zoom: 100}},
      {...complete, parameters: {...complete.parameters, extra: true}}
    ]) {
      assert.throws(() => api.setState(invalid));
      assert.deepEqual(plain(api.getState()), complete, 'invalid full states do not mutate the composition');
    }
    api.setState({...complete, time: 2.5});
    assert.equal(api.getState().time, 2.5, 'full state retains animation time');
    api.setState(complete);

    api.setControlsVisible(false);
    assert.equal(doc.getElementById('panel').hidden, true);
    window.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'h'}));
    assert.equal(doc.getElementById('panel').hidden, false);
    const number = doc.querySelector('[data-key="zoom"][type="number"]');
    number.focus();
    window.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'r'}));
    assert.equal(api.getParameters().zoom, 1.4, 'typing does not invoke shortcuts');
    number.blur();

    api.setParameters({frame: 'clean', quality: 1.5, animate: true});
    flushFrame(2000);
    assert.equal(frames.size, 1);
    assert.ok(submissions.at(-1).uTime > 0);
    api.setParameters({animate: false});
    flushFrame(3000);
    assert.equal(frames.size, 0);
    assert.equal(submissions.at(-1).uTime, 0);
    doc.getElementById('save').click();
    const saved = JSON.parse(await downloads.at(-1).text());
    assert.equal(saved.format, 'light-reference-v2');
    assert.equal(saved.version, 2);
    api.reset();
    assert.deepEqual(plain(api.getParameters()), defaults);
    await load(saved);
    assert.deepEqual(plain(api.getParameters()), saved.parameters);
    assert.equal(doc.getElementById('notice').textContent, 'Settings loaded.');
    await load({zoom: 1.2});
    assert.equal(api.getParameters().zoom, 1.2, 'plain parameter files still load');

    flushFrame();
    const dimensions = {width: doc.getElementById('art').width, height: doc.getElementById('art').height};
    const blobs = await Promise.all([api.renderToBlob(512), api.renderToBlob(768)]);
    assert.deepEqual(await Promise.all(blobs.map(async blob => JSON.parse(await blob.text()))), [
      {width: 512, height: Math.round(512 / (2047 / 1158))},
      {width: 768, height: Math.round(768 / (2047 / 1158))}
    ]);
    assert.equal(doc.getElementById('art').width, dimensions.width);
    assert.equal(doc.getElementById('art').height, dimensions.height);
    await assert.rejects(api.renderToBlob(100), /at least 128/);
    await assert.rejects(api.renderToBlob(9000), /safe GPU limit/);
    const png = await api.exportPNG(512);
    assert.equal(downloads.at(-1), png, 'PNG download receives the rendered blob');

    const canvas = doc.getElementById('art');
    canvas.dispatchEvent(new window.Event('webglcontextlost', {cancelable: true}));
    assert.equal(api.getDiagnostics().ready, false);
    assert.equal(frames.size, 0);
    await assert.rejects(api.renderToBlob(512), /not available/);
    canvas.dispatchEvent(new window.Event('webglcontextrestored'));
    assert.equal(api.getDiagnostics().ready, true);
    flushFrame();
    assert.equal(errors.length, 0);
  } finally {
    window.close();
  }
});
