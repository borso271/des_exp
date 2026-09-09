const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor() { this.attributes = {}; this.children = []; this.style = {}; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  appendChild(child) { this.children.push(child); }
}
const context = vm.createContext({
  window: {}, document: { createElementNS: () => new Element() }
});
const root = path.resolve(__dirname, '..');
function load(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
load('js/state.js');
const app = context.window.CircleApp;
let descriptor;
app.geometryRegistry = { register(name, value) { assert.equal(name, 'moving'); descriptor = value; } };
load('js/geometry/moving-composition.js');
assert.equal(descriptor.presentation.preserveAspectRatio, 'none');
assert.equal(descriptor.presentation.clipPath, null);

function vertices(d) {
  const numbers = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, i) => numbers.slice(i * 2, i * 2 + 2));
}
function area(points) {
  return Math.abs(points.reduce((sum, point, i) => {
    const next = points[(i + 1) % points.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0)) / 2;
}
for (const count of [2, 18, 60]) {
  for (const [width, height] of [[900, 900], [1200, 675], [675, 900]]) {
    for (const breathing of [0, 100]) {
      Object.assign(app.state.geometry, { movingShapeCount: count, movingBreathing: breathing });
      Object.assign(app.state.frame, { width, height });
      const group = new Element();
      const geometry = descriptor.create({ state: app.state, config: app.constants.geometry.moving, cellsGroup: group });
      assert.equal(group.children.length, count);
      assert.equal(geometry.getDimensions().columns, count);
      for (const time of [0, 0.05, 0.1, 2]) {
        geometry.update(time);
        let totalArea = 0;
        geometry.forEachCell((cell, row, column) => {
          const d = cell.getAttribute('d');
          assert.ok(!/NaN|Infinity/.test(d));
          const points = vertices(d);
          points.flat().forEach(n => assert.ok(n >= -96.001 && n <= 96.001));
          totalArea += area(points);
          const coordinates = geometry.getPaletteCoordinates(row, column);
          assert.equal(coordinates.rowIndex, 0);
          assert.ok(coordinates.columnIndex < count);
          assert.ok(coordinates.radialPosition >= 0 && coordinates.radialPosition <= 1);
        });
        assert.ok(Math.abs(totalArea - 192 * 192) < 2, `frame must be covered: ${count}, ${width}x${height}, ${totalArea}`);
      }
      const before = group.children.map(cell => cell.getAttribute('d'));
      geometry.update(2);
      assert.deepEqual(group.children.map(cell => cell.getAttribute('d')), before, 'same time must keep geometry stable');
      app.state.frame.width = height;
      app.state.frame.height = width;
      geometry.update(2);
      const afterResizeArea = group.children.reduce((sum, cell) => sum + area(vertices(cell.getAttribute('d'))), 0);
      assert.ok(Math.abs(afterResizeArea - 192 * 192) < 2, 'frame changes must preserve coverage');
    }
  }
}
console.log('PASS: moving geometry covers square, landscape, and portrait frames at count/breathing bounds');

const group = new Element();
const geometry = descriptor.create({ state: app.state, config: app.constants.geometry.moving, cellsGroup: group });
app.renderer = geometry;
load('js/palette.js');
app.palette.initialize();
const geometryBeforePalette = group.children.map(cell => cell.getAttribute('d'));
for (const type of ['random', 'monochrome', 'ocean', 'grayscale']) {
  app.state.palette.type = type;
  for (const colorCount of [2, 16]) {
    app.state.palette.colorCount = colorCount;
    for (const arrangement of ['random', 'rings', 'sectors', 'checker', 'radial']) {
      app.state.palette.arrangement = arrangement;
      app.palette.refresh();
      group.children.forEach(cell => {
        assert.match(cell.getAttribute('fill'), /^hsl\(/);
        assert.equal(cell.getAttribute('fill'), cell.getAttribute('data-palette-color'));
      });
      assert.deepEqual(group.children.map(cell => cell.getAttribute('d')), geometryBeforePalette,
        'palette updates must not regenerate the composition');
    }
  }
}
console.log('PASS: shared palette arrangements and color counts work without changing geometry');
