(function (app) {
  "use strict";

  function createDiagonalBandGeometry(context) {
    const config = context.config;
    const state = context.state;
    const bandCount = state.geometry.diagonalBandCount;
    const random = app.utils.random;
    const normalize = app.utils.normalize;
    const epsilon = 0.000001;
    const animation = Array.from({ length: bandCount }, (_, index) => ({
      base: random(0.76, 1.3),
      phaseA: random(0, Math.PI * 2),
      phaseB: random(0, Math.PI * 2),
      rateA: random(0.34, 0.7) + index * 0.027,
      rateB: random(0.16, 0.32) + index * 0.014
    }));
    const paths = Array.from({ length: bandCount }, () => {
      const path = document.createElementNS(
        app.constants.svgNamespace,
        "path"
      );

      context.cellsGroup.appendChild(path);
      return path;
    });

    function dot(point, normal) {
      return point.x * normal.x + point.y * normal.y;
    }

    function intersection(start, end, boundary, normal) {
      const startProjection = dot(start, normal);
      const projectionDelta = dot(end, normal) - startProjection;
      const amount = Math.abs(projectionDelta) < epsilon
        ? 0
        : (boundary - startProjection) / projectionDelta;

      return {
        x: start.x + (end.x - start.x) * amount,
        y: start.y + (end.y - start.y) * amount
      };
    }

    function clipHalfPlane(polygon, boundary, normal, keepGreater) {
      const result = [];

      if (!polygon.length) {
        return result;
      }

      let start = polygon[polygon.length - 1];
      let startInside = keepGreater
        ? dot(start, normal) >= boundary - epsilon
        : dot(start, normal) <= boundary + epsilon;

      polygon.forEach((end) => {
        const endInside = keepGreater
          ? dot(end, normal) >= boundary - epsilon
          : dot(end, normal) <= boundary + epsilon;

        if (endInside !== startInside) {
          result.push(intersection(start, end, boundary, normal));
        }

        if (endInside) {
          result.push(end);
        }

        start = end;
        startInside = endInside;
      });

      return result;
    }

    function clipBand(region, lower, upper, normal) {
      return clipHalfPlane(
        clipHalfPlane(region, lower, normal, true),
        upper,
        normal,
        false
      );
    }

    function rectangle(left, top, right, bottom) {
      return [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
      ];
    }

    function symmetryLayout(mode) {
      const halfWidth = config.width / 2;
      const halfHeight = config.height / 2;
      const identity = (point) => ({ x: point.x, y: point.y });
      const mirrorX = (point) => ({ x: -point.x, y: point.y });
      const mirrorY = (point) => ({ x: point.x, y: -point.y });
      const rotate180 = (point) => ({ x: -point.x, y: -point.y });

      switch (mode) {
        case "horizontal":
          return {
            region: rectangle(-halfWidth, -halfHeight, 0, halfHeight),
            transforms: [identity, mirrorX]
          };
        case "vertical":
          return {
            region: rectangle(-halfWidth, -halfHeight, halfWidth, 0),
            transforms: [identity, mirrorY]
          };
        case "four-way":
          return {
            region: rectangle(-halfWidth, -halfHeight, 0, 0),
            transforms: [identity, mirrorX, mirrorY, rotate180]
          };
        case "point":
          return {
            region: rectangle(-halfWidth, -halfHeight, 0, halfHeight),
            transforms: [identity, rotate180]
          };
        default:
          return {
            region: rectangle(
              -halfWidth,
              -halfHeight,
              halfWidth,
              halfHeight
            ),
            transforms: [identity]
          };
      }
    }

    function screenCorrectedNormal() {
      const screenAngle = state.geometry.diagonalAngle * Math.PI / 180;
      const modelAngle = Math.atan2(
        Math.sin(screenAngle) * state.frame.width,
        Math.cos(screenAngle) * state.frame.height
      );

      return {
        x: -Math.sin(modelAngle),
        y: Math.cos(modelAngle)
      };
    }

    function animatedWeights(time) {
      return animation.map((settings) => {
        const primaryWave = Math.sin(
          time * settings.rateA + settings.phaseA
        );
        const secondaryWave = Math.sin(
          time * settings.rateB + settings.phaseB
        );

        return Math.max(
          0.16,
          settings.base * (
            1 + config.bandMovement * primaryWave +
            0.11 * secondaryWave
          )
        );
      });
    }

    function number(value) {
      return Math.abs(value) < 0.0005 ? "0" : value.toFixed(3);
    }

    function polygonPath(polygon) {
      if (polygon.length < 3) {
        return "";
      }

      return polygon.map((point, index) => {
        const command = index === 0 ? "M" : "L";

        return `${command} ${number(point.x)} ${number(point.y)}`;
      }).join(" ") + " Z";
    }

    function update(time) {
      const layout = symmetryLayout(state.symmetry);
      const normal = screenCorrectedNormal();
      const projections = layout.region.map((point) => dot(point, normal));
      const minimum = Math.min(...projections);
      const maximum = Math.max(...projections);
      const span = maximum - minimum;
      const sizes = normalize(animatedWeights(time), span);
      const boundaries = [minimum];
      const offset = state.geometry.diagonalOffset / 100 *
        (span / bandCount);

      sizes.forEach((size) => {
        boundaries.push(boundaries[boundaries.length - 1] + size);
      });
      boundaries[boundaries.length - 1] = maximum;

      paths.forEach((path, bandIndex) => {
        const subpaths = [];

        for (let repetition = -2; repetition <= 2; repetition += 1) {
          const lower = boundaries[bandIndex] + offset +
            repetition * span - config.bandOverlap;
          const upper = boundaries[bandIndex + 1] + offset +
            repetition * span + config.bandOverlap;

          if (upper < minimum - epsilon || lower > maximum + epsilon) {
            continue;
          }

          const polygon = clipBand(
            layout.region,
            lower,
            upper,
            normal
          );

          layout.transforms.forEach((transform) => {
            const transformed = polygon.map(transform);
            const pathData = polygonPath(transformed);

            if (pathData) {
              subpaths.push(pathData);
            }
          });
        }

        path.setAttribute("d", subpaths.join(" "));
      });
    }

    return {
      update: update,

      forEachCell(callback) {
        paths.forEach((path, bandIndex) => {
          callback(path, 0, bandIndex);
        });
      },

      getPaletteCoordinates(rowIndex, columnIndex) {
        return {
          rowIndex: rowIndex,
          columnIndex: columnIndex,
          rowArrangementIndex: columnIndex,
          columnArrangementIndex: columnIndex,
          radialPosition: bandCount <= 1
            ? 0
            : columnIndex / (bandCount - 1)
        };
      },

      getDimensions() {
        return {
          rows: 1,
          columns: bandCount
        };
      }
    };
  }

  app.geometryRegistry.register("diagonal", {
    label: "Animated diagonal bands with geometric symmetry",
    presentation: {
      className: "presentation-canvas",
      clipPath: null,
      preserveAspectRatio: "none"
    },
    create: createDiagonalBandGeometry
  });
})(window.CircleApp = window.CircleApp || {});
