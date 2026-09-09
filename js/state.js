(function (app) {
  "use strict";

  app.constants = {
    svgNamespace: "http://www.w3.org/2000/svg",
    framePresets: {
      square: { width: 900, height: 900 },
      landscape: { width: 1080, height: 720 },
      widescreen: { width: 1200, height: 675 },
      portrait: { width: 675, height: 900 }
    },
    geometry: {
      rings: {
        radius: 96,
        ringCount: 8,
        sectorsPerQuadrant: 4,
        sectorCount: 16,
        ringMovement: 0.42,
        sectorMovement: 0.46,
        radialOverlap: 0.18,
        angularOverlap: 0.0018
      },
      polygons: {
        radius: 96,
        ringCount: 8,
        sectorsPerQuadrant: 4,
        sectorCount: 16,
        ringMovement: 0.42,
        sectorMovement: 0.46,
        radialOverlap: 0.18,
        angularOverlap: 0.0018
      },
      superellipse: {
        radius: 96,
        ringCount: 8,
        sectorsPerQuadrant: 4,
        sectorCount: 16,
        ringMovement: 0.42,
        sectorMovement: 0.46,
        radialOverlap: 0.18,
        angularOverlap: 0.0018
      },
      grid: {
        width: 192,
        height: 192,
        rowMovement: 0.42,
        columnMovement: 0.46,
        cellOverlap: 0.18
      },
      diagonal: {
        width: 192,
        height: 192,
        bandMovement: 0.46,
        bandOverlap: 0.18
      },
      pinched: {
        width: 192,
        height: 192,
        cellOverlap: 0.16
      },
      moving: {
        speed: 0.23 / 0.78,
        weightStrength: 0.025
      },
      rays: {
        width: 192,
        height: 192,
        angularOverlap: 0.0022
      }
    }
  };

  app.state = {
    geometry: {
      type: "rings",
      ringCount: 8,
      sectorCount: 16,
      polygonSides: 6,
      superellipseRoundness: 4,
      shapeRotation: 0,
      gridRows: 8,
      gridColumns: 16,
      diagonalBandCount: 12,
      diagonalAngle: 35,
      diagonalOffset: 0,
      pinchedColumns: 16,
      pinchedCount: 2,
      pinchedDepth: 92,
      pinchedPosition: 50,
      pinchedSides: "alternating",
      pinchedSlant: 100,
      pinchedMotion: 55,
      pinchedSpeed: 150,
      movingShapeCount: 18,
      movingBreathing: 65,
      movingSpeed: 100,
      rayOrigin: "bottom-center",
      rayCount: 16,
      rayMotion: 48,
      raySpeed: 120
    },
    animation: {
      speed: 0.78,
      reducedMotionMultiplier: 0.25
    },
    rendering: {
      style: "solid",
      gradientType: "linear",
      gradientAngle: 90,
      gradientReverse: false,
      bloom: 86,
      softness: 28,
      paleDepth: 34,
      transition: 54,
      warmth: 70,
      fieldScale: 100,
      variation: 55,
      motion: 35,
      speed: 90,
      seed: 2107
    },
    symmetry: "four-way",
    controlsVisible: true,
    frame: {
      preset: "square",
      width: 900,
      height: 900
    },
    overlays: {
      textContent: "event",
      showLogo: true,
      showEventCopy: true,
      alignment: "top",
      padding: 24,
      eventTextEffect: "invert",
      eventTextAccent: "#7c5cff",
      logoEffect: "invert",
      logoAccent: "#7c5cff",
      matchTextAccent: false,
      effectStrength: 100,
      effectBlur: 10,
      effectHue: 90,
      effectOpacity: 100
    },
    palette: {
      type: "random",
      baseHue: 220,
      colorCount: 8,
      variability: 40,
      arrangement: "random",
      noise: [],
      cellNoise: [],
      cellNoiseBySize: {},
      offset: 0,
      colors: []
    }
  };

  app.utils = {
    random(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    },

    normalize(values, total) {
      const sum = values.reduce((result, value) => result + value, 0);

      return values.map((value) => (value / sum) * total);
    }
  };

  app.symmetry = {
    mirrorsAxis(mode, axis) {
      if (mode === "four-way" || mode === "point") {
        return true;
      }

      return (
        (axis === "columns" && mode === "horizontal") ||
        (axis === "rows" && mode === "vertical")
      );
    },

    mirrorIndex(index, count) {
      return Math.min(index, count - 1 - index);
    },

    mapPolarIndex(index, count, mode) {
      if (count === 1 || (count % 2 !== 0 && mode !== "horizontal")) return index;
      const horizontal = count - 1 - index;
      const vertical = (
        count / 2 - 1 - index + count
      ) % count;
      const point = (index + count / 2) % count;

      switch (mode) {
        case "horizontal":
          return Math.min(index, horizontal);
        case "vertical":
          return Math.min(index, vertical);
        case "four-way":
          return Math.min(index, horizontal, vertical, point);
        case "point":
          return Math.min(index, point);
        default:
          return index;
      }
    },

    mapGridCoordinates(rowIndex, columnIndex, rows, columns, mode) {
      const mirroredRow = rows - 1 - rowIndex;
      const mirroredColumn = columns - 1 - columnIndex;

      switch (mode) {
        case "horizontal":
          return {
            rowIndex: rowIndex,
            columnIndex: Math.min(columnIndex, mirroredColumn)
          };
        case "vertical":
          return {
            rowIndex: Math.min(rowIndex, mirroredRow),
            columnIndex: columnIndex
          };
        case "four-way":
          return {
            rowIndex: Math.min(rowIndex, mirroredRow),
            columnIndex: Math.min(columnIndex, mirroredColumn)
          };
        case "point": {
          const index = rowIndex * columns + columnIndex;
          const mirroredIndex =
            mirroredRow * columns + mirroredColumn;

          return index <= mirroredIndex
            ? { rowIndex: rowIndex, columnIndex: columnIndex }
            : {
                rowIndex: mirroredRow,
                columnIndex: mirroredColumn
              };
        }
        default:
          return {
            rowIndex: rowIndex,
            columnIndex: columnIndex
          };
      }
    }
  };
})(window.CircleApp = window.CircleApp || {});
