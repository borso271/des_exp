// Palette generation and field mapping; independent of the WebGL renderer.
(() => {
  'use strict';
  const colors = window.ColorPalettes;
  const {clamp, rgbToHsl, hexToRgb, hslToHex, interpolateHue} = colors;
  const reference = Object.freeze({
    bg:'#02a97a', c1:'#44ddb2', c2:'#58dcb8', c3:'#7adfc5', c4:'#98e6d6', c5:'#bcece6'
  });
  const fieldKeys = Object.freeze(['c1', 'c2', 'c3', 'c4', 'c5']);
  const defaults = Object.freeze({
    paletteVersion:1, paletteStyle:'reference', baseHue:160, colorVariation:60, paletteSeed:2107,
    hueRotation:0, saturation:100, brightness:0,
    progression:'sequence', reversePalette:false, paletteSpan:100, paletteOffset:0,
    colorBlend:'hsl', lightProfile:'palette', lightStrength:75,
    backgroundMode:'manual', backgroundOffset:-18, backgroundColor:reference.bg,
    customColors:Object.freeze(fieldKeys.map(key => reference[key]))
  });
  const enums = {
    paletteStyle:['reference', 'custom', ...colors.generatedTypes],
    progression:['sequence', 'ease-in', 'ease-out', 'return', 'alternating'],
    colorBlend:['hsl', 'rgb', 'steps'], lightProfile:['palette', 'luminous', 'dark-core', 'alternating'],
    backgroundMode:['related', 'opposite', 'manual']
  };
  const ranges = {
    baseHue:[0,360], colorVariation:[0,100], paletteSeed:[0,4294967295], hueRotation:[-180,180],
    saturation:[0,150], brightness:[-40,40], paletteSpan:[10,100], paletteOffset:[-100,100],
    lightStrength:[0,100], backgroundOffset:[-60,40]
  };
  const isHex = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
  const hsl = hex => rgbToHsl(hexToRgb(hex));
  const isGenerated = style => colors.generatedTypes.includes(style);
  const controlKeys = Object.keys(defaults).filter(key => key !== 'paletteVersion');

  function sanitize(input, previous = defaults) {
    const next = {...previous};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return next;
    for (const [key, values] of Object.entries(enums)) if (values.includes(input[key])) next[key] = input[key];
    for (const [key, [min, max]] of Object.entries(ranges)) {
      if (typeof input[key] === 'number' && Number.isFinite(input[key])) next[key] = clamp(input[key], min, max);
    }
    next.paletteSeed = Math.round(next.paletteSeed);
    if (typeof input.reversePalette === 'boolean') next.reversePalette = input.reversePalette;
    if (isHex(input.backgroundColor)) next.backgroundColor = input.backgroundColor.toLowerCase();
    if (Array.isArray(input.customColors) && input.customColors.length === 5 && input.customColors.every(isHex)) {
      next.customColors = input.customColors.map(hex => hex.toLowerCase());
    }
    return next;
  }

  function sourcePalette(settings) {
    if (settings.paletteStyle === 'reference') return fieldKeys.map(key => reference[key]);
    if (settings.paletteStyle === 'custom') return [...settings.customColors];
    return colors.generate({type:settings.paletteStyle, count:5, baseHue:settings.baseHue,
      variability:settings.colorVariation, seed:settings.paletteSeed});
  }

  function sample(palette, amount, space) {
    const position = clamp(amount, 0, 1) * (palette.length - 1);
    if (space === 'steps') return palette[Math.round(position)];
    const index = Math.floor(position), t = position - index;
    const start = palette[index], end = palette[Math.min(index + 1, palette.length - 1)];
    if (t === 0) return start;
    if (space === 'rgb') {
      const toLinear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      const toSrgb = value => value <= .0031308 ? value * 12.92 : 1.055 * value ** (1/2.4) - .055;
      const a = Object.values(hexToRgb(start)), b = Object.values(hexToRgb(end));
      return '#' + a.map((channel, i) => {
        const linear = toLinear(channel/255) * (1-t) + toLinear(b[i]/255) * t;
        return Math.round(clamp(toSrgb(linear), 0, 1)*255).toString(16).padStart(2, '0');
      }).join('');
    }
    const a = hsl(start), b = hsl(end);
    if (a.saturation === 0) a.hue = b.hue;
    if (b.saturation === 0) b.hue = a.hue;
    return hslToHex(interpolateHue(a.hue, b.hue, t),
      a.saturation + (b.saturation-a.saturation)*t, a.lightness + (b.lightness-a.lightness)*t);
  }

  function position(index, settings) {
    let t = index/4;
    if (settings.progression === 'ease-in') t *= t;
    if (settings.progression === 'ease-out') t = 1-(1-t)**2;
    if (settings.progression === 'return') t = 1-Math.abs(2*t-1);
    if (settings.progression === 'alternating') t = [0,1,.25,.75,.5][index];
    if (settings.reversePalette) t = 1-t;
    return clamp(.5 + (t-.5)*settings.paletteSpan/100 + settings.paletteOffset/100, 0, 1);
  }

  function adjust(hex, settings, index) {
    const color = hsl(hex);
    let lightness = color.lightness;
    if (index !== undefined && settings.lightProfile !== 'palette') {
      const target = settings.lightProfile === 'luminous' ? 42 + index/4*44
        : settings.lightProfile === 'dark-core' ? 78 - index/4*60
        : index % 2 === 0 ? 78 : 28;
      lightness += (target-lightness)*settings.lightStrength/100;
    }
    // Preserve exact original/manual hex values when all adjustments are neutral.
    if (!settings.hueRotation && settings.saturation === 100 && !settings.brightness && lightness === color.lightness) return hex;
    return hslToHex(color.hue + settings.hueRotation, color.saturation*settings.saturation/100,
      lightness + settings.brightness);
  }

  function generate(settings) {
    const source = sourcePalette(settings);
    const result = Object.fromEntries(fieldKeys.map((key, index) => [key,
      adjust(sample(source, position(index, settings), settings.colorBlend), settings, index)]));
    if (settings.backgroundMode === 'manual') result.bg = adjust(settings.backgroundColor, settings);
    else {
      const color = hsl(result.c1);
      result.bg = hslToHex(color.hue + (settings.backgroundMode === 'opposite' ? 180 : 0),
        color.saturation, color.lightness + settings.backgroundOffset);
    }
    return result;
  }

  // Rebase explicit field edits on the displayed palette, preserving every other
  // field. Subsequent global adjustments then start from these custom colors.
  function capture(state, overrides = {}) {
    const shown = {...state, ...overrides};
    return {...defaults, paletteStyle:'custom', baseHue:state.baseHue,
      colorVariation:state.colorVariation, paletteSeed:state.paletteSeed,
      customColors:fieldKeys.map(key => shown[key]), backgroundColor:shown.bg,
      ...Object.fromEntries(['bg', ...fieldKeys].map(key => [key, shown[key]]))};
  }

  function applyChange(previous, patch) {
    const next = sanitize(patch, previous);
    if (next.paletteStyle !== previous.paletteStyle && next.paletteStyle === 'reference') {
      Object.assign(next, defaults, reference);
    } else if (next.paletteStyle !== previous.paletteStyle && next.paletteStyle === 'custom') {
      Object.assign(next, capture(previous));
    } else {
      if (next.paletteStyle !== previous.paletteStyle && isGenerated(next.paletteStyle)) {
        // A generated study starts with a luminous core and a related surround.
        if (!isGenerated(previous.paletteStyle)) {
          if (!Object.hasOwn(patch, 'lightProfile')) next.lightProfile = 'luminous';
          if (!Object.hasOwn(patch, 'backgroundMode')) next.backgroundMode = 'related';
        }
      }
      if (controlKeys.some(key => Object.hasOwn(patch, key))) Object.assign(next, generate(next));
    }
    const manual = Object.fromEntries(['bg', ...fieldKeys].filter(key => isHex(patch[key]))
      .map(key => [key, patch[key].toLowerCase()]));
    if (Object.keys(manual).length) Object.assign(next, capture(next, manual));
    return next;
  }

  function restore(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid settings');
    if (input.paletteVersion !== 1) {
      const valid = Object.fromEntries(['bg', ...fieldKeys].filter(key => isHex(input[key])).map(key => [key, input[key]]));
      return {...defaults, ...capture({...reference, ...defaults}, valid)};
    }
    const settings = sanitize(input);
    return {...settings, ...generate(settings)};
  }

  const studies = Object.freeze({
    reference:{...defaults, ...reference},
    amber:{paletteStyle:'monochrome', baseHue:35, colorVariation:25, lightProfile:'luminous', lightStrength:90},
    dusk:{paletteStyle:'sunset', colorVariation:100, reversePalette:true, lightProfile:'luminous', lightStrength:55},
    violet:{paletteStyle:'analogous', baseHue:270, colorVariation:70, lightProfile:'luminous', lightStrength:85, backgroundOffset:-36},
    ice:{paletteStyle:'ocean', colorVariation:60, reversePalette:true, saturation:65, lightProfile:'luminous', lightStrength:90},
    eclipse:{paletteStyle:'monochrome', baseHue:16, colorVariation:35, lightProfile:'dark-core', lightStrength:100, backgroundOffset:-40},
    silver:{paletteStyle:'grayscale', colorVariation:100, lightProfile:'luminous', lightStrength:50, backgroundOffset:-25}
  });
  function study(name) {
    if (name === 'reference' || !studies[name]) return {...defaults, ...reference};
    const settings = {...defaults, backgroundMode:'related', ...studies[name]};
    return {...settings, ...generate(settings)};
  }

  window.EllipsePalette = Object.freeze({reference, defaults, fieldKeys, isGenerated,
    sanitize, sourcePalette, sample, position, generate, applyChange, restore, study});
})();
