# Triangle Color Field

Open `index.html` directly in a browser, or serve the parent directory and
visit `/triangle_color_field/`. No external libraries or build step are required.
Keep the parent `js/shared/` folder when copying the project.

- `index.html`: page structure, controls, and composition container.
- `styles.css`: responsive layout and triangle styling.
- `app.js`: palette state, studies, composition rendering, and controls.
- `color-field.js`: color interpolation, palette sampling, and triangle mapping.
- `../js/shared/color-palettes.js`: palette families shared with the other demos.

The JavaScript is a classic script loaded after the HTML, preserving support
for opening the page with `file://`.

`../triangle_color_field.html` redirects here for existing bookmarks.

Manual palettes support 2–8 editable stops. Generated palettes offer near
monochrome, analogous, complementary, split complementary, triadic, random,
ocean, sunset, candy, forest, neon, and grayscale. Editing a generated swatch
switches to manual colors. Source switching retains each source's palette.

Progression can follow triangles, columns, opposing directions, the distance
from the center, or a seeded scatter. Span, offset, direction, curve, and second
triangle shift control the mapping. Outside the palette, hold, mirror, repeat,
or blend the last color back into the first with Seamless loop.

Transitions can be continuous, soft near stops, or discrete. Continuous color
blending supports perceptual OKLab (the original behavior), linear RGB, and HSL.
Color studies offer examples and restore the original coral/violet progression
without changing the geometry. Random palettes and arrangements stay stable
when changing geometry; their variation buttons produce new samples.
