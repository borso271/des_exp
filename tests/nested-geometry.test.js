const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({window:{}});
for (const name of ['nested-geometry', 'gradient-mapping']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/light-columns', `${name}.js`), 'utf8'), context);
}
const {nestedGeometry, gradientMapping} = context.window.LightColumns;
const width = b => b.right - b.left;
const height = b => b.bottom - b.top;
const area = b => width(b) * height(b);
const settings = {count:4, shape:'square', scale:0.9, ratio:0.75, ratioChange:0.05, offsetX:0, offsetY:0.4};
const sample = nestedGeometry.build(settings, 1200, 750);
for (let i=1; i<sample.shapes.length; i++) {
  const parent=sample.shapes[i-1].bounds, child=sample.shapes[i].bounds;
  assert.ok(Math.abs(width(child)/width(parent) - (0.75+(i-1)*0.05)) < 1e-10);
  assert.ok(child.top-parent.top > parent.bottom-child.bottom, 'positive vertical offset biases inward squares downward');
  assert.ok(Math.abs((child.left-parent.left) - (parent.right-child.right)) < 1e-10);
}
for (const shape of ['square','rectangle']) {
  for (const ratio of [0.2,0.75,0.95]) {
    for (const ratioChange of [-0.25,0,0.25]) {
      for (const offset of [-0.9,0,0.9]) {
        const geometry = nestedGeometry.build({...settings, shape, count:8, ratio, ratioChange, offsetX:offset, offsetY:offset},1200,750);
        assert.deepEqual(geometry, nestedGeometry.build({...settings, shape, count:8, ratio, ratioChange, offsetX:offset, offsetY:offset},1200,750));
        let total = 0;
        geometry.shapes.forEach(cell => {
          const b = cell.bounds, inner=cell.innerBounds;
          assert.ok(b.left>=0 && b.top>=0 && b.right<=1200 && b.bottom<=750);
          assert.ok(width(b)>0 && height(b)>0);
          assert.ok(Math.abs(width(b)/height(b) - (shape==='square' ? 1 : 1.6)) < 1e-7);
          if (inner) assert.ok(inner.left>b.left && inner.top>b.top && inner.right<b.right && inner.bottom<b.bottom);
          total += area(b) - (inner ? area(inner) : 0);
          const contours=[]; let current;
          nestedGeometry.trace({beginPath(){},moveTo(x,y){current=[[x,y]];contours.push(current);},lineTo(x,y){current.push([x,y]);},closePath(){}},cell);
          const signed = points => points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
          assert.ok(signed(contours[0])>0);
          if(inner) assert.ok(signed(contours[1])<0,'inner contour cuts a hole instead of stacking opacity');
          for(const flow of ['along','across','radial','angular','radial-angular','diagonal']) {
            const descriptors=gradientMapping.descriptors(cell,geometry,{flow,continuity:'reset',mappingSpace:'shape'},1200,750);
            assert.ok(!/NaN|Infinity/.test(JSON.stringify(descriptors)));
            descriptors.forEach(d=>assert.equal(d.normalizedEllipse,false));
          }
        });
        assert.ok(Math.abs(total-area(geometry.shapes[0].bounds))<0.00001);
      }
    }
  }
}
console.log('PASS: nested size ratios, progressive ratios, offsets, containment, nonoverlapping regions, and gradients');
