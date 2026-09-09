// Shared color generation and conversion. Classic script for file:// support.
(() => {
  "use strict";

  const generatedTypes = Object.freeze([
    "random",
    "monochrome",
    "analogous",
    "complementary",
    "split",
    "triadic",
    "ocean",
    "sunset",
    "candy",
    "forest",
    "neon",
    "grayscale"
  ]);
  const presetPalettes = Object.freeze({
    ocean: Object.freeze([
      [187, 78, 42],
      [204, 88, 52],
      [222, 82, 57],
      [251, 65, 59]
    ]),
    sunset: Object.freeze([
      [338, 78, 56],
      [7, 90, 58],
      [28, 96, 60],
      [48, 94, 62]
    ]),
    candy: Object.freeze([
      [326, 86, 66],
      [276, 78, 67],
      [198, 90, 66],
      [166, 73, 58]
    ]),
    forest: Object.freeze([
      [83, 49, 34],
      [111, 52, 40],
      [146, 58, 34],
      [167, 48, 44]
    ]),
    neon: Object.freeze([
      [302, 100, 59],
      [255, 100, 66],
      [184, 100, 50],
      [75, 100, 52]
    ]),
    grayscale: Object.freeze([
      [0, 0, 18],
      [0, 0, 42],
      [0, 0, 68],
      [0, 0, 92]
    ])
  });
  const fixedPaletteTypes = new Set(Object.keys(presetPalettes));

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function wrapHue(value) {
    return modulo(Number(value) || 0, 360);
  }

  function normalizeHex(hex) {
    const value = String(hex || "").trim().replace(/^#/, "");

    if (/^[0-9a-f]{3}$/i.test(value)) {
      return `#${value.split("").map((digit) => digit + digit).join("")}`;
    }

    return /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : "#000000";
  }

  function hexToRgb(hex) {
    const value = normalizeHex(hex).slice(1);

    return {
      red: parseInt(value.slice(0, 2), 16),
      green: parseInt(value.slice(2, 4), 16),
      blue: parseInt(value.slice(4, 6), 16)
    };
  }

  function rgbToHsl(rgb) {
    const red = rgb.red / 255;
    const green = rgb.green / 255;
    const blue = rgb.blue / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const lightness = (maximum + minimum) / 2;
    const delta = maximum - minimum;

    if (delta === 0) {
      return { hue: 0, saturation: 0, lightness: lightness * 100 };
    }

    let hue;

    if (maximum === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (maximum === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }

    hue = ((hue * 60) + 360) % 360;

    return {
      hue,
      saturation: delta / (1 - Math.abs(2 * lightness - 1)) * 100,
      lightness: lightness * 100
    };
  }

  function hslToHex(hue, saturation, lightness) {
    const normalizedHue = wrapHue(hue);
    const normalizedSaturation = clamp(saturation, 0, 100) / 100;
    const normalizedLightness = clamp(lightness, 0, 100) / 100;
    const chroma = (
      1 - Math.abs(2 * normalizedLightness - 1)
    ) * normalizedSaturation;
    const segment = normalizedHue / 60;
    const secondary = chroma * (1 - Math.abs(segment % 2 - 1));
    let red = 0;
    let green = 0;
    let blue = 0;

    if (segment < 1) {
      red = chroma;
      green = secondary;
    } else if (segment < 2) {
      red = secondary;
      green = chroma;
    } else if (segment < 3) {
      green = chroma;
      blue = secondary;
    } else if (segment < 4) {
      green = secondary;
      blue = chroma;
    } else if (segment < 5) {
      red = secondary;
      blue = chroma;
    } else {
      red = chroma;
      blue = secondary;
    }

    const offset = normalizedLightness - chroma / 2;
    const component = (value) => {
      return Math.round((value + offset) * 255)
        .toString(16)
        .padStart(2, "0");
    };

    return `#${component(red)}${component(green)}${component(blue)}`;
  }

  function interpolateHue(start, end, amount) {
    const distance = ((end - start + 540) % 360) - 180;

    return (start + distance * amount + 360) % 360;
  }

  function seededRandom(seed) {
    let value = (Number(seed) || 0) >>> 0;

    return function random() {
      value += 0x6D2B79F5;
      let result = value;

      result = Math.imul(result ^ result >>> 15, result | 1);
      result ^= result + Math.imul(result ^ result >>> 7, result | 61);
      return ((result ^ result >>> 14) >>> 0) / 4294967296;
    };
  }

  function samplePreset(anchors, amount, variability) {
    const compressedAmount = 0.5 + (amount - 0.5) * variability;
    const position = compressedAmount * (anchors.length - 1);
    const startIndex = Math.min(
      anchors.length - 2,
      Math.floor(position)
    );
    const endIndex = startIndex + 1;
    const progress = position - startIndex;
    const start = anchors[startIndex];
    const end = anchors[endIndex];

    return hslToHex(
      interpolateHue(start[0], end[0], progress),
      start[1] + (end[1] - start[1]) * progress,
      start[2] + (end[2] - start[2]) * progress
    );
  }

  function generate(settings) {
    const requestedType = String(settings && settings.type || "random");
    const type = generatedTypes.includes(requestedType)
      ? requestedType
      : "random";
    const count = Math.round(clamp(
      Number(settings && settings.count) || 2,
      2,
      16
    ));
    const baseHue = wrapHue(settings && settings.baseHue);
    const variability = clamp(
      Number(settings && settings.variability) || 0,
      0,
      100
    ) / 100;
    const random = seededRandom(settings && settings.seed);
    const noise = Array.from({ length: count }, () => ({
      hue: random(),
      saturation: random(),
      lightness: random()
    }));

    if (fixedPaletteTypes.has(type)) {
      const anchors = presetPalettes[type];

      return Array.from({ length: count }, (_, index) => {
        return samplePreset(
          anchors,
          index / Math.max(1, count - 1),
          variability
        );
      });
    }

    const huePatterns = {
      complementary: [0, 180],
      split: [0, 150, 210],
      triadic: [0, 120, 240]
    };

    return Array.from({ length: count }, (_, index) => {
      const colorNoise = noise[index];
      const position = index / Math.max(1, count - 1);
      let hue;
      let saturation;
      let lightness;

      if (type === "random") {
        hue = baseHue + (colorNoise.hue - 0.5) * 360 * variability;
        saturation = 78 +
          (colorNoise.saturation - 0.5) * 28 * variability;
        lightness = 56 +
          (colorNoise.lightness - 0.5) * 24 * variability;
      } else if (type === "monochrome") {
        hue = baseHue + (colorNoise.hue - 0.5) * 30 * variability;
        saturation = 70 +
          (colorNoise.saturation - 0.5) * 36 * variability;
        lightness = 55 +
          (position - 0.5) * 60 * variability +
          (colorNoise.lightness - 0.5) * 8 * variability;
      } else if (type === "analogous") {
        hue = baseHue +
          (position - 0.5) * 96 * variability +
          (colorNoise.hue - 0.5) * 10 * variability;
        saturation = 78 +
          (colorNoise.saturation - 0.5) * 22 * variability;
        lightness = 56 +
          (colorNoise.lightness - 0.5) * 20 * variability;
      } else {
        const pattern = huePatterns[type];

        hue = baseHue +
          pattern[index % pattern.length] * variability +
          (colorNoise.hue - 0.5) * 16 * variability;
        saturation = 78 +
          (colorNoise.saturation - 0.5) * 24 * variability;
        lightness = 56 +
          (colorNoise.lightness - 0.5) * 24 * variability;
      }

      return hslToHex(hue, saturation, lightness);
    });
  }

  window.ColorPalettes = Object.freeze({
    clamp, modulo, wrapHue, normalizeHex, hexToRgb, rgbToHsl, hslToHex,
    interpolateHue, generate, generatedTypes,
    fixedPaletteTypes: Object.freeze(Array.from(fixedPaletteTypes)),
    isFixedType: (type) => fixedPaletteTypes.has(type)
  });
})();
