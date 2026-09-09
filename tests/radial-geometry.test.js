const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = {};

[
  "js/light-columns/geometry.js",
  "js/light-columns/radial-geometry.js"
].forEach((file) => {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
});

const radial = window.LightColumns.radialGeometry;
const width = 1200;
const height = 750;
const base = {
  centerX: 0.5,
  centerY: 0.5,
  ellipseRatio: 1,
  ringCount: 8,
  innerRadius: 0,
  ringThickness: 1,
  ringGap: 0,
  radialOffset: 0,
  ringPhase: 0,
  ringVariation: "flat",
  ringVariationAmount: 0.15,
  sectorCount: 12,
  rotation: -90,
  innerOpening: 0,
  angularGap: 0,
  sectorDirection: "clockwise",
  sectorVariation: "flat",
  mirrorSymmetry: false,
  polarMapping: "combined",
  polarAssignment: "continuous",
  seed: 2107
};

function assertFiniteNumbers(value, path = "root") {
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), `${path} must be finite`);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      assertFiniteNumbers(entry, `${path}[${index}]`);
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      assertFiniteNumbers(entry, `${path}.${key}`);
    });
  }
}

function makeTraceContext() {
  const coordinates = [];

  return {
    coordinates,
    beginPath() {},
    closePath() {},
    moveTo(x, y) {
      coordinates.push(x, y);
    },
    lineTo(x, y) {
      coordinates.push(x, y);
    },
    ellipse(x, y, radiusX, radiusY, rotation, start, end) {
      coordinates.push(x, y, radiusX, radiusY, rotation, start, end);
    }
  };
}

["rings", "sectors", "polar"].forEach((family) => {
  const first = radial.build(family, base, width, height);
  const second = radial.build(family, base, width, height);

  assert.deepEqual(first, second, `${family} geometry must be deterministic`);
  assertFiniteNumbers(first, family);
  assert.ok(first.shapes.length > 0, `${family} must produce shapes`);
  assert.equal(
    radial.coversCorners(first, width, height),
    true,
    `${family} coverage envelope must reach every corner`
  );

  [first.shapes[0], first.shapes[first.shapes.length - 1]].forEach((shape) => {
    const context = makeTraceContext();

    radial.trace(context, shape);
    assert.ok(context.coordinates.length > 0);
    context.coordinates.forEach((coordinate) => {
      assert.ok(Number.isFinite(coordinate));
    });
  });
});

const rings = radial.build("rings", base, width, height);

for (let index = 1; index < rings.shapes.length; index += 1) {
  assert.ok(
    Math.abs(
      rings.shapes[index - 1].outerRadius -
      rings.shapes[index].innerRadius
    ) < 1e-7,
    "default rings must meet without unintended gaps"
  );
}

const sectors = radial.build("sectors", base, width, height);
const totalSectorSweep = sectors.shapes.reduce((total, shape) => {
  return total + Math.abs(shape.sweep);
}, 0);

assert.ok(Math.abs(totalSectorSweep - Math.PI * 2) < 1e-7);

const gappedRings = radial.build(
  "rings",
  { ...base, ringGap: 12, innerRadius: 0.18 },
  width,
  height
);

assert.ok(gappedRings.innerRadius > 0);
assert.ok(
  gappedRings.shapes[0].outerRadius < gappedRings.shapes[1].innerRadius,
  "an intentional ring gap must remain visible"
);

const openSectors = radial.build(
  "sectors",
  { ...base, innerOpening: 0.2, angularGap: 3 },
  width,
  height
);
const openSweep = openSectors.shapes.reduce((total, shape) => {
  return total + Math.abs(shape.sweep);
}, 0);

assert.ok(openSectors.innerRadius > 0);
assert.ok(
  openSweep < Math.PI * 2,
  "an intentional angular gap must reduce the filled sweep"
);

[
  { centerX: -0.5, centerY: -0.5, ellipseRatio: 0.25 },
  { centerX: 1.5, centerY: 1.5, ellipseRatio: 2 },
  { centerX: -0.5, centerY: 1.5, ellipseRatio: 1.4 }
].forEach((position) => {
  const settings = { ...base, ...position };

  ["rings", "sectors", "polar"].forEach((family) => {
    assert.equal(
      radial.coversCorners(
        radial.build(family, settings, width, height),
        width,
        height
      ),
      true,
      `${family} must cover corners from an off-canvas center`
    );
  });
});

const offsetLeft = radial.build(
  "rings",
  { ...base, radialOffset: -1 },
  width,
  height
);
const offsetRight = radial.build(
  "rings",
  { ...base, radialOffset: 1 },
  width,
  height
);

assert.deepEqual(
  offsetLeft,
  offsetRight,
  "palette radial offset must not mutate ring geometry"
);
assert.notEqual(
  radial.palettePosition(offsetLeft.shapes[0], { ...base, radialOffset: -1 }),
  radial.palettePosition(offsetRight.shapes[0], { ...base, radialOffset: 1 }),
  "radial offset must still alter palette mapping"
);

const spiralOffsetLeft = radial.build(
  "sectors",
  { ...base, sectorVariation: "spiral", radialOffset: -1 },
  width,
  height
);
const spiralOffsetRight = radial.build(
  "sectors",
  { ...base, sectorVariation: "spiral", radialOffset: 1 },
  width,
  height
);

assert.deepEqual(
  spiralOffsetLeft,
  spiralOffsetRight,
  "palette radial offset must not mutate spiral sector geometry"
);

const alternatingRings = radial.build(
  "rings",
  { ...base, ringVariation: "alternating", ringVariationAmount: 0.5 },
  width,
  height
);

assert.notEqual(
  alternatingRings.shapes[0].outerRadius -
    alternatingRings.shapes[0].innerRadius,
  alternatingRings.shapes[1].outerRadius -
    alternatingRings.shapes[1].innerRadius,
  "ring variation must affect ring geometry"
);

const mirrored = radial.build(
  "sectors",
  { ...base, mirrorSymmetry: true, sectorCount: 8 },
  width,
  height
);

assert.equal(
  mirrored.shapes[0].angularPosition,
  mirrored.shapes[7].angularPosition
);
assert.equal(
  mirrored.shapes[1].angularPosition,
  mirrored.shapes[6].angularPosition
);

const polar = radial.build("polar", base, width, height);
const polarCell = polar.shapes.find((shape) => {
  return shape.ringIndex === 1 && shape.sectorIndex === 2;
});
const continuous = radial.palettePosition(polarCell, base);
const checkerboard = radial.palettePosition(polarCell, {
  ...base,
  polarAssignment: "checkerboard"
});

assert.notEqual(continuous, checkerboard);
assert.equal(polar.shapes.length, base.ringCount * base.sectorCount);

console.log("PASS: deterministic radial geometry, coverage, and mapping invariants");
