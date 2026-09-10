# Be Art art-direction showcase

The root landing page is a fixed Spanish Be Art homepage reproduction. Its
banner loads the **actual lab document** selected by Dirección artística.
Mostrar parámetros reveals the original lab controls alongside the banner on
wide screens and below it on narrow screens. Hiding controls preserves the art.
No code in `../beartgroup` is modified, built, or run by this project.

The seven selection URLs are:
`?art=original|ellipses|ellipses-gold|squares|triangle|moving|light`.
A URL shares the curated starting direction. Download JSON to share an edited
composition, including its complete native settings and text treatments.

## Running and publishing

```sh
npm ci
python3 -m http.server 8765 --bind 127.0.0.1
npm test
npm run check:showcase
npm run build:showcase
```

Open `http://127.0.0.1:8765/`. HTTP is needed for modules, same-origin messages,
and the canonical text-control markup. The original standalone labs retain their
URLs. `scripts/build-showcase.mjs` stages the homepage, selected lab documents,
and their local dependencies in `_site/`. It excludes other experiments, local
QA files, tests, documentation, and the user's reference PNGs. Nothing requires
Vercel or a backend. The existing GitHub Actions workflow deploys this artifact
to GitHub Pages on pushes to `main`.

## Preview access

The landing page starts with a browser password screen. It remembers access in
session storage for the current tab and repository path, then loads the showcase
module and selected lab. Direct composition links keep their selection. The
configured SHA-256 digest lives in `showcase/access-config.js`; changing it also
invalidates remembered access. If session storage is unavailable, entry still
works for the current page.

This is a courtesy barrier for casual visitors, not server authentication or
encryption. The published lab URLs, assets, and public repository remain
accessible. Standalone lab pages are not gated.

## Native embedding

`showcase/presets.js` maps names and URLs to native starting configurations:

| Direction | Actual source |
| --- | --- |
| Original | Existing desktop/mobile homepage photographs |
| Elipses azules / Elipses doradas | `turrell-ellipse-light/index.html` |
| Campos de color | `canvas_light_columns_demo.html`, native nested-square preset |
| Umbral azul | `triangle-light/index.html`, without the floor |
| Composición viva | `moving_shapes/moving_shapes.html` |
| Luz en la oscuridad | `light/index.html`, with the frame filling the banner |

Blue/gold use the supplied palettes, with the default outer ellipse sized inside
the banner. Native geometry remains native: changing frame proportions has the
same effect as resizing the original lab. The moving starting configuration
stores the actual lab-generated normalized sites and palette noise in
`compositions/moving.json`; it is reproducible without an alternative generator.

`js/shared/lab-embed.js` does nothing unless `?embed` is present. In embed mode it
moves the existing artwork and controls into two regions **within their original
document**. Their event handlers, conditional controls, palette logic and renderer
continue to run. `showcase/lab-host.js` mounts that document in a same-origin
iframe and exchanges layout, complete state, pause/visibility and cleanup
messages. It does not draw art or select which art parameters are editable.

The default iframe covers the landing-page banner. Editing expands its viewport
into an artwork preview plus the original control panel. There are no copied
shader snapshots, replacement geometry algorithms, or reduced parameter forms.
The Canvas lab retains every geometry and aesthetic, including its image layer,
rich gradient mapping, generated/manual palettes and hover effects.
The Light study retains all 39 composition/optical parameters, framing, quality,
native JSON/PNG exports, dragging, and optional atmospheric drift. Its renderer
sizes to the banner rectangle, including while the editor is open. Its starting
preset uses the native viewport framing and static reference light.

A selected lab responds to host pause/reduced motion and page visibility. State
captures animation time where relevant. The parent waits for the old lab to
acknowledge disposal before removing its iframe. A replacement lab may briefly
coexist, paused and hidden, while its settings are validated; this allows an
invalid import to leave the displayed composition untouched.

## Shared text and effects

`js/shared/poster-text.js` and `.css` are extracted from the original Canvas text
implementation and are also used by the standalone Canvas page. The canonical
control fieldset and logo/text markup remain in `canvas_light_columns_demo.html`.
Other embedded labs load that markup instead of maintaining another form.

All original treatments remain: museum invitation, Renaissance copy, BE ART plus
NEW RENAISSANCE, MANIFESTO, and the two-line Solea NO SOMOS / ESPECTADORES title.
Logo only, custom multiline text and no text are also available. Typography and
block placement controls complement the original layout and centering options.
Solea and Poppins load from local font files.

The five original text modes are solid black, solid white, invert, difference,
and accent. The eight logo modes additionally include glass, hypercolor and hue
shift, with their native strength, opacity, blur, hue and accent controls. Text is
inside the same artwork document and compositing surface. Positioned text uses
layout offsets rather than a transformed overlay that would isolate blending.

## Complete configurations

The outer JSON document uses `format: "be-art-native-banner"`, `version: 2`,
`direction`, `lab`, `paused`, and `state: {native, text}`. It has a 32 MB import
limit to accommodate embedded local images. Its envelope is validated by
`showcase/config.js`; each actual lab validates its own complete native state.
The shared text module validates its whole control set. Unsupported versions,
missing fields, unknown controls and invalid values are rejected before visible
state changes. Earlier simplified version-1 showcase files are explicitly
unsupported, because they do not contain complete native settings.

Canvas state reuses its existing native settings document and preserves all
manual palette slots and inactive palette counts. A local background image is
stored with its original image bytes (including SVG) so it survives switching/reloading without
reselecting the file. Canvas native and shared text settings must agree. A file
that references a not-yet-selected image preserves that empty selection state.

Each direction keeps an independent in-memory draft until reload. Reset restores
the curated starting configuration of the selected direction, including text.
Download JSON saves the current animation frame and host pause state. The native
labs' own export/import buttons remain available with their original formats.

## Adding another lab

1. Inventory its complete native controls and capabilities before adapting it.
2. Add its artwork/panel selectors to `js/shared/lab-embed.js`, and include that
   script before the original app bootstrap. Keep the original entrypoint.
3. Register native `getState`, strict `validateState`, atomic `setState`, `reset`,
   `resize`, `isAnimated`, `syncMotion`, `renderAt` and `dispose` methods. Implement
   these in the native source using its own existing settings/rendering code.
   Respect `LabEmbed.motionAllowed` for motion and `LabEmbed.size` for sizing.
   Report programmatic/asynchronous state changes through `LabEmbed.changed()`.
4. Add a descriptor to `showcase/presets.js` and a matching selector option.
   A preset is native settings or a native preset name, not a new generator.
5. Include its actual runtime dependencies in `scripts/build-showcase.mjs`.
6. Verify complete controls, equivalent native/embedded artwork at matching
   dimensions and time, text compositing, JSON fidelity, responsive layout,
   pause and cleanup. Do not substitute mock renderer tests for visual parity.

## Homepage provenance

The Be Art source was inspected read-only on 2026-09-09. The pre-rendered Spanish
homepage supplied markup; current homepage CSS and source supplied the hero crop
and hidden-tagline behavior. The optional unpublished event teaser is omitted.
Navigation goes to the real site; no forms/backend functions are reproduced.
Styles and required public assets were copied locally. Poppins's OFL is included;
Solea is the supplied identity font already present in this repository. The
homepage photograph's original attribution remains in the footer.
