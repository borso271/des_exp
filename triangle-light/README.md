# Triangle / Light

A standalone WebGL2 light composition. Open `index.html` directly in a
browser, or serve the parent directory and visit `/triangle-light/`.
No external libraries or build step are required. Keep the parent `js/shared/`
folder alongside this project when copying it.

- `index.html`: page structure, canvas, and control containers.
- `styles.css`: layout, controls, and responsive styling.
- `palette.js`: maps generated palettes to the four lighting roles and derives
  the bloom and floor tints.
- `../js/shared/color-palettes.js`: shared palette generation and color conversion,
  also used by the Canvas Light Columns demo.
- `app.js`: parameter schema, GLSL shaders, WebGL renderer, controls,
  pointer interaction, settings import/export, and PNG export.

The script loads after the HTML so its DOM elements are available. It stays
a classic script so opening the page via `file://` continues to work.
The existing `window.lightStudy` API is unchanged; see the comment at the
start of `app.js` for its methods.

`../triangle-light.html` redirects here for existing bookmarks.

In **Color / palette**, choose a style, adjust base hue and color variation,
or edit the four colors individually (which switches the style to Custom).
Named palettes start with their original hues; base hue rotates them as a group.
Original blue and Reference reset restore the reference colors. Palette choices
and manual colors are included in saved JSON and used for PNG export. Existing
version 1 settings files remain supported.

Under **Room / spill / floor**, turn off **Show floor** to remove the floor
plane and its reflected light, leaving the wall and glow behind the triangle.
The floor settings are retained while disabled. The toggle is saved in JSON
and applies to PNG exports; older settings files default to showing the floor.
