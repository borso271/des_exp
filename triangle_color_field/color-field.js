(() => {
  'use strict';
  const colors = window.ColorPalettes;
  const {clamp, modulo} = colors;

  function linear(channel) {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }

  function srgb(channel) {
    const s = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(clamp(s, 0, 1) * 255);
  }

  function toLab(rgb) {
    const [r, g, b] = rgb.map(linear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
  }

  function fromLab([L, a, b]) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    ].map(srgb);
  }

  const rgb = hex => Object.values(colors.hexToRgb(hex));
  const hex = channels => '#' + channels.map(channel => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0')).join('');

  function blend(start, end, amount, space = 'oklab') {
    if (amount <= 0) return start;
    if (amount >= 1) return end;
    const mix = (a, b) => a.map((value, index) => value + (b[index] - value) * amount);
    if (space === 'hsl') {
      const a = colors.rgbToHsl(colors.hexToRgb(start));
      const b = colors.rgbToHsl(colors.hexToRgb(end));
      // Achromatic stops take the neighboring hue instead of detouring via red.
      if (a.saturation === 0) a.hue = b.hue;
      if (b.saturation === 0) b.hue = a.hue;
      return colors.hslToHex(colors.interpolateHue(a.hue, b.hue, amount),
        a.saturation + (b.saturation - a.saturation) * amount,
        a.lightness + (b.lightness - a.lightness) * amount);
    }
    if (space === 'rgb') return hex(mix(rgb(start).map(linear), rgb(end).map(linear)).map(srgb));
    return hex(fromLab(mix(toLab(rgb(start)), toLab(rgb(end)))));
  }

  function wrap(position, mode) {
    if (mode === 'repeat' || mode === 'loop') return modulo(position, 1);
    if (mode === 'mirror') {
      const p = modulo(position, 2);
      return p <= 1 ? p : 2 - p;
    }
    return clamp(position, 0, 1);
  }

  function sample(palette, position, settings = {}) {
    const active = palette.length > 1 ? palette : [palette[0] || '#000000', palette[0] || '#000000'];
    const p = wrap(position, settings.overflow);
    if (settings.transition === 'steps') return active[Math.min(active.length - 1, Math.floor(p * active.length))];
    const scaled = p * (settings.overflow === 'loop' ? active.length : active.length - 1);
    const index = Math.min(active.length - 1, Math.floor(scaled));
    const next = settings.overflow === 'loop' ? (index + 1) % active.length : Math.min(index + 1, active.length - 1);
    let amount = scaled - index;
    if (settings.transition === 'soft') amount = amount * amount * (3 - 2 * amount);
    return blend(active[index], active[next], amount, settings.space);
  }

  function randomAt(index, seed) {
    let n = (Math.imul(index + 1, 374761393) + (Number(seed) >>> 0)) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function coordinate(column, side, count, settings) {
    const x = column / Math.max(1, count - 1);
    let p = (2 * column + side) / Math.max(1, count * 2 - 1);
    if (settings.pattern === 'columns') p = x;
    if (settings.pattern === 'opposing') p = side === 0 ? x : 1 - x;
    if (settings.pattern === 'center') p = Math.abs(2 * p - 1);
    if (settings.pattern === 'scatter') p = randomAt(2 * column + side, settings.seed);
    if (settings.reverse) p = 1 - p;
    if (settings.curve === 'ease-in') p *= p;
    if (settings.curve === 'ease-out') p = 1 - (1 - p) ** 2;
    if (settings.curve === 'smooth') p = p * p * (3 - 2 * p);
    return p / Math.max(0.05, settings.span || 1) + (settings.offset || 0) + (side === 1 ? settings.pairShift || 0 : 0);
  }

  function generate(settings) {
    const palette = colors.generate(settings);
    // Named palettes can rotate too, without changing the shared generator's
    // fixed-palette behavior in the other projects.
    if (!colors.isFixedType(settings.type)) return palette;
    return palette.map(value => {
      const color = colors.rgbToHsl(colors.hexToRgb(value));
      return colors.hslToHex(color.hue + (settings.rotation || 0), color.saturation, color.lightness);
    });
  }

  function resizePalette(palette, count) {
    return Array.from({length: count}, (_, index) => sample(palette, index / (count - 1)));
  }

  function shuffle(palette, seed) {
    const result = [...palette];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(randomAt(i, seed) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  window.TriangleColorField = Object.freeze({blend, sample, coordinate, generate, resizePalette, shuffle});
})();
