const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = {};

[
  "js/shared/color-palettes.js",
  "js/light-columns/palette.js",
  "js/light-columns/geometry.js",
  "js/light-columns/radial-geometry.js",
  "js/light-columns/gradient-mapping.js",
  "js/light-columns/mask.js",
  "js/light-columns/image-layer.js",
  "js/light-columns/renderer.js"
].forEach((file) => {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
});

const { palette, geometry, mask, invariants } = window.LightColumns;

assert.equal(palette.overflowCoordinate(1.4, "extend"), 1);
assert.ok(Math.abs(palette.overflowCoordinate(1.4, "repeat") - 0.4) < 1e-9);
assert.ok(Math.abs(palette.overflowCoordinate(1.4, "mirror") - 0.6) < 1e-9);

assert.ok(Math.abs(palette.mapCoordinate(0, {
  span: 1,
  offset: -0.4,
  phase: 0,
  overflow: "mirror"
}) - 0.4) < 1e-9);

const geometrySettings = {
  reach: 0.9,
  heightVariation: 0.24,
  pattern: "random",
  shape: "straight",
  gap: 0,
  seed: 2107
};
const firstGeometry = geometry.describeColumn(
  2,
  8,
  1200,
  750,
  geometrySettings
);
const repeatedGeometry = geometry.describeColumn(
  2,
  8,
  1200,
  750,
  geometrySettings
);

assert.deepEqual(firstGeometry, repeatedGeometry);
assert.equal(invariants.mappingPosition(375, 750, firstGeometry, "canvas"), 0.5);
assert.equal(mask.alphaAt(firstGeometry.top - 1, firstGeometry.top, 90, 1), 0);
assert.equal(mask.alphaAt(firstGeometry.top + 90, firstGeometry.top, 90, 1), 1);

const twoColorStart = palette.sample(["#000000", "#ffffff"], 0, "linear");
const twoColorEnd = palette.sample(["#000000", "#ffffff"], 1, "linear");

assert.equal(twoColorStart.lightness, 0);
assert.equal(twoColorEnd.lightness, 100);
assert.equal(palette.adjustLightness(70, 30), 86);
assert.equal(palette.adjustLightness(70, 300), 86);
assert.equal(palette.adjustLightness(70, -30), 14);
assert.equal(
  palette.adjustLightness(96, 30),
  96,
  "an explicitly pale palette color should remain intentional"
);

console.log("PASS: Columns v2 palette, geometry, and mask invariants");
