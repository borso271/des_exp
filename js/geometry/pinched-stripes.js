(function (app) {
  "use strict";

  function createPinchedStripeGeometry(context) {
    const config = context.config;
    const state = context.state;
    const columns = state.geometry.pinchedColumns;
    const pinchCount = state.geometry.pinchedCount;
    const rows = pinchCount * 2 + 1;
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

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    function sideForPinch(index) {
      if (state.geometry.pinchedSides === "left") {
        return "left";
      }

      if (state.geometry.pinchedSides === "right") {
        return "right";
      }

      return index % 2 === 0 ? "right" : "left";
    }

    function animatedDepth(index, time) {
      const baseDepth = state.geometry.pinchedDepth / 100;
      const amount = state.geometry.pinchedMotion / 100;
      const speed = state.geometry.pinchedSpeed / 100;
      const wave = Math.sin(
        time * speed * (0.48 + index * 0.045) + index * 1.87
      );

      return clamp(baseDepth + wave * amount * 0.16, 0, 1);
    }

    function animatedVerticalShift(index, time) {
      const amount = state.geometry.pinchedMotion / 100;
      const speed = state.geometry.pinchedSpeed / 100;
      const wave = Math.sin(
        time * speed * (0.76 + index * 0.057) + 1.13 + index * 2.09
      );

      return wave * amount * 0.32;
    }

    function endpointWeights(time) {
      const left = Array(rows).fill(1);
      const right = Array(rows).fill(1);

      for (let index = 0; index < pinchCount; index += 1) {
        const row = index * 2 + 1;
        const depth = animatedDepth(index, time);
        const narrow = 1 - depth * 0.95;
        const wide = 1 + depth * 1.42;

        if (sideForPinch(index) === "left") {
          left[row] = narrow;
          right[row] = wide;
        } else {
          left[row] = wide;
          right[row] = narrow;
        }
      }

      for (let index = 0; index < pinchCount; index += 1) {
        const row = index * 2 + 1;
        const shift = animatedVerticalShift(index, time);
        const endpoint = sideForPinch(index) === "left" ? left : right;

        endpoint[row - 1] = Math.max(0.12, endpoint[row - 1] + shift);
        endpoint[row + 1] = Math.max(0.12, endpoint[row + 1] - shift);
      }

      return { left: left, right: right };
    }

    function positionMap(position) {
      const shift = (
        state.geometry.pinchedPosition / 100 - 0.5
      ) * 0.34;

      return position + shift * Math.sin(Math.PI * position);
    }

    function boundariesFromWeights(weights) {
      const normalized = app.utils.normalize(weights, 1);
      const boundaries = [0];

      normalized.forEach((size) => {
        boundaries.push(boundaries[boundaries.length - 1] + size);
      });
      boundaries[boundaries.length - 1] = 1;

      const halfHeight = config.height / 2;

      return boundaries.map((boundary) => {
        const mapped = clamp(positionMap(boundary), 0, 1);

        return -halfHeight + mapped * config.height;
      });
    }

    function applySlant(left, right) {
      const amount = state.geometry.pinchedSlant / 100;

      return {
        left: left.map((value, index) => {
          const middle = (value + right[index]) / 2;

          return middle + (value - middle) * amount;
        }),
        right: right.map((value, index) => {
          const middle = (value + left[index]) / 2;

          return middle + (value - middle) * amount;
        })
      };
    }

    function verticalSymmetry(boundaries) {
      return boundaries.map((value, index) => {
        return (value - boundaries[rows - index]) / 2;
      });
    }

    function interpolate(start, end, amount) {
      return start + (end - start) * amount;
    }

    function createBoundarySampler(time) {
      const weights = endpointWeights(time);
      const endpoints = applySlant(
        boundariesFromWeights(weights.left),
        boundariesFromWeights(weights.right)
      );
      const halfWidth = config.width / 2;
      const mode = state.symmetry;

      if (mode === "vertical") {
        endpoints.left = verticalSymmetry(endpoints.left);
        endpoints.right = verticalSymmetry(endpoints.right);
      } else if (mode === "four-way") {
        endpoints.left = verticalSymmetry(endpoints.left);
        endpoints.right = verticalSymmetry(endpoints.right);
      }

      if (mode === "horizontal" || mode === "four-way") {
        return (row, x) => {
          const distance = Math.abs(x) / halfWidth;

          return interpolate(
            endpoints.right[row],
            endpoints.left[row],
            distance
          );
        };
      }

      if (mode === "point") {
        const center = verticalSymmetry(endpoints.right);

        return (row, x) => {
          if (x <= 0) {
            return interpolate(
              endpoints.left[row],
              center[row],
              (x + halfWidth) / halfWidth
            );
          }

          return -interpolate(
            endpoints.left[rows - row],
            center[rows - row],
            (halfWidth - x) / halfWidth
          );
        };
      }

      return (row, x) => {
        return interpolate(
          endpoints.left[row],
          endpoints.right[row],
          (x + halfWidth) / config.width
        );
      };
    }

    function number(value) {
      return Math.abs(value) < 0.0005 ? "0" : value.toFixed(3);
    }

    function cellPath(row, left, right, boundaryAt) {
      const xValues = [left];

      if (left < 0 && right > 0) {
        xValues.push(0);
      }

      xValues.push(right);

      const top = xValues.map((x) => ({
        x: x,
        y: boundaryAt(row, x) - (row === 0 ? 0 : config.cellOverlap)
      }));
      const bottom = xValues.slice().reverse().map((x) => ({
        x: x,
        y: boundaryAt(row + 1, x) +
          (row === rows - 1 ? 0 : config.cellOverlap)
      }));
      const points = top.concat(bottom);

      return points.map((point, index) => {
        const command = index === 0 ? "M" : "L";

        return `${command} ${number(point.x)} ${number(point.y)}`;
      }).join(" ") + " Z";
    }

    function update(time) {
      const boundaryAt = createBoundarySampler(time);
      const columnWidth = config.width / columns;

      paths.forEach((rowPaths, row) => {
        rowPaths.forEach((path, column) => {
          const left = column === 0
            ? -config.width / 2
            : -config.width / 2 + column * columnWidth -
              config.cellOverlap;
          const right = column === columns - 1
            ? config.width / 2
            : -config.width / 2 + (column + 1) * columnWidth +
              config.cellOverlap;

          path.setAttribute("d", cellPath(row, left, right, boundaryAt));
        });
      });
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

  app.geometryRegistry.register("pinched", {
    label: "Animated optical grid of vertically striped pinched cells",
    presentation: {
      className: "presentation-canvas",
      clipPath: null,
      preserveAspectRatio: "none"
    },
    create: createPinchedStripeGeometry
  });
})(window.CircleApp = window.CircleApp || {});
