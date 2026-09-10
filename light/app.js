(() => {
  'use strict';

  const {defaults, validate, createRenderer, createControls, files} = window.LightStudyModules;
  const params = {...defaults};
  const canvas = document.getElementById('art');
  const status = document.getElementById('status');
  const errorElement = document.getElementById('error');

  function showError(error) {
    errorElement.style.display = error ? 'block' : 'none';
    if (!error) return;
    errorElement.textContent = 'The renderer could not start.\n\n' + String(error.message || error)
      + '\n\nThis file requires WebGL2. Enable graphics acceleration in your browser and reopen it.';
    status.textContent = 'Renderer unavailable';
    window.LabEmbed?.fail(error.message || error);
    console.error(error);
  }

  const renderer = createRenderer(canvas, params, {
    onStatus: message => { status.textContent = message; },
    onError: showError,
    getBounds: () => window.LabEmbed?.size || {width: innerWidth, height: innerHeight},
    motionAllowed: () => !window.LabEmbed || window.LabEmbed.motionAllowed
  });

  function setParameters(update) {
    // Validate the whole patch before changing any state or controls.
    const checked = validate(update);
    Object.assign(params, checked);
    controls.sync();
    if ('frame' in checked || 'quality' in checked) renderer.resize();
    else renderer.requestRender();
    if ('animate' in checked) renderer.syncMotion();
    window.LabEmbed?.changed();
    return {...params};
  }

  function reset() {
    Object.assign(params, defaults);
    renderer.restartAnimation();
    controls.sync();
    renderer.resize();
    renderer.requestRender();
    window.LabEmbed?.changed();
  }

  function getState() {
    return {parameters: {...params}, time: renderer.getTime()};
  }

  function validateState(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).length !== 2 || !Object.hasOwn(input, 'parameters')
      || typeof input.time !== 'number' || !Number.isFinite(input.time) || input.time < 0) {
      throw new TypeError('Expected complete light parameters and animation time.');
    }
    const parameters = validate(input.parameters);
    if (Object.keys(defaults).some(key => !Object.hasOwn(parameters, key))) {
      throw new TypeError('Incomplete light parameters.');
    }
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== input.parameters[key]) throw new TypeError(`Invalid light parameter: ${key}`);
    }
    return {parameters, time: input.time};
  }

  function setState(input) {
    const next = validateState(input);
    Object.assign(params, next.parameters);
    controls.sync();
    renderer.renderAt(next.time);
    window.LabEmbed?.changed();
  }

  async function exportPNG(width = 3072) {
    const blob = await renderer.renderToBlob(width);
    files.download(blob, `light-reference-v2-${Math.round(width)}.png`);
    return blob;
  }

  const controls = createControls(canvas, params, {
    setParameters, reset, exportPNG, restartAnimation: renderer.restartAnimation
  });

  // Preserve both public names for embedding, automation, and existing callers.
  const api = {
    getParameters: () => ({...params}),
    setParameters, reset, exportPNG,
    renderToBlob: renderer.renderToBlob,
    setControlsVisible: controls.setVisible,
    getDiagnostics: renderer.getDiagnostics,
    getState, validateState, setState, renderAt: renderer.renderAt
  };
  window.volumetricLight = api;
  window.lightStudy = api;

  try {
    renderer.initialize();
    window.LabEmbed?.register({
      getState, validateState, setState, reset, applyPreset: setParameters,
      resize: renderer.resize, syncMotion: renderer.syncMotion,
      isAnimated: () => params.animate, renderAt: renderer.renderAt,
      dispose: renderer.dispose
    });
  } catch (error) { showError(error); }
})();
