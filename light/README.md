# Light in darkness

A standalone, image-free WebGL2 light study. Open `index.html` directly, or
serve the repository and visit `/light/`. No dependencies or build step are
required. Keep this folder's files together. The optional landing-page embed
also uses the parent repository's `js/shared/` files and shared text assets.

- `index.html`: page structure and control containers.
- `styles.css`: layout, typography, controls, and responsive styles.
- `parameters.js`: reference preset, control groups, ranges, and validation.
- `shaders.js`: vertex and fragment GLSL, including the optical calibration.
- `renderer.js`: WebGL setup, uniform updates, sizing, animation scheduling,
  context recovery, and queued PNG rendering.
- `files.js`: downloads and JSON settings serialization/parsing.
- `controls.js`: parameter fields, toolbar actions, keyboard shortcuts, and
  pointer dragging.
- `app.js`: connects state, controls, and renderer; exposes the public API.

Scripts use private scopes and one internal `LightStudyModules` namespace.
They load in the order declared in the HTML with `defer`, so the DOM is ready
before startup. Classic scripts preserve direct `file://` use without module
fetches or a local server.

## Public API

`window.volumetricLight` and `window.lightStudy` refer to the same API:

- `setParameters(patch)`: validate all keys, clamp numeric ranges, then apply.
- `getParameters()`: an independent copy of the current parameters.
- `reset()`: restore the reference preset.
- `exportPNG(width = 3072)`: render, download, and return a PNG Blob.
- `renderToBlob(width = 3072)`: render a PNG Blob without downloading.
- `setControlsVisible(visible)`: show or hide the panel.
- `getDiagnostics()`: renderer readiness, dimensions, limits, and draw count.
- `getState()`, `validateState(state)`, `setState(state)`: complete parameters
  and animation time, with strict validation before restoration.
- `renderAt(time)`: render at a specified animation time.

Settings retain the `light-reference-v2` / version 2 JSON format. Plain
parameter objects can also be loaded. All updates go through the same
validator. `H` toggles controls, `F` toggles fullscreen, and `R` resets;
shortcuts ignore editable fields. Drag the canvas to move the source.

## Landing-page banner

The root showcase's `?art=light` direction loads this exact document with
`?embed=1`. The shared bridge places the canvas inside the banner and exposes
the entire native panel through **Mostrar parámetros**. The same shared logo,
manifesto, custom text, typography, positioning, and blend effects used by the
other labs are added above the art. No alternative renderer is maintained.

The host preset selects **Fill window**, sized to the banner rather than the
editor's whole iframe. Other native framing choices remain available. Drift
starts disabled; when enabled it respects host pause, reduced motion, and page
visibility. Configurations save the complete art state, animation time, and
shared text settings. Native PNG and JSON buttons retain their art-only output.
Switching to another direction stops animation and releases the WebGL context.

## Optical model

This is a reference-calibrated 2.5D optical model, not a reconstruction of an
unknown physical lamp, lens, or room from a photograph. Seven Hermite control
stations describe depth response, chromatic spread, and cross-section. Sparse
elliptical annular and Gaussian fields model the optical arch, attenuation in
haze, and lens ghosts. These are model coefficients, not image textures.

Calibration profiles combine in developed-photograph appearance space, then
decode to linear light before exposure, optional extra bloom, highlight
compression, and a single sRGB encoding. The reference already includes fitted
camera diffusion, so extra bloom starts at zero. Rendering uses one highp
WebGL2 fragment pass with no textures, libraries, or float-buffer extension.
Frames render on demand unless atmospheric drift is enabled.
