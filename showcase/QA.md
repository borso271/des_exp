# First-version verification — 2026-09-09

- All 21 repository test files passed after a clean `npm ci` with the lockfile.
- Renderer snapshots match their prototype source; all four fallback files match
  the checked-in presets. The Pages build contains 37 files (1.86 MiB) and checks
  HTML, CSS, SVG, and module dependencies for missing or root-relative assets.
- The five directions were viewed in a real browser at 1280px and in 390px-wide
  portrait frames. The portrait document had no horizontal overflow; its hero
  measured 358 × 409.14 CSS pixels. The mobile menu opened and closed with focus
  returning to its trigger.
- The original page was compared with an independent local reference made from
  Be Art's existing pre-rendered HTML plus its current source CSS. Header, hero,
  logo, first heading, reading column, and footer position matched exactly at
  1280px. Footer height includes 80px of added clearance for the selector.
  The mobile photographic crop, logo, typography, and editorial spacing also
  matched the reference visually.
- Direct selection reloads, back/forward history, pause/resume, and repeated
  direction switches were exercised in the browser. Each art selection retained
  one canvas; Original retained none. No application errors or WebGL context-limit
  warnings were reported in this run.
- Local-only browser harnesses verified a reduced-motion media result (initial
  still frame and disabled motion button) and unavailable Canvas/WebGL (SVG
  fallback, including a visual triangle check). The lifecycle test also verifies
  off-screen/hidden-page suspension, canceled frames, detached observers, context
  loss, late module imports, and exactly-once renderer disposal.
- A before/after size, modification-time, mode, and symlink-target audit of all
  56,209 files/symlinks under `../beartgroup` found zero changes. No commands that
  build, install, serve Next.js, or write files were run in that project.

The local reference and fault-injection harnesses live in ignored `_qa/`; none
are in the deployment artifact. Phone checks validate responsive browser layout,
not a particular physical phone/GPU. GPU-light fallbacks are approximations.

## Ellipse image update — 2026-09-09

- Replaced the amber ellipse preset with the supplied blue
  `ellipse-light-2400x1286.png`; the copied asset has the same SHA-256 as the input.
- Browser preview shows the PNG with a transparent shade layer, no active canvas,
  and no pause button. Switching from the moving composition back to the image
  disposes the canvas and returns to still mode.
- All 21 test files passed, including the image selection lifecycle and the Pages
  artifact's byte-for-byte copy of the PNG. Work was confined to DESIGN_EXP.

## Fitted blue and gold ellipses — 2026-09-09

- Replaced the blue PNG presentation with the original ellipse shader and added
  a separate gold direction. Palettes were recovered from the supplied exports;
  both presets remain static, without a dark overlay.
- All 21 test files passed. Geometry checks cover desktop, portrait, square, and
  very wide banners, preserving ellipse proportions and a minimum 6% margin
  around the softened outer edge. Switching and rendering-failure checks cover
  all six directions and the fitted SVG fallbacks.
- Both colours were viewed at 1280px and 390px browser widths. The outer ellipse
  remained fully visible; each selection used one canvas and no animation loop.
  A forced WebGL failure also showed an uncropped gold fallback on mobile.
- Changes were confined to DESIGN_EXP; the Be Art project was not modified.
