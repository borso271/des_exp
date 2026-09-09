#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/generate-default-image-data.js <image.webp> <output.js>"
  );
  process.exit(1);
}

const source = fs.readFileSync(inputPath).toString("base64");
const chunks = source.match(/.{1,100}/g) || [];
const filename = "El_nacimiento_de_Venus,_por_Sandro_Botticelli.jpg";
const output = `(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const chunks = [
${chunks.map((chunk) => `    "${chunk}"`).join(",\n")}
  ];

  root.defaultImage = Object.freeze({
    filename: ${JSON.stringify(filename)},
    mimeType: "image/webp",
    source: ` + "`data:image/webp;base64,${chunks.join(\"\")}`" + `
  });
})();
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

console.log(
  `Wrote ${outputPath} (${Buffer.byteLength(output).toLocaleString()} bytes)`
);
