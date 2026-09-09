const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = {};

const assetPath = "js/light-columns/default-image-data.js";

assert.ok(fs.existsSync(assetPath), "the embedded default-image asset must exist");
vm.runInThisContext(fs.readFileSync(assetPath, "utf8"), {
  filename: assetPath
});

const embedded = window.LightColumns.defaultImage;

assert.equal(
  embedded.filename,
  "El_nacimiento_de_Venus,_por_Sandro_Botticelli.jpg"
);
assert.equal(embedded.mimeType, "image/webp");
assert.match(embedded.source, /^data:image\/webp;base64,/);

const encoded = embedded.source.split(",", 2)[1];
const bytes = Buffer.from(encoded, "base64");

assert.ok(bytes.length > 500000, "the embedded artwork must not be a stub");
assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");

console.log("PASS: Default image is embedded as an export-safe WebP data URL");
