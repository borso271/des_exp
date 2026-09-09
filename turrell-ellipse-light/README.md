# Concentric Ellipse Light Study

Open `index.html` directly in a browser, or serve the parent directory and visit
`/turrell-ellipse-light/`. No external libraries or build step are required.

- `index.html`: page structure, canvas, and controls.
- `styles.css`: layout and responsive control styling.
- `app.js`: parameters, GLSL shaders, WebGL rendering, controls, pointer interaction,
  JSON settings import/export, and PNG export.
- `palette.js`: color studies, palette mapping, lightness profiles, manual color
  handling, and palette settings validation.
- `../js/shared/color-palettes.js`: palette generation and color conversion shared
  with the other studies. Keep this parent folder when copying the project.
- `redirect.js`: compatibility redirect for the original root HTML page, preserving
  query parameters (including `?clean`) and URL fragments.

The app loads as a classic script after the HTML, so local `file://` use continues
to work. Rendering, shortcuts, and the `window.ellipseLight` API are unchanged.
The original `../turrell-ellipse-light.html` URL redirects to this project.

Color palette offers the original green study plus amber, dusk, violet, glacial,
ember, and silver studies. Choose from the shared color harmonies and named
palettes, then adjust hue rotation, saturation, and lightness. Generated harmonies
also offer base hue and seeded variations. Geometry edits never change the seed.

Color progression / light maps the palette onto the five ellipses: even, changes
near the core or outside, out and back, or alternating hues. Palette range and
offset select a portion of the palette; direction reverses its order. Interpolation
can follow hue, mix linear RGB light, or use discrete source colors. Luminous-core,
dark-core, and alternating lightness profiles have adjustable strength. The
background can follow the outer ellipse, use its complementary hue, or stay
independent, with a lightness offset for the linked modes.

Individual field pickers show the final assigned colors, before the renderer's
exposure and atmospheric effects. Editing one captures all displayed colors as a
custom palette and neutralizes previous palette adjustments, so every other field
stays visually unchanged. Further global adjustments start from that custom palette.

Save JSON includes palette settings, seed, custom source colors, and the assigned
colors. Load JSON also accepts the original files containing only geometry and
individual colors. Reset colors restores the original green palette while keeping
geometry; Reset reference restores the entire original composition. PNG export uses
the same assigned colors as the preview.
