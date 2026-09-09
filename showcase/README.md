# Be Art art-direction showcase

The root `index.html` is a static Spanish homepage reproduction with five curated
hero directions. The selector updates `?art=original|ellipses|squares|triangle|moving`;
copy the browser URL to share a selection. Back/forward navigation restores it.

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
and motion. Keep the five `index.html` selector options in sync. The white logo,
hero dimensions, page content, and layout remain consistent between directions.

- Original: the existing photographic desktop and mobile hero crops.
- Elipses azules: the supplied `ellipse-light-2400x1286.png`, displayed as a static
  image with no dark overlay. The image fills the hero with a centered crop.
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

`vendor/` contains rendering-only snapshots extracted from the prototypes. Refresh
them after deliberately changing their source renderers:

```sh
npm run sync:showcase
```

This also regenerates fallback SVGs. `check:showcase` detects stale snapshots and
fallbacks. No prototype bootstrap, controls, export UI, or iframe is shipped.

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
