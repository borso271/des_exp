(() => {
  'use strict';

  const colors = window.ColorPalettes;
  const reference = Object.freeze({
    coreColor: '#05a7ff', seamColor: '#03ffff',
    spillColor: '#021fff', ambientColor: '#000637'
  });
  const colorKeys = Object.keys(reference);
  const controlKeys = ['paletteStyle', 'baseHue', 'colorVariation'];

  function defaultHue(type) {
    const first = colors.generate({type, count: 4, variability: 100, seed: 2107})[0];
    return Math.round(colors.rgbToHsl(colors.hexToRgb(first)).hue);
  }

  function generate(parameters) {
    const type = parameters.paletteStyle;
    const palette = colors.generate({
      type, count: 4, baseHue: parameters.baseHue,
      variability: parameters.colorVariation, seed: 2107
    });
    const rotation = colors.isFixedType(type) ? parameters.baseHue - defaultHue(type) : 0;
    // Give each color a lighting role. Keep the room dark and highlights
    // luminous regardless of the source palette's original lightness.
    const role = (index, lightness, saturationBoost) => {
      const color = colors.rgbToHsl(colors.hexToRgb(palette[index]));
      const saturation = color.saturation === 0 ? 0 : color.saturation + saturationBoost;
      return colors.hslToHex(color.hue + rotation, saturation, lightness);
    };
    return {
      coreColor: role(0, 51, 12),
      seamColor: role(2, 68, -8),
      spillColor: role(1, 48, 16),
      ambientColor: role(3, 9, 5)
    };
  }

  // Apply palette changes only when requested, so geometry edits and JSON
  // restoration never overwrite manually tuned colors.
  function applyChange(next, previous, patch) {
    const result = {...next};
    const styleChanged = result.paletteStyle !== previous.paletteStyle;
    const paletteChanged = controlKeys.some(key => result[key] !== previous[key]);
    if (paletteChanged) {
      if (styleChanged && result.paletteStyle === 'reference') {
        Object.assign(result, reference, {baseHue: 210, colorVariation: 40});
      } else if (!(styleChanged && result.paletteStyle === 'custom')) {
        if (['reference', 'custom'].includes(result.paletteStyle)) result.paletteStyle = 'monochrome';
        if (styleChanged && colors.isFixedType(result.paletteStyle) && !Object.hasOwn(patch, 'baseHue')) {
          result.baseHue = defaultHue(result.paletteStyle);
        }
        Object.assign(result, generate(result));
      }
    }
    // Explicit individual colors win, including in a combined public API call.
    const manualKeys = colorKeys.filter(key => Object.hasOwn(patch, key) &&
      typeof patch[key] === 'string' && /^#[\da-f]{6}$/i.test(patch[key]));
    if (manualKeys.length) {
      for (const key of manualKeys) result[key] = next[key];
      result.paletteStyle = 'custom';
    }
    return result;
  }

  function lightTints(parameters, toLinear) {
    // Preserve the original reference image and legacy blue settings.
    if (colorKeys.every(key => parameters[key] === reference[key])) {
      return {bloom: [0.38, 0.45, 1], floor: [0.0004, 0.0006, 0.0011]};
    }
    const normalized = hex => {
      const rgb = toLinear(hex);
      const maximum = Math.max(...rgb);
      return maximum > 0 ? rgb.map(channel => channel / maximum) : [0, 0, 0];
    };
    return {
      bloom: normalized(parameters.spillColor).map(channel => 0.38 + channel * 0.62),
      floor: normalized(parameters.ambientColor).map(channel => channel * 0.0011)
    };
  }

  window.TrianglePalette = Object.freeze({reference, generate, defaultHue, applyChange, lightTints});
})();
