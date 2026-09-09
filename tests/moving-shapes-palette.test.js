const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const circle = {
  state: { palette: {} },
  renderer: { forEachCell() {} }
};
const context = vm.createContext({ window: { CircleApp: circle } });
for (const file of ["js/palette.js", "moving_shapes/palette.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
}
const copied = context.window.MovingShapesPalette;
const types = [
  "random", "monochrome", "analogous", "complementary", "split", "triadic",
  "ocean", "sunset", "candy", "forest", "neon", "grayscale"
];
const noise = copied.makeNoise();

// Compare the copied generator against circle.html's actual implementation.
for (const type of types) {
  assert.equal(copied.isFixedType(type), circle.palette.isFixedType(type));
  for (const colorCount of [2, 8, 16]) {
    for (const variability of [0, 40, 100]) {
      for (const baseHue of [0, 220, 359]) {
        const settings = { type, colorCount, variability, baseHue, noise };
        circle.state.palette = settings;
        circle.palette.refresh();
        const actual = copied.generate(settings);
        assert.equal(actual.length, colorCount);
        assert.deepEqual(actual, circle.state.palette.colors,
          `${type}, count ${colorCount}, variability ${variability}, hue ${baseHue}`);
      }
    }
  }
}
console.log("PASS: all 12 moving-shapes palettes match circle.html across 324 settings");
