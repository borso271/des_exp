const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
for (const file of ['geometry', 'moving-geometry', 'gradient-mapping']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/light-columns', `${file}.js`), 'utf8'), context);
}
const { movingGeometry, gradientMapping } = context.window.LightColumns;
function area(points) {
  return Math.abs(points.reduce((sum, p, i) => {
    const next = points[(i + 1) % points.length];
    return sum + p.x * next.y - next.x * p.y;
  }, 0)) / 2;
}
function finite(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
}
for (const count of [2, 18, 60]) {
  for (const [width, height] of [[1200, 750], [675, 900]]) {
    for (const breathing of [0, 1]) {
      const settings = { count, breathing, seed: 2107, time: 12 };
      const geometry = movingGeometry.build(settings, width, height);
      assert.deepEqual(geometry, movingGeometry.build(settings, width, height));
      assert.equal(geometry.shapes.length, count);
      assert.ok(Math.abs(geometry.shapes.reduce((sum, shape) => sum + area(shape.points), 0) - width * height) < 0.01);
      finite(geometry);
      assert.notDeepEqual(geometry, movingGeometry.build({ ...settings, time: 16 }, width, height));
      assert.notDeepEqual(geometry, movingGeometry.build({ ...settings, seed: 999 }, width, height));
      for (const shape of geometry.shapes.filter(s => s.points.length >= 3)) {
        for (const flow of ['along', 'across', 'radial', 'angular', 'horizontal', 'vertical', 'diagonal', 'radial-angular']) {
          for (const continuity of ['continuous', 'reset', 'phase']) {
            const descriptors = gradientMapping.descriptors(shape, geometry,
              { flow, continuity, mappingSpace: 'shape', polarMapping: 'combined' }, width, height);
            descriptors.forEach(descriptor => {
              finite(descriptor);
              assert.equal(descriptor.normalizedEllipse, false);
              assert.ok(descriptor.stopStart >= 0 && descriptor.stopEnd <= 1);
            });
          }
        }
      }
    }
  }
}
console.log('PASS: seeded moving cells, frame coverage, animation, and all gradient flows');
