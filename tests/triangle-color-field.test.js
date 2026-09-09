const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');

const context = vm.createContext({window:{}});
for (const file of ['js/shared/color-palettes.js', 'triangle_color_field/color-field.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:file});
}
const field = context.window.TriangleColorField;
const palette = ['#ff7a72', '#6857ff'];
const defaults = {pattern:'sequence', span:1, offset:0, pairShift:0, reverse:false};
assert.equal(field.sample(palette, 0), palette[0]);
assert.equal(field.sample(palette, 1), palette[1]);
assert.equal(field.sample(palette, -0.5), palette[0]);
assert.equal(field.sample(palette, 1.5), palette[1]);
assert.equal(field.coordinate(0, 0, 36, defaults), 0);
assert.equal(field.coordinate(35, 1, 36, defaults), 1);
assert.equal(field.coordinate(2, 1, 36, defaults), 5 / 71);
assert.equal(field.coordinate(35, 1, 36, {...defaults, reverse:true}), 0);
for (let i = 0; i < 12; i++) {
  assert.equal(field.coordinate(i, 0, 12, {...defaults, pattern:'columns'}), field.coordinate(i, 1, 12, {...defaults, pattern:'columns'}));
  assert.ok(Math.abs(field.coordinate(i, 0, 12, {...defaults, pattern:'opposing'}) + field.coordinate(i, 1, 12, {...defaults, pattern:'opposing'}) - 1) < 1e-10);
  assert.ok(Math.abs(field.coordinate(i, 0, 12, {...defaults, pattern:'center'}) - field.coordinate(11 - i, 1, 12, {...defaults, pattern:'center'})) < 1e-10);
}
assert.equal(field.coordinate(0, 1, 36, {...defaults, pattern:'columns', pairShift:.25}), .25);
assert.equal(field.coordinate(0, 0, 36, {...defaults, offset:.3}), .3);
assert.equal(field.coordinate(35, 1, 36, {...defaults, span:.5}), 2);
for (const mode of ['repeat','mirror','loop']) {
  for (const space of ['oklab','rgb','hsl']) assert.match(field.sample(palette, -1.2, {overflow:mode, space}), /^#[0-9a-f]{6}$/);
}
assert.equal(field.sample(palette, .4, {overflow:'mirror'}), field.sample(palette, 1.6, {overflow:'mirror'}));
assert.equal(field.sample(palette, 0, {overflow:'loop'}), field.sample(palette, 1, {overflow:'loop'}));
assert.equal(field.sample(palette, 1 - 1e-8, {overflow:'loop'}), palette[0], 'loop blends back into the first stop');
for (let i = 0; i <= 100; i++) assert.ok(palette.includes(field.sample(palette, i/100, {transition:'steps'})));
assert.equal(field.blend('#000000', '#ffffff', .5, 'rgb'), '#bcbcbc');
const resized = field.resizePalette(palette, 8);
assert.equal(resized.length, 8);
assert.equal(resized[0], palette[0]);
assert.equal(resized[7], palette[1]);
const scatter = seed => Array.from({length:24}, (_, i) => field.coordinate(Math.floor(i/2), i%2, 12, {...defaults, pattern:'scatter', seed}));
assert.deepEqual(scatter(100), scatter(100));
assert.notDeepEqual(scatter(100), scatter(101));
assert.deepEqual([...field.shuffle(resized, 90)].sort(), [...resized].sort());

(async () => {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = await JSDOM.fromFile(path.join(__dirname, '../triangle_color_field/index.html'), {
    runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, virtualConsole
  });
  try {
    await new Promise(resolve => dom.window.addEventListener('load', resolve, {once:true}));
    const doc = dom.window.document;
    const $ = id => doc.getElementById(id);
    const change = (id, value) => {
      const input = $(id);
      input.value = String(value);
      input.dispatchEvent(new dom.window.Event(input.tagName === 'SELECT' ? 'change' : 'input'));
    };
    const values = () => [...$('composition').children].flatMap(column => [column.style.getPropertyValue('--c1'), column.style.getPropertyValue('--c2')]);
    assert.equal($('composition').children.length, 36);
    const original = values();
    assert.equal(original[0], palette[0]);
    assert.equal(original.at(-1), palette[1]);
    change('columns', 4);
    change('palette-count', 8);
    assert.equal(doc.querySelectorAll('.swatch input').length, 8);
    change('palette-source', 'generated');
    assert.equal($('generated-controls').hidden, false);
    for (const type of context.window.ColorPalettes.generatedTypes) {
      change('palette-type', type);
      values().forEach(color => assert.match(color, /^#[0-9a-f]{6}$/));
    }
    const input = doc.querySelector('.swatch input');
    input.value = '#123456';
    input.dispatchEvent(new dom.window.Event('input'));
    assert.equal($('palette-source').value, 'manual');
    assert.equal(values()[0], '#123456');
    for (const study of ['amber','opposing','sunset','neon','forest']) {
      change('study', study);
      values().forEach(color => assert.match(color, /^#[0-9a-f]{6}$/));
    }
    const before = values();
    change('ratio', 1.2);
    assert.deepEqual(values(), before, 'resizing does not rerandomize scattered triangles');
    $('reshuffle').click();
    assert.notDeepEqual(values(), before);
    change('study', 'neon');
    assert.equal($('color-space').disabled, true);
    $('reset-progression').click();
    assert.equal($('color-space').disabled, false);
    assert.equal($('pair-shift').value, '0');
    change('study', 'original');
    change('columns', 36);
    assert.deepEqual(values(), original, 'original study restores the existing color progression');
    $('swap').click();
    assert.equal(values()[0], palette[1]);
    $('flip').click();
    assert.equal(doc.querySelectorAll('.column.flip').length, 0);
    assert.equal(errors.length, 0, errors.map(String).join('\n'));
    console.log('PASS: triangle palette interpolation, mapping, seeded variation, controls, and original study');
  } finally {dom.window.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
