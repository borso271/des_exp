# Design experiments

Standalone browser studies in geometry, color, light, and typography, using SVG,
Canvas, and WebGL. No build step is needed to view the artwork.

`index.html` presents six curated hero directions and an optional banner editor in a static reproduction of the
Spanish Be Art homepage. See [showcase documentation](showcase/README.md) for
presets, validation, and the isolated GitHub Pages deployment.

From this directory, start a local server:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open a study at `http://127.0.0.1:8765/`:

| Study | Path |
| --- | --- |
| Circle / geometric poster | `circle.html` |
| Canvas light geometry poster | `canvas_light_columns_demo.html` |
| Moving shapes | `moving_shapes/moving_shapes.html` |
| Triangle light | `triangle-light/` |
| Triangle color field | `triangle_color_field/` |
| Concentric ellipse light | `turrell-ellipse-light/` |
| SVG light columns | `svg_light_columns_demo_v2.html` |

The root HTML files for the triangle and ellipse projects redirect to their
respective folders. `circle copy.html` is retained as an earlier variation.

Shared code lives in `js/`; project-specific behavior lives alongside each study.
Keep the image, SVG, and font assets with the code. The embedded default image in
`js/light-columns/default-image-data.js` is included for local-file image export;
its generation script lives in `scripts/`. Font provenance is documented in
`fonts/README.md`.

## Checks

Regression checks live in `tests/` and use Node.js 22 or later. Install the pinned
development dependency and run from the repository root:

```sh
npm ci
npm test
```

WebGL appearance and image exports should also be checked in a browser.
