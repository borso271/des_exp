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
  "js/light-columns/mask.js"
].forEach((file) => {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
});

const {
  gradientMapping,
  palette,
  radialGeometry
} = window.LightColumns;
const width = 1200;
const height = 750;
const radialSettings = {
  centerX: 0.5,
  centerY: 0.5,
  ellipseRatio: 1.35,
  ringCount: 5,
  innerRadius: 0,
  ringThickness: 1,
  ringGap: 0,
  radialOffset: 0,
  ringPhase: 0.08,
  ringVariation: "flat",
  ringVariationAmount: 0.15,
  sectorCount: 8,
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

assert.equal(gradientMapping.resolveFlow("columns", "along"), "vertical");
assert.equal(gradientMapping.resolveFlow("columns", "across"), "horizontal");
assert.equal(gradientMapping.resolveFlow("rings", "along"), "angular");
assert.equal(gradientMapping.resolveFlow("rings", "across"), "radial");
assert.equal(gradientMapping.resolveFlow("sectors", "along"), "radial");
assert.equal(gradientMapping.resolveFlow("sectors", "across"), "angular");
assert.equal(
  gradientMapping.resolveFlow("polar", "along", "combined"),
  "combined"
);
assert.equal(
  gradientMapping.resolveFlow("rings", "radial-angular"),
  "combined"
);

const columnShape = window.LightColumns.geometry.describeColumn(
  0,
  4,
  width,
  height,
  {
    reach: 0.8,
    heightVariation: 0,
    pattern: "flat",
    shape: "straight",
    gap: 0,
    seed: 2107
  }
);

columnShape.family = "columns";
const columnDescriptor = gradientMapping.descriptors(
  columnShape,
  null,
  {
    flow: "along",
    continuity: "phase",
    mappingSpace: "canvas"
  },
  width,
  height
)[0];

assert.equal(columnDescriptor.kind, "linear");
assert.equal(columnDescriptor.start.y, 0);
assert.equal(columnDescriptor.end.y, height);

function descriptor(family, flow, continuity, mappingSpace = "canvas") {
  const set = radialGeometry.build(
    family,
    radialSettings,
    width,
    height
  );

  return {
    set,
    values: gradientMapping.descriptors(
      set.shapes[0],
      set,
      {
        ...radialSettings,
        flow,
        continuity,
        mappingSpace
      },
      width,
      height
    )
  };
}

const ringAlong = descriptor("rings", "along", "reset");
const ringAcrossReset = descriptor("rings", "across", "reset");
const ringAcrossContinuous = descriptor("rings", "across", "continuous");
const sectorAlong = descriptor("sectors", "along", "reset");
const sectorAcrossReset = descriptor("sectors", "across", "reset");
const sectorAcrossContinuous = descriptor(
  "sectors",
  "across",
  "continuous"
);
const polarCombined = descriptor("polar", "radial-angular", "reset");

assert.equal(ringAlong.values[0].kind, "angular");
assert.equal(ringAlong.values[0].fullCircle, true);
assert.equal(ringAcrossReset.values[0].kind, "radial");
assert.equal(sectorAlong.values[0].kind, "radial");
assert.equal(sectorAcrossReset.values[0].kind, "angular");
assert.ok(sectorAcrossReset.values[0].stopEnd < 1);
assert.equal(sectorAcrossContinuous.values[0].stopEnd, 1);
assert.equal(polarCombined.values.length, 2);
assert.deepEqual(
  polarCombined.values.map((value) => value.kind),
  ["radial", "angular"]
);

assert.equal(
  ringAcrossReset.values[0].innerRadius,
  ringAcrossReset.set.shapes[0].innerRadius
);
assert.equal(
  ringAcrossReset.values[0].outerRadius,
  ringAcrossReset.set.shapes[0].outerRadius
);
assert.equal(
  ringAcrossContinuous.values[0].outerRadius,
  ringAcrossContinuous.set.outerRadius
);
assert.notEqual(
  ringAcrossReset.values[0].outerRadius,
  ringAcrossContinuous.values[0].outerRadius
);

function assertFiniteNumbers(value) {
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value));
  } else if (Array.isArray(value)) {
    value.forEach(assertFiniteNumbers);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(assertFiniteNumbers);
  }
}

const flowNames = [
  "along",
  "across",
  "radial",
  "angular",
  "horizontal",
  "vertical",
  "diagonal",
  "radial-angular"
];

