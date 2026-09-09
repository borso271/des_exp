const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/light-columns/triangle-background.js"), "utf8"), { window });
const { vertices } = window.LightColumns.triangleBackground;
for (const [w, h] of [[1200, 750], [300, 900]]) {
  for (const size of [0.2, 1.5, 3]) {
    for (const angle of [0, 45, 180, 280, 360]) {
      const points = vertices(w, h, {size, angle, x: 0.3, y: 0.7});
      const center = [w * 0.3, h * 0.7];
      const centroid = [0, 1].map(axis => points.reduce((sum, p) => sum + p[axis], 0) / 3);
      assert.ok(Math.hypot(centroid[0] - center[0], centroid[1] - center[1]) < 1e-8,
        'rotation must preserve the chosen center');
      const lengths = points.map((p, i) => Math.hypot(p[0] - points[(i+1)%3][0], p[1] - points[(i+1)%3][1]));
      assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-8,
        'triangle remains equilateral on wide and tall posters');
      assert.ok(Math.abs(lengths[0] - Math.min(w,h) * size * Math.sqrt(3)/2) < 1e-8);
    }
  }
}
assert.ok(vertices(1200, 750, {size: 1.5, angle: 280, x: 0.55, y: 0.55})
  .some(([x, y]) => x < 0 || x > 1200 || y < 0 || y > 750), 'default triangle extends past the artwork edge');
console.log("PASS: triangle proportions, size, fixed rotation center, and cropping");
