const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({window: {}});
for (const file of ['js/shared/color-palettes.js', 'triangle-light/palette.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
}
const {ColorPalettes: colors, TrianglePalette: palette} = context.window;
const reference = {...palette.reference, paletteStyle: 'reference', baseHue: 210, colorVariation: 40};
const change = (previous, patch) => palette.applyChange({...previous, ...patch}, previous, patch);
const hsl = hex => colors.rgbToHsl(colors.hexToRgb(hex));
const linear = hex => Object.values(colors.hexToRgb(hex)).map(byte => {
  const s = byte / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
});

for (const type of colors.generatedTypes) {
  const state = change(reference, {paletteStyle: type});
  const generated = palette.generate(state);
  assert.deepEqual(generated, palette.generate(state), `${type}: reproducible colors`);
  for (const [key, value] of Object.entries(generated)) {
    assert.match(value, /^#[0-9a-f]{6}$/i);
    assert.equal(state[key], value);
  }
  assert.ok(hsl(state.ambientColor).lightness < 10, `${type}: room stays dark`);
  assert.ok(hsl(state.seamColor).lightness > hsl(state.coreColor).lightness);
}

const amber = change(reference, {baseHue: 35, colorVariation: 0});
assert.equal(amber.paletteStyle, 'monochrome');
for (const key of Object.keys(palette.reference)) {
  assert.ok(Math.abs(hsl(amber[key]).hue - 35) < 2, `${key}: coordinated amber hue`);
}
const amberTints = palette.lightTints(amber, linear);
assert.ok(amberTints.bloom[0] > amberTints.bloom[2], 'warm bloom has no blue bias');
assert.ok(amberTints.floor[0] > amberTints.floor[2], 'warm floor has no blue bias');
const grayscale = change(reference, {paletteStyle: 'grayscale'});
for (const key of Object.keys(palette.reference)) assert.equal(hsl(grayscale[key]).saturation, 0);
const grayTints = palette.lightTints(grayscale, linear);
assert.equal(grayTints.bloom[0], grayTints.bloom[2]);
assert.equal(grayTints.floor[0], grayTints.floor[2]);
const legacyTints = palette.lightTints(reference, linear);
assert.equal(JSON.stringify(legacyTints), JSON.stringify({bloom:[0.38,0.45,1],floor:[0.0004,0.0006,0.0011]}));

const sunset = change(reference, {paletteStyle:'sunset'});
assert.equal(sunset.baseHue, palette.defaultHue('sunset'));
const rotated = change(sunset, {baseHue:(sunset.baseHue + 60) % 360});
for (const key of Object.keys(palette.reference)) {
  const shift = (hsl(rotated[key]).hue - hsl(sunset[key]).hue + 360) % 360;
  assert.ok(Math.abs(shift - 60) < 2, `${key}: preset rotates as a group`);
}
const custom = change(sunset, {coreColor:'#123456'});
assert.equal(custom.paletteStyle, 'custom');
assert.equal(custom.coreColor, '#123456');
assert.equal(custom.spillColor, sunset.spillColor);
assert.equal(change(custom, {width:0.7}).coreColor, '#123456', 'geometry edits preserve custom colors');
assert.equal(change(custom, {colorVariation:80}).paletteStyle, 'monochrome');
const combined = change(reference, {paletteStyle:'forest', coreColor:'#abcdef'});
assert.equal(combined.paletteStyle, 'custom');
assert.equal(combined.coreColor, '#abcdef', 'explicit colors override generated colors');
const reset = change(custom, {paletteStyle:'reference'});
for (const key of Object.keys(reference)) assert.equal(reset[key], reference[key]);
console.log('PASS: triangle palette roles, hue rotation, custom overrides, and lighting tints');
