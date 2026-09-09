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

## Shared banner editor — 2026-09-09

- All 22 repository test files passed, including the new editor/configuration
  suite. Renderer snapshots and fallback generation checks passed. The Pages
  artifact contains 43 files (1.89 MiB); all local dependencies resolve.
- Real-browser workflow checks passed at 1280 × 720 and 390 × 844, and at the
  mobile size with reduced motion and with Canvas/WebGL deliberately unavailable.
  The checks edited ellipse geometry/exposure, palettes across all engines,
  nested-square ratios, triangle light/floor, moving shape count/seed/motion,
  manifesto/custom typography, and text placement. The ellipse pixel output
  changed immediately when exposure changed. Each active engine kept one canvas;
  unavailable renderers used no canvas and displayed edited SVG fallbacks.
- The manifesto rows measured equal widths (512.65625px in the desktop editor,
  149.1640625px in the mobile editor), and the entire block was vertically centred.
  A font-loading check caught and fixed a delayed Solea fitting issue. Text layout
  now refreshes when fonts finish loading.
- Closing/reopening, switching directions, browser history, reset, JSON round-trip,
  invalid imports, pause/resume, and reduced motion passed in the browser harness.
  Lifecycle tests additionally verify no resource allocation on slider updates,
  preserved playback during edits, late-import edits, context loss and disposal.
- Native file-chooser import restored a triangle configuration and custom Poppins
  text. The native downloaded JSON was found in Downloads and matched the imported
  art/text settings exactly. The in-app browser's download-event observer timed
  out, so the saved file's bytes were used as the authoritative result.
- Standalone ellipse, triangle-light and Canvas Light Geometry pages initialized
  their canvases without browser errors. The original moving-shapes lab produced
  18 SVG shapes and its pause/resume control worked. Existing lab regression tests
  also passed; no standalone lab source files were modified.
- The mobile editor keeps a 253.75 × 290px portrait banner above its panel. Its
  controls scroll independently. Desktop controls stay alongside the banner.
  Off-screen iframe animation correctly suspended; motion checks were rerun with
  each test viewport visible independently.

Browser harnesses and their JSON fixtures remain in ignored `_qa/`. All changes
for this update are confined to DESIGN_EXP; no Be Art files were read or written.