["rings", "sectors", "polar"].forEach((family) => {
  const geometrySet = radialGeometry.build(
    family,
    radialSettings,
    width,
    height
  );
  const geometrySnapshot = structuredClone(geometrySet);

  ["reset", "continuous", "phase"].forEach((continuity) => {
    flowNames.forEach((flow) => {
      const mapped = gradientMapping.descriptors(
        geometrySet.shapes[0],
        geometrySet,
        {
          ...radialSettings,
          flow,
          continuity,
          mappingSpace: "canvas"
        },
        width,
        height
      );

      assert.ok(mapped.length >= 1);
      assertFiniteNumbers(mapped);
    });
  });

  assert.deepEqual(
    geometrySet,
    geometrySnapshot,
    "gradient mapping must never mutate geometry coordinates"
  );
});

const ringShape = ringAlong.set.shapes[2];
const resetPhase = gradientMapping.phaseForShape(
  ringShape,
  { ...radialSettings, continuity: "reset" },
  0.44
);
const shiftedPhase = gradientMapping.phaseForShape(
  ringShape,
  { ...radialSettings, continuity: "phase" },
  0.44
);

assert.equal(resetPhase, 0);
assert.equal(shiftedPhase, 0.44 + ringShape.index * 0.08);
assert.equal(
  gradientMapping.phaseForShape(
    ringShape,
    { ...radialSettings, continuity: "reset", radialOffset: 0.25 },
    0
  ),
  0.25,
  "radial offset must shift color mapping without moving geometry"
);
assert.deepEqual(
  palette.sampleLoop(["#123456", "#abcdef"], 0, "smooth"),
  palette.sampleLoop(["#123456", "#abcdef"], 1, "smooth"),
  "loop sampling must close exactly at 0°/360°"
);

const gradientSnapshots = [];
const scaleCalls = [];

function createGradient(kind, args) {
  const record = { kind, args, stops: [] };

  args.forEach((value) => assert.ok(Number.isFinite(value)));
  gradientSnapshots.push(record);
  return {
    addColorStop(offset, color) {
      assert.ok(Number.isFinite(offset));
      assert.ok(offset >= 0 && offset <= 1);
      assert.equal(typeof color, "string");
      record.stops.push([offset, color]);
    }
  };
}

function makeContext() {
  return {
    save() {},
    restore() {},
    translate() {},
    scale(x, y) {
      scaleCalls.push([x, y]);
    },
    setTransform() {},
    clearRect() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    ellipse() {},
    fill() {},
    fillRect() {},
    drawImage() {},
    createLinearGradient(...args) {
      return createGradient("linear", args);
    },
    createRadialGradient(...args) {
      return createGradient("radial", args);
    },
    createConicGradient(...args) {
      return createGradient("angular", args);
    }
  };
}

function makeCanvas() {
  const context = makeContext();

  return {
    context,
    width: 0,
    height: 0,
    getContext() {
      return context;
    }
  };
}

global.document = {
  createElement() {
    return makeCanvas();
  }
};

vm.runInThisContext(fs.readFileSync(
  "js/light-columns/renderer.js",
  "utf8"
), { filename: "js/light-columns/renderer.js" });

const renderer = new window.LightColumns.PaletteGeometryRenderer(
  makeCanvas(),
  width,
  height
);

renderer.resize(1);

function state(family, overrides = {}) {
  return {
    aesthetic: "palette",
    geometryFamily: family,
    columns: 4,
    seed: 2107,
    background: "#1720a8",
    geometry: {
      reach: 1,
      heightVariation: 0,
      pattern: "flat",
      shape: "straight",
      gap: 0
    },
    gradient: {
      treatment: "continuous",
      flow: "along",
      continuity: "reset",
      angularWrap: "seamless",
      ...overrides.gradient
    },
    radial: { ...radialSettings, ...overrides.radial },
    palette: {
      colors: ["#2448ff", "#7147ee", "#e96eb8", "#ffad3f"],
      interpolation: overrides.interpolation || "smooth",
      mappingSpace: "canvas",
      reverse: false,
      offset: 0,
      span: 1,
      overflow: "mirror",
      ...overrides.palette
    },
    mask: { softness: 30, opacity: 0.94 },
    light: { glow: 8, blendMode: "source-over" },
    style: {
      blur: 20,
      bloom: 0.9,
      staggeredOpacity: 0.88,
      staggeredHeightVariation: 0.2,
      staggeredSequence: "wave"
    },
    variation: {
      phaseStep: 0.08,
      phaseJitter: 0.02,
      brightness: 3,
      opacity: 0.04,
      ...overrides.variation
    }
  };
}

