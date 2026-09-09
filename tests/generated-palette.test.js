const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = {};

vm.runInThisContext(fs.readFileSync("js/shared/color-palettes.js", "utf8"));

vm.runInThisContext(
  fs.readFileSync("js/light-columns/palette.js", "utf8"),
  { filename: "js/light-columns/palette.js" }
);

const { palette } = window.LightColumns;
const expectedTypes = [
  "random",
  "monochrome",
  "analogous",
  "complementary",
  "split",
  "triadic",
  "ocean",
  "sunset",
  "candy",
  "forest",
  "neon",
  "grayscale"
];
const proceduralTypes = expectedTypes.filter((type) => {
  return !palette.isFixedType(type);
});
const fixedTypes = expectedTypes.filter((type) => {
  return palette.isFixedType(type);
});

assert.deepEqual(palette.generatedTypes, expectedTypes);
assert.deepEqual(
  palette.fixedPaletteTypes,
  ["ocean", "sunset", "candy", "forest", "neon", "grayscale"]
);

expectedTypes.forEach((type) => {
  const settings = {
    type,
    count: 16,
    baseHue: 220,
    variability: 72,
    seed: 2107
  };
  const first = palette.generate(settings);
  const repeated = palette.generate(settings);

  assert.equal(first.length, 16, `${type} must honor the requested count`);
  assert.deepEqual(first, repeated, `${type} must be deterministic`);
  first.forEach((color) => {
    assert.match(color, /^#[0-9a-f]{6}$/i, `${type} must emit hex colors`);
  });
});

assert.equal(palette.generate({ count: 1 }).length, 2);
assert.equal(palette.generate({ count: 99 }).length, 16);

proceduralTypes.forEach((type) => {
  const compressed = palette.generate({
    type,
    count: 8,
    baseHue: 40,
    variability: 0,
    seed: 11
  });
  const expanded = palette.generate({
    type,
    count: 8,
    baseHue: 40,
    variability: 100,
    seed: 11
  });
  const shifted = palette.generate({
    type,
    count: 8,
    baseHue: 210,
    variability: 100,
    seed: 11
  });

  assert.equal(
    new Set(compressed).size,
    1,
    `${type} variability 0 must collapse the palette range`
  );
  assert.ok(
    new Set(expanded).size > 1,
    `${type} variability 100 must expand the palette range`
  );
  assert.notDeepEqual(
    expanded,
    shifted,
    `${type} must respond to base hue`
  );
});

fixedTypes.forEach((type) => {
  const compressed = palette.generate({
    type,
    count: 8,
    baseHue: 0,
    variability: 0,
    seed: 3
  });
  const expanded = palette.generate({
    type,
    count: 8,
    baseHue: 0,
    variability: 100,
    seed: 3
  });
  const shiftedBaseHue = palette.generate({
    type,
    count: 8,
    baseHue: 240,
    variability: 100,
    seed: 900
  });

  assert.equal(
    new Set(compressed).size,
    1,
    `${type} variability 0 must collapse the preset range`
  );
  assert.ok(
    new Set(expanded).size > 1,
    `${type} variability 100 must expose the preset range`
  );
  assert.deepEqual(
    expanded,
    shiftedBaseHue,
    `${type} must ignore base hue and seed`
  );
});

const seedOne = palette.generate({
  type: "random",
  count: 8,
  baseHue: 220,
  variability: 100,
  seed: 1
});
const seedTwo = palette.generate({
  type: "random",
  count: 8,
  baseHue: 220,
  variability: 100,
  seed: 2
});

assert.notDeepEqual(seedOne, seedTwo, "different seeds must vary the palette");
assert.deepEqual(
  palette.generate({
    type: "not-a-type",
    count: 8,
    baseHue: 220,
    variability: 100,
    seed: 1
  }),
  seedOne,
  "unknown types must safely fall back to random"
);

console.log("PASS: deterministic generated palette families and ranges");
