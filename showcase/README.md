# Be Art art-direction showcase

The root `index.html` is a static Spanish homepage reproduction with six curated
hero directions. The selector updates `?art=original|ellipses|ellipses-gold|squares|triangle|moving`;
copy the browser URL to share a curated selection. Back/forward navigation restores
the selection and its in-session edits. Custom edits travel in a JSON file, not
in the URL.

## Preview and checks

From the repository root:

```sh
npm ci
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. Serving HTTP is required for the ES modules.
The older standalone prototype pages keep their existing URLs and behavior.

```sh
npm test
npm run check:showcase
npm run build:showcase
```

The build stages only `index.html` and the required showcase assets/modules in
`_site/`, validates relative asset paths, and adds `.nojekyll`. It needs no access
to the Be Art project. The GitHub Pages workflow tests and publishes this artifact
on pushes to `main`; it does not publish the prototype pages, tests, docs, or local
QA files. Repository Settings → Pages must use **GitHub Actions** as its source.

## Curating directions

Edit `presets.js` for names, deterministic seeds, palettes, geometry, shading,
and motion. Keep the `index.html` selector options in sync. These defaults are the clean starting points. The editor can change the art and
text while keeping the surrounding page unchanged.

- Original: the existing photographic desktop and mobile hero crops.
- Elipses azules / Elipses doradas: static shader compositions with palettes
  recovered from the supplied blue and gold exports. Both preserve the original
  ellipse proportions and fit the complete soft outer edge within a 6% banner
  margin on every screen. The default has no dark overlay or breathing animation; both can be edited.
- Campos de color: four offset, nested squares; static.
- Umbral azul: the triangle's original WebGL light pipeline, without the floor;
  static, with portrait geometry fitted to the banner.
- Composición viva: seeded weighted Voronoi cells, with restrained motion.

`renderers/` adapts the studies to the banner. `controller.js` owns the canvas,
animation time, resize/intersection observers, reduced-motion preference,
visibility handling, and disposal. Only the selected renderer is instantiated.
Image presets use their local `image` asset directly, without a canvas or animation.
Animated directions can be paused; reduced motion uses their initial frame.
Rendering failures and WebGL context loss display a local SVG fallback. Light
fallbacks approximate the composition; they do not reproduce the GPU bloom exactly.
The shared `fallback.js` generates parameter-aware SVGs at the current banner
ratio, so edits and resizing also work without WebGL. These are approximate
lighting previews. The fixed files in `assets/` remain curated loading fallbacks.

`vendor/` contains rendering-only snapshots extracted from the prototypes. Refresh
them after deliberately changing their source renderers:

```sh
npm run sync:showcase
```

This also regenerates fallback SVGs. `check:showcase` detects stale snapshots and
fallbacks. Prototype bootstrap and prototype pages are not shipped; the showcase
has its own shared editor and does not embed labs in iframes.

## Editing a banner

Choose **Editar banner** in the direction selector. The editor stays beside the
banner on desktop and below a fitted portrait preview on mobile. Closing it (or
pressing Escape) returns to the landing page with the current composition intact.

- **Arte:** choose a direction, a palette family, or individual colours.
- **Texto:** BE ART logo, the two-line NO SOMOS / ESPECTADORES treatment, custom
  multiline copy, or no text. Choose size, colour, line spacing, block width and
  placement. Vertical centring applies to the complete text block. Manifesto rows
  share a width, with NO and SOMOS at opposite ends. Custom copy has left, centre
  and right alignment. Text size is relative to banner width and is capped to fit
  the available block. The logo has width/colour/placement controls only.
- **Parámetros:** geometry and light controls depend on the current engine.
  Ellipses support optional breathing; moving cells support animation speed,
  initial phase and a deterministic seed. Pause is available outside the panel.
  Reduced motion disables animation. Other directions are still compositions.

The local fonts are Solea Regular and Poppins ExtraLight/Light/Regular. Solea's
unavailable weights are not offered. Font loading triggers a fresh text fit.

Each direction keeps an independent draft (including text) until the page reloads.
**Restaurar dirección** resets only the active direction, including its text.
**Descargar JSON** saves the active draft; **Cargar JSON** restores it and selects
its direction. Files are processed locally. No backend or Be Art site access is
involved. Downloads contain `format: "be-art-banner"`, `version: 1`, and `config`
with the direction/engine, seed, palette, geometry, light, motion, shade and text.
Invalid files are rejected atomically with a visible message. Animations restart
from the saved initial phase; elapsed playback time and the pause button are not
part of a saved configuration.

## Adding an engine or preset

1. Add a curated object to `presets.js` and a matching option to `index.html`.
   Keep its ID stable because URLs and saved configurations use it. Blue/gold
   ellipses demonstrate multiple directions using the same engine.
2. For a new engine, add a rendering-only adapter in `renderers/` and register its
   dynamic import in `app.js`. Implement `create(canvas, config)`, returning
   `update(config)`, `render(width, height, elapsedSeconds)`, and `dispose()`.
   `update` should change settings without recreating GPU resources. The controller
   owns sizing, scheduling, pause, visibility and canvas lifecycle. A still engine
   redraws on selection, settings changes and resize, without an animation loop.
3. Reuse an existing rendering module or add a deliberate extraction to
   `scripts/sync-showcase-renderers.mjs`. Keep the original lab functional. Current
   snapshots reuse triangle light, ellipse shaders, nested geometry and moving
   cells. The ellipse adapter adds physical-coordinate rotation and containment
   around the original shader; it does not change the standalone shader.
4. Define editable fields, labels, bounds and choices in `schema.js`. It drives both
   the UI and `config.js` validation. Palette sizes follow each preset; triangle
   colours map to light/edge/spill/ambient roles. Non-editable engine constants stay
   pinned. Add cross-field checks where necessary (e.g. decreasing ellipse rings).
5. Extend `fallback.js` for the engine, then run `npm run sync:showcase`. Add any
   new top-level public module to `scripts/build-showcase.mjs`. Assets/styles and
   renderer/vendor modules in their existing public folders are already copied.
6. Cover the new config, update/disposal behaviour and responsive rendering in
   tests and browser checks. Run the three checks above. If changing the saved
   configuration contract, deliberately version it and add an import migration.

`text-layer.js` is shared across all engines; it never draws text into the GPU
canvas. `editor.js` contains the controls, while `config.js` owns validated clones
and per-direction drafts. The curated preset objects remain immutable.

## Homepage provenance

The source was inspected read-only in `../beartgroup/site` on 2026-09-09. No build,
install, development server, or file mutation was performed there. The existing
pre-rendered Spanish homepage supplied the static markup; current `CorePage.tsx`
and source CSS supplied the latest hero crop and hidden-tagline behavior.
The optional unpublished event teaser is omitted, matching the existing build.

Styles were copied from `app/globals.css`, `styles/tokens.css`, and the homepage,
header, footer, and mobile-menu CSS modules; classes were scoped for this page.
The selector and footer clearance are presentation additions. Navigation goes to
the real Be Art site, and no forms or backend features are reproduced.

Local assets come from `public/brand`, the five homepage files in
`public/media/phase-3/2026/05`, `app/icon.svg`, and `app/fonts`. Poppins's OFL is
included. Solea is the same supplied identity font already used in this repository.
The diagram SVGs retain their fallback typography; their ineffective external
Google Fonts imports were removed to keep rendering self-contained.
The homepage photograph's original attribution remains in the footer.

This is a fixed review snapshot, not an automatically synchronized copy of Be Art.
