(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};

  const {
    clamp, modulo, normalizeHex, hexToRgb, rgbToHsl, hslToHex,
    interpolateHue, generate, generatedTypes
  } = window.ColorPalettes;
  const fixedPaletteTypes = new Set(window.ColorPalettes.fixedPaletteTypes);

  function overflowCoordinate(value, mode) {
    if (mode === "repeat") {
      return modulo(value, 1);
    }

    if (mode === "mirror") {
      const mirrored = modulo(value, 2);

      return mirrored <= 1 ? mirrored : 2 - mirrored;
    }

    return clamp(value, 0, 1);
  }

  function mapCoordinate(position, settings) {
    const span = Math.max(0.05, Number(settings.span) || 1);
    const offset = Number(settings.offset) || 0;
    const phase = Number(settings.phase) || 0;
    let value = (position - offset) / span + phase;

    if (settings.reverse) {
      value = 1 - value;
    }

    return overflowCoordinate(value, settings.overflow || "mirror");
  }

  function sample(colors, position, interpolation) {
    const activeColors = colors.length >= 2
      ? colors
      : [colors[0] || "#000000", colors[0] || "#000000"];
    const safePosition = clamp(position, 0, 1);

    if (interpolation === "hard") {
      const index = Math.min(
        activeColors.length - 1,
        Math.floor(safePosition * activeColors.length)
      );

      return rgbToHsl(hexToRgb(activeColors[index]));
    }

    const scaled = safePosition * (activeColors.length - 1);
    const startIndex = Math.min(activeColors.length - 2, Math.floor(scaled));
    const endIndex = startIndex + 1;
    let amount = scaled - startIndex;

    if (interpolation === "smooth") {
      amount = amount * amount * (3 - 2 * amount);
    }

    const start = rgbToHsl(hexToRgb(activeColors[startIndex]));
    const end = rgbToHsl(hexToRgb(activeColors[endIndex]));

    return {
      hue: interpolateHue(start.hue, end.hue, amount),
      saturation: start.saturation +
        (end.saturation - start.saturation) * amount,
      lightness: start.lightness +
        (end.lightness - start.lightness) * amount
    };
  }

  function sampleLoop(colors, position, interpolation) {
    const activeColors = colors.length >= 2
      ? colors
      : [colors[0] || "#000000", colors[0] || "#000000"];
    const safePosition = modulo(position, 1);

    if (interpolation === "hard") {
      const index = Math.min(
        activeColors.length - 1,
        Math.floor(safePosition * activeColors.length)
      );

      return rgbToHsl(hexToRgb(activeColors[index]));
    }

    const scaled = safePosition * activeColors.length;
    const startIndex = Math.floor(scaled) % activeColors.length;
    const endIndex = (startIndex + 1) % activeColors.length;
    let amount = scaled - Math.floor(scaled);

    if (interpolation === "smooth") {
      amount = amount * amount * (3 - 2 * amount);
    }

    const start = rgbToHsl(hexToRgb(activeColors[startIndex]));
    const end = rgbToHsl(hexToRgb(activeColors[endIndex]));

    return mix(start, end, amount);
  }

  function mix(start, end, amount) {
    const safeAmount = clamp(amount, 0, 1);

    return {
      hue: interpolateHue(start.hue, end.hue, safeAmount),
      saturation: start.saturation +
        (end.saturation - start.saturation) * safeAmount,
      lightness: start.lightness +
        (end.lightness - start.lightness) * safeAmount
    };
  }

  function adjustLightness(lightness, lightnessShift) {
    const source = clamp(lightness, 0, 100);
    const shift = Number(lightnessShift) || 0;
    const amount = clamp(Math.abs(shift) / 30, 0, 1);
    const target = shift >= 0
      ? Math.max(source, 86)
      : Math.min(source, 14);

    return source + (target - source) * amount;
  }

  function toCss(color, alpha, lightnessShift) {
    const lightness = adjustLightness(
      color.lightness,
      lightnessShift
    );

    return `hsla(${color.hue}, ${color.saturation}%, ${lightness}%, ${clamp(alpha, 0, 1)})`;
  }

  root.palette = {
    adjustLightness,
    clamp,
    fixedPaletteTypes: Object.freeze(Array.from(fixedPaletteTypes)),
    generate,
    generatedTypes,
    hslToHex,
    isFixedType(type) {
      return fixedPaletteTypes.has(type);
    },
    mapCoordinate,
    mix,
    normalizeHex,
    overflowCoordinate,
    sample,
    sampleLoop,
    toCss
  };
})();