gradientSnapshots.length = 0;
renderer.render(state("rings"));
const ringGradients = gradientSnapshots.filter((record) => {
  return record.kind === "angular";
});

assert.equal(ringGradients.length, radialSettings.ringCount);
assert.ok(ringGradients.every((record) => record.stops.length > 100));
ringGradients.forEach((record) => {
  assert.equal(
    record.stops[0][1],
    record.stops[record.stops.length - 1][1],
    "seamless angular gradients must close with the same color"
  );
});
assert.equal(renderer.lastSolidFillCount, 0);
assert.ok(
  scaleCalls.some(([x, y]) => x === 1 && y === radialSettings.ellipseRatio),
  "elliptical gradients and paths must share the same normalized transform"
);

const deterministicFirst = JSON.parse(JSON.stringify(gradientSnapshots));

gradientSnapshots.length = 0;
renderer.render(state("rings"));
assert.deepEqual(
  gradientSnapshots,
  deterministicFirst,
  "the same seed and controls must reproduce identical gradients"
);

gradientSnapshots.length = 0;
renderer.render(state("rings", {
  gradient: { continuity: "phase" },
  variation: { phaseStep: 0 }
}));
const ringsWithoutHiddenColumnPhase = structuredClone(gradientSnapshots);

gradientSnapshots.length = 0;
renderer.render(state("rings", {
  gradient: { continuity: "phase" },
  variation: { phaseStep: 0.9 }
}));
assert.deepEqual(
  gradientSnapshots,
  ringsWithoutHiddenColumnPhase,
  "the hidden column/sector phase control must not affect rings"
);

gradientSnapshots.length = 0;
renderer.render(state("rings", {
  gradient: { continuity: "phase" },
  radial: { ringPhase: 0.2 }
}));
assert.notDeepEqual(
  gradientSnapshots,
  ringsWithoutHiddenColumnPhase,
  "the visible per-ring phase control must affect ring gradients"
);

["seamless", "mirror", "repeat"].forEach((angularWrap) => {
  gradientSnapshots.length = 0;
  renderer.render(state("rings", {
    gradient: { angularWrap },
    palette: { span: 0.73, offset: -0.17 }
  }));
  const record = gradientSnapshots.find((entry) => {
    return entry.kind === "angular";
  });

  assert.ok(record);
  assert.equal(
    record.stops[0][1],
    record.stops[record.stops.length - 1][1],
    `${angularWrap} angular wrapping must close without a seam`
  );
});

gradientSnapshots.length = 0;
renderer.render(state("sectors"));
assert.equal(
  gradientSnapshots.filter((record) => record.kind === "radial").length,
  radialSettings.sectorCount
);

gradientSnapshots.length = 0;
renderer.render(state("polar", {
  gradient: { flow: "radial-angular", continuity: "phase" }
}));
assert.ok(gradientSnapshots.some((record) => record.kind === "radial"));
assert.ok(gradientSnapshots.some((record) => record.kind === "angular"));

gradientSnapshots.length = 0;
renderer.render(state("rings", {
  gradient: { treatment: "solid" }
}));
assert.equal(renderer.lastGradientStopCount, 0);
assert.equal(renderer.lastSolidFillCount, radialSettings.ringCount);
assert.equal(gradientSnapshots.length, 0);

gradientSnapshots.length = 0;
renderer.render(state("rings", { interpolation: "hard" }));
assert.ok(gradientSnapshots[0].stops.length > 300);
assert.ok(new Set(
  gradientSnapshots[0].stops.map((stop) => stop[1])
).size > 1);

gradientSnapshots.length = 0;
renderer.render(state("columns", {
  gradient: { flow: "along", continuity: "phase" }
}));
const columnGradients = gradientSnapshots.filter((record) => {
  return record.kind === "linear" && record.stops.length > 100;
});

assert.equal(columnGradients.length, 4);
assert.deepEqual(columnGradients[0].args, [600, 0, 600, height]);
assert.notEqual(
  columnGradients[0].stops[0][1],
  columnGradients[1].stops[0][1],
  "legacy per-column phase must remain active"
);

console.log(
  "PASS: continuous gradient flow, continuity, seams, and solid fallback"
);
