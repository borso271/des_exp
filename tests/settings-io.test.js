const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = {};

vm.runInThisContext(
  fs.readFileSync("js/light-columns/settings-io.js", "utf8"),
  { filename: "js/light-columns/settings-io.js" }
);

const settingsIO = window.LightColumns.settingsIO;

function inputControl(type, value, options = {}) {
  return {
    type,
    value: String(value),
    checked: Boolean(options.checked),
    min: options.min === undefined ? "" : String(options.min),
    max: options.max === undefined ? "" : String(options.max),
    tagName: "INPUT"
  };
}

function selectControl(value, values) {
  return {
    type: "select-one",
    value,
    tagName: "SELECT",
    options: values.map((optionValue) => ({ value: optionValue }))
  };
}

const controls = {
  enabled: inputControl("checkbox", "", { checked: true }),
  count: inputControl("range", 8, { min: 2, max: 20 }),
  seed: inputControl("number", 2107, { min: 0, max: 999999999 }),
  accent: inputControl("color", "#7c5cff"),
  family: selectControl("columns", ["columns", "rings"]),
  upload: inputControl("file", "")
};

assert.deepEqual(settingsIO.serializeControls(controls), {
  enabled: true,
  count: 8,
  seed: 2107,
  accent: "#7c5cff",
  family: "columns"
});

const result = settingsIO.applyControlValues(controls, {
  enabled: false,
  count: 500,
  seed: -20,
  accent: "#FF3366",
  family: "rings",
  upload: "forbidden",
  futureControl: 10
});

assert.equal(controls.enabled.checked, false);
assert.equal(controls.count.value, "20");
assert.equal(controls.seed.value, "0");
assert.equal(controls.accent.value, "#ff3366");
assert.equal(controls.family.value, "rings");
assert.deepEqual(result.applied.sort(), [
  "accent",
  "count",
  "enabled",
  "family",
  "seed"
]);
assert.deepEqual(result.ignored.sort(), ["futureControl", "upload"]);

const invalidResult = settingsIO.applyControlValues(controls, {
  enabled: "yes",
  count: "not-a-number",
  accent: "violet",
  family: "triangles"
});

assert.deepEqual(invalidResult.invalid.sort(), [
  "accent",
  "count",
  "enabled",
  "family"
]);

const settingsDocument = settingsIO.createDocument({
  exportedAt: "2026-09-04T10:00:00.000Z",
  controls: settingsIO.serializeControls(controls),
  paletteColors: ["#112233", "#abcdef"],
  paletteCounts: { manual: 6, generated: 12 },
  image: { kind: "local", filename: "portrait.jpg" }
});

assert.equal(settingsDocument.format, "canvas-light-geometry-settings");
assert.equal(settingsDocument.version, 1);
assert.deepEqual(settingsDocument.palette.counts, {
  manual: 6,
  generated: 12
});
assert.deepEqual(settingsDocument.image, {
  kind: "local",
  filename: "portrait.jpg"
});

const parsed = settingsIO.parse(JSON.stringify({
  ...settingsDocument,
  futureTopLevelField: true,
  controls: {
    ...settingsDocument.controls,
    futureControl: "ignored safely",
    invalidObject: { unsafe: true }
  },
  palette: {
    ...settingsDocument.palette,
    manualColors: ["#ABCDEF", "not-a-color", "#123456"]
  }
}));

assert.equal(parsed.controls.futureControl, "ignored safely");
assert.equal("invalidObject" in parsed.controls, false);
assert.deepEqual(parsed.palette.manualColors, [
  "#abcdef",
  null,
  "#123456"
]);

assert.throws(
  () => settingsIO.parse("not json"),
  /not valid JSON/
);
assert.throws(
  () => settingsIO.parse(JSON.stringify({ format: "something-else" })),
  /not a Canvas Light Geometry settings file/
);
assert.throws(
  () => settingsIO.parse(JSON.stringify({
    format: settingsIO.format,
    version: 99,
    controls: {}
  })),
  /Unsupported settings version/
);

(async () => {
  assert.equal(
    await settingsIO.readFile({ size: 20, text: async () => "settings" }),
    "settings"
  );
  await assert.rejects(
    settingsIO.readFile({
      size: settingsIO.maximumFileSize + 1,
      text: async () => "too large"
    }),
    /too large/
  );

  const actions = [];
  const anchor = {
    hidden: false,
    click() {
      actions.push(["click", this.download, this.href]);
    },
    remove() {
      actions.push(["remove"]);
    }
  };
  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options.type;
    }
  }
  const environment = {
    Blob: FakeBlob,
    URL: {
      createObjectURL(blob) {
        actions.push(["create", blob]);
        return "blob:settings";
      },
      revokeObjectURL(url) {
        actions.push(["revoke", url]);
      }
    },
    document: {
      createElement() {
        return anchor;
      },
      body: {
        append(element) {
          actions.push(["append", element]);
        }
      }
    }
  };

  settingsIO.download(settingsDocument, "poster.json", {
    environment,
    defer(callback) {
      callback();
    }
  });

  assert.equal(actions[0][0], "create");
  assert.equal(actions[0][1].type, "application/json");
  assert.match(actions[0][1].parts[0], /"portrait.jpg"/);
  assert.deepEqual(actions[2], ["click", "poster.json", "blob:settings"]);
  assert.deepEqual(actions.at(-1), ["revoke", "blob:settings"]);

  console.log("PASS: versioned settings serialization, validation, and files");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
