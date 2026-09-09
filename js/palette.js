(function (app) {
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

  function makeCellNoise() {
    const dimensions = app.renderer.getDimensions();

    return Array.from({ length: dimensions.rows }, () => {
      return Array.from(
        { length: dimensions.columns },
        () => Math.random()
      );
    });
  }

  function currentCellNoiseKey() {
    const dimensions = app.renderer.getDimensions();

    return `${dimensions.rows}x${dimensions.columns}`;
  }

  function activateCellNoiseForCurrentSize() {
    const paletteState = app.state.palette;
    const key = currentCellNoiseKey();

    if (!paletteState.cellNoiseBySize[key]) {
      paletteState.cellNoiseBySize[key] = makeCellNoise();
    }

    paletteState.cellNoise = paletteState.cellNoiseBySize[key];
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

  function generatePalette() {
    const paletteState = app.state.palette;
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

  function getPaletteIndex(rowIndex, columnIndex) {
    const paletteState = app.state.palette;
    const coordinates = app.renderer.getPaletteCoordinates(
      rowIndex,
      columnIndex
    );
    const effectiveRow = coordinates.rowIndex;
    const effectiveColumn = coordinates.columnIndex;
    const rowArrangementIndex = Number.isFinite(
      coordinates.rowArrangementIndex
    )
      ? coordinates.rowArrangementIndex
      : effectiveRow;
    const columnArrangementIndex = Number.isFinite(
      coordinates.columnArrangementIndex
    )
      ? coordinates.columnArrangementIndex
      : effectiveColumn;
    const colorCount = paletteState.colors.length;

    switch (paletteState.arrangement) {
      case "rings":
        return (rowArrangementIndex + paletteState.offset) % colorCount;
      case "sectors":
        return (
          columnArrangementIndex + paletteState.offset
        ) % colorCount;
      case "checker":
        return (
          (Number.isFinite(coordinates.checkerArrangementIndex)
            ? coordinates.checkerArrangementIndex
            : effectiveRow + effectiveColumn) + paletteState.offset
        ) % colorCount;
      case "radial":
        return (
          Math.round(
            (
              Number.isFinite(coordinates.radialPosition)
                ? coordinates.radialPosition
                : effectiveRow /
                  Math.max(1, app.renderer.getDimensions().rows - 1)
            ) * (colorCount - 1)
          ) + paletteState.offset
        ) % colorCount;
      default:
        return Math.min(
          colorCount - 1,
          Math.floor(
            paletteState.cellNoise[effectiveRow][effectiveColumn] *
            colorCount
          )
        );
    }
  }

  function apply() {
    const colors = app.state.palette.colors;

    app.renderer.forEachCell((cell, rowIndex, columnIndex) => {
      const color = colors[getPaletteIndex(rowIndex, columnIndex)];

      cell.setAttribute("data-palette-color", color);
      cell.setAttribute("fill", color);
    });

    if (app.rendering) {
      app.rendering.refresh();
    }
  }

  function refresh() {
    app.state.palette.colors = generatePalette();
    apply();
  }

  function shuffle() {
    const paletteState = app.state.palette;

    paletteState.noise = makePaletteNoise();
    paletteState.cellNoiseBySize = {};
    activateCellNoiseForCurrentSize();
    paletteState.offset = Math.floor(Math.random() * 16);
    refresh();
  }

  function initialize() {
    app.state.palette.noise = makePaletteNoise();
    app.state.palette.cellNoiseBySize = {};
    activateCellNoiseForCurrentSize();
    refresh();
  }

  function handleGeometryChange() {
    activateCellNoiseForCurrentSize();

    if (app.state.palette.colors.length) {
      apply();
    } else {
      refresh();
    }
  }

  app.palette = {
    initialize: initialize,
    handleGeometryChange: handleGeometryChange,
    refresh: refresh,
    apply: apply,
    shuffle: shuffle,
    isFixedType(type) {
      return fixedPaletteTypes.has(type);
    }
  };
})(window.CircleApp = window.CircleApp || {});
