const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../js/light-columns/split-background.js"), "utf8"), { window });
const split = window.LightColumns.splitBackground;
const area = points => Math.abs(points.reduce((sum, a, i) => {
  const b = points[(i + 1) % points.length];
  return sum + a[0] * b[1] - b[0] * a[1];
}, 0)) / 2;

// The divider covers the full rectangle without gaps at any angle or offset.
for (const [w, h] of [[1200, 750], [300, 900]]) {
  for (let angle = 0; angle < 360; angle += 7) {
    const half = area(split.polygon(w, h, angle, 0));
    assert.ok(Math.abs(half - w * h / 2) < 1e-6);
    let previous = w * h;
    for (const offset of [-0.95, -0.5, 0, 0.5, 0.95]) {
      const polygon = split.polygon(w, h, angle, offset);
      polygon.forEach(([x, y]) => {
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
        assert.ok(x >= -1e-8 && x <= w + 1e-8 && y >= -1e-8 && y <= h + 1e-8);
      });
      const next = area(polygon);
      assert.ok(next > 0 && next < w * h && next <= previous);
      previous = next;
    }
  }
}
assert.equal(split.angleDelta(359, 1), 2);
assert.equal(split.angleDelta(1, 359), -2);
assert.equal(split.normalizeAngle(-30), 330);
console.log("PASS: split background coverage, unequal areas, and shortest rotation");
