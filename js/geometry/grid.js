(function (app) {
  "use strict";

  function createGridGeometry(context) {
    const config = context.config;
    const state = context.state;
    const rows = state.geometry.gridRows;
    const columns = state.geometry.gridColumns;
    const random = app.utils.random;
    const normalize = app.utils.normalize;

    const rowAnimation = Array.from({ length: rows }, (_, index) => ({
      base: random(0.72, 1.35),
      phaseA: random(0, Math.PI * 2),
      phaseB: random(0, Math.PI * 2),
      rateA: random(0.38, 0.72) + index * 0.014,
      rateB: random(0.18, 0.34) + index * 0.009
    }));
    const columnAnimation = Array.from(
      { length: columns },
      (_, index) => ({
        base: random(0.78, 1.28),
        phaseA: random(0, Math.PI * 2),
        phaseB: random(0, Math.PI * 2),
        rateA: random(0.38, 0.76) + index * 0.05,
        rateB: random(0.17, 0.31) + index * 0.03
      })
    );
    const paths = Array.from({ length: rows }, () => {
      return Array.from({ length: columns }, () => {
        const path = document.createElementNS(
          app.constants.svgNamespace,
          "path"
        );

        context.cellsGroup.appendChild(path);
        return path;
      });
    });

    function animatedWeights(settingsList, time, movement, axis) {
      const weights = settingsList.map((settings) => {
        const primaryWave = Math.sin(
          time * settings.rateA + settings.phaseA
        );
        const secondaryWave = Math.sin(
          time * settings.rateB + settings.phaseB
        );

        return Math.max(
          0.16,
          settings.base * (
            1 + movement * primaryWave + 0.11 * secondaryWave
          )
        );
      });

      if (!app.symmetry.mirrorsAxis(state.symmetry, axis)) {
        return weights;
      }

      return weights.map((_, index) => {
        return weights[app.symmetry.mirrorIndex(index, weights.length)];
      });
    }

    function boundaries(weights, total) {
      const sizes = normalize(weights, total);
      const positions = [-total / 2];

      for (const size of sizes) {
        positions.push(positions[positions.length - 1] + size);
      }

      positions[positions.length - 1] = total / 2;
      return positions;
    }

    function number(value) {
      return value.toFixed(3);
    }

    function rectanglePath(left, top, right, bottom) {
      return [
        `M ${number(left)} ${number(top)}`,
        `L ${number(right)} ${number(top)}`,
        `L ${number(right)} ${number(bottom)}`,
        `L ${number(left)} ${number(bottom)}`,
        "Z"
      ].join(" ");
    }

    function update(time) {
      const rowWeights = animatedWeights(
        rowAnimation,
        time,
        config.rowMovement,
        "rows"
      );
      const columnWeights = animatedWeights(
        columnAnimation,
        time,
        config.columnMovement,
        "columns"
      );
      const y = boundaries(rowWeights, config.height);
      const x = boundaries(columnWeights, config.width);

      for (let row = 0; row < rows; row += 1) {
        const top = row === 0
          ? y[row]
          : y[row] - config.cellOverlap;
        const bottom = row === rows - 1
          ? y[row + 1]
          : y[row + 1] + config.cellOverlap;

        for (let column = 0; column < columns; column += 1) {
          const left = column === 0
            ? x[column]
            : x[column] - config.cellOverlap;
          const right = column === columns - 1
            ? x[column + 1]
            : x[column + 1] + config.cellOverlap;

          paths[row][column].setAttribute(
            "d",
            rectanglePath(left, top, right, bottom)
          );
        }
      }
    }

    return {
      update: update,

      forEachCell(callback) {
        paths.forEach((rowPaths, rowIndex) => {
          rowPaths.forEach((path, columnIndex) => {
            callback(path, rowIndex, columnIndex);
          });
        });
      },

      getPaletteCoordinates(rowIndex, columnIndex) {
        const coordinates = app.symmetry.mapGridCoordinates(
          rowIndex,
          columnIndex,
          rows,
          columns,
          state.symmetry
        );
        const normalizedX = columns <= 1
          ? 0
          : coordinates.columnIndex / (columns - 1) * 2 - 1;
        const normalizedY = rows <= 1
          ? 0
          : coordinates.rowIndex / (rows - 1) * 2 - 1;

        return {
          rowIndex: coordinates.rowIndex,
          columnIndex: coordinates.columnIndex,
          radialPosition: Math.min(
            1,
            Math.hypot(normalizedX, normalizedY) / Math.SQRT2
          )
        };
      },

      getDimensions() {
        return {
          rows: rows,
          columns: columns
        };
      }
    };
  }

  app.geometryRegistry.register("grid", {
    label: "Animated modular grid of colored rectangular cells",
    presentation: {
      className: "presentation-canvas",
      clipPath: null,
      preserveAspectRatio: "none"
    },
    create: createGridGeometry
  });
})(window.CircleApp = window.CircleApp || {});
