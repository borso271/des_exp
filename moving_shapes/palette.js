// Palette generation copied from ../js/palette.js (circle.html).
// Keep the color formulas identical; shape arrangement belongs to the demo.
(function () {
  "use strict";

  const presetPalettes = {
    ocean: [
      [187, 78, 42],
      [204, 88, 52],
      [222, 82, 57],
      [251, 65, 59]
    ],
    sunset: [
      [338, 78, 56],
      [7, 90, 58],
      [28, 96, 60],
      [48, 94, 62]
    ],
    candy: [
      [326, 86, 66],
      [276, 78, 67],
      [198, 90, 66],
      [166, 73, 58]
    ],
    forest: [
      [83, 49, 34],
      [111, 52, 40],
      [146, 58, 34],
      [167, 48, 44]
    ],
    neon: [
      [302, 100, 59],
      [255, 100, 66],
      [184, 100, 50],
      [75, 100, 52]
    ],
    grayscale: [
      [0, 0, 18],
      [0, 0, 42],
      [0, 0, 68],
      [0, 0, 92]
    ]
  };

  const fixedPaletteTypes = new Set(Object.keys(presetPalettes));

  function makePaletteNoise() {
    return Array.from({ length: 16 }, () => ({
      hue: Math.random(),
      saturation: Math.random(),
      lightness: Math.random()
    }));
  }

  function wrapHue(hue) {
    return ((hue % 360) + 360) % 360;
  }

  function hslColor(hue, saturation, lightness) {
    const safeSaturation = Math.min(100, Math.max(0, saturation));
    const safeLightness = Math.min(100, Math.max(0, lightness));

    return `hsl(${Math.round(wrapHue(hue))} ${Math.round(safeSaturation)}% ${Math.round(safeLightness)}%)`;
  }

  function interpolateHue(start, end, amount) {
    const distance = ((end - start + 540) % 360) - 180;

    return wrapHue(start + distance * amount);
  }

  function samplePreset(anchors, amount, variability) {
    const compressedAmount = 0.5 + (amount - 0.5) * variability;
    const position = compressedAmount * (anchors.length - 1);
    const index = Math.min(Math.floor(position), anchors.length - 2);
    const progress = position - index;
    const start = anchors[index];
    const end = anchors[index + 1];

    return hslColor(
      interpolateHue(start[0], end[0], progress),
      start[1] + (end[1] - start[1]) * progress,
      start[2] + (end[2] - start[2]) * progress
    );
  }

  function generatePalette(paletteState) {
    const type = paletteState.type;
    const count = paletteState.colorCount;
    const baseHue = paletteState.baseHue;
    const variability = paletteState.variability / 100;

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
      const noise = paletteState.noise[index];
      const position = index / Math.max(1, count - 1);
      let hue;
      let saturation;
      let lightness;

      if (type === "random") {
        hue = baseHue + (noise.hue - 0.5) * 360 * variability;
        saturation = 78 +
          (noise.saturation - 0.5) * 28 * variability;
        lightness = 56 +
          (noise.lightness - 0.5) * 24 * variability;
      } else if (type === "monochrome") {
        hue = baseHue + (noise.hue - 0.5) * 30 * variability;
        saturation = 70 +
          (noise.saturation - 0.5) * 36 * variability;
        lightness = 55 +
          (position - 0.5) * 60 * variability +
          (noise.lightness - 0.5) * 8 * variability;
      } else if (type === "analogous") {
        hue = baseHue +
          (position - 0.5) * 96 * variability +
          (noise.hue - 0.5) * 10 * variability;
        saturation = 78 +
          (noise.saturation - 0.5) * 22 * variability;
        lightness = 56 +
          (noise.lightness - 0.5) * 20 * variability;
      } else {
        const pattern = huePatterns[type];

        hue = baseHue + pattern[index % pattern.length] +
          (noise.hue - 0.5) * 16 * variability;
        saturation = 78 +
          (noise.saturation - 0.5) * 24 * variability;
        lightness = 56 +
          (noise.lightness - 0.5) * 24 * variability;
      }

      return hslColor(hue, saturation, lightness);
    });
  }

  window.MovingShapesPalette = {
    generate: generatePalette,
    makeNoise: makePaletteNoise,
    isFixedType: type => fixedPaletteTypes.has(type)
  };
})();
