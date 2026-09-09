(function (app) {
  "use strict";

  function createRayFanGeometry(context) {
    const config = context.config;
    const state = context.state;
    const rayCount = state.geometry.rayCount;
    const random = app.utils.random;
    const animation = Array.from({ length: rayCount }, (_, index) => ({
      base: random(0.76, 1.3),
      phaseA: random(0, Math.PI * 2),
      phaseB: random(0, Math.PI * 2),
      rateA: random(0.46, 0.82) + index * 0.021,
      rateB: random(0.2, 0.38) + index * 0.012
    }));
    const paths = Array.from({ length: rayCount }, () => {
      const path = document.createElementNS(
        app.constants.svgNamespace,
        "path"
      );

      context.cellsGroup.appendChild(path);
      return path;
    });
    const originDefinitions = {
      "bottom-center": {
        x: 0,
        y: config.height / 2,
        startAngle: Math.PI,
        endAngle: Math.PI * 2
      },
      "top-center": {
        x: 0,
        y: -config.height / 2,
        startAngle: 0,
        endAngle: Math.PI
      },
      "top-left": {
        x: -config.width / 2,
        y: -config.height / 2,
        startAngle: 0,
        endAngle: Math.PI / 2
      },
      "top-right": {
        x: config.width / 2,
        y: -config.height / 2,
        startAngle: Math.PI / 2,
        endAngle: Math.PI
      },
      "bottom-left": {
        x: -config.width / 2,
        y: config.height / 2,
        startAngle: -Math.PI / 2,
        endAngle: 0
      },
      "bottom-right": {
        x: config.width / 2,
        y: config.height / 2,
        startAngle: Math.PI,
        endAngle: Math.PI * 1.5
      }
    };

    function animatedWeights(time) {
      const amount = state.geometry.rayMotion / 100;
      const speed = state.geometry.raySpeed / 100;
      const weights = animation.map((settings) => {
        const primary = Math.sin(
          time * speed * settings.rateA + settings.phaseA
        );
        const secondary = Math.sin(
          time * speed * settings.rateB + settings.phaseB
        );

        return Math.max(
          0.16,
          settings.base * (
            1 + amount * 0.58 * primary + amount * 0.13 * secondary
          )
        );
      });

      if (state.symmetry === "none") {
        return weights;
      }

      return weights.map((_, index) => {
        return weights[
          app.symmetry.mapPolarIndex(index, rayCount, state.symmetry)
        ];
      });
    }

    function angleBoundaries(origin, time) {
      const sweep = origin.endAngle - origin.startAngle;
      const sizes = app.utils.normalize(animatedWeights(time), sweep);
      const boundaries = [origin.startAngle];

      sizes.forEach((size) => {
        boundaries.push(boundaries[boundaries.length - 1] + size);
      });
      boundaries[boundaries.length - 1] = origin.endAngle;

      return boundaries;
    }

    function modelDirection(screenAngle) {
      const x = Math.cos(screenAngle) * config.width / state.frame.width;
      const y = Math.sin(screenAngle) * config.height / state.frame.height;
      const length = Math.hypot(x, y);

      return {
        x: x / length,
        y: y / length
      };
    }

    function intersection(start, end, axis, boundary) {
      const delta = end[axis] - start[axis];
      const amount = Math.abs(delta) < 0.000001
        ? 0
        : (boundary - start[axis]) / delta;

      return {
        x: start.x + (end.x - start.x) * amount,
        y: start.y + (end.y - start.y) * amount
      };
    }

    function clipBoundary(polygon, axis, boundary, keepGreater) {
      const result = [];

      if (!polygon.length) {
        return result;
      }

      let start = polygon[polygon.length - 1];
      let startInside = keepGreater
        ? start[axis] >= boundary
        : start[axis] <= boundary;

      polygon.forEach((end) => {
        const endInside = keepGreater
          ? end[axis] >= boundary
          : end[axis] <= boundary;

        if (startInside !== endInside) {
          result.push(intersection(start, end, axis, boundary));
        }

        if (endInside) {
          result.push(end);
        }

        start = end;
        startInside = endInside;
      });

      return result;
    }

    function clipToFrame(polygon) {
      const halfWidth = config.width / 2;
      const halfHeight = config.height / 2;

      return clipBoundary(
        clipBoundary(
          clipBoundary(
            clipBoundary(polygon, "x", -halfWidth, true),
            "x",
            halfWidth,
            false
          ),
          "y",
          -halfHeight,
          true
        ),
        "y",
        halfHeight,
        false
      );
    }

    function rayPolygon(origin, startAngle, endAngle) {
      const radius = Math.hypot(config.width, config.height) * 4;
      const startDirection = modelDirection(startAngle);
      const endDirection = modelDirection(endAngle);

      return clipToFrame([
        { x: origin.x, y: origin.y },
        {
          x: origin.x + startDirection.x * radius,
          y: origin.y + startDirection.y * radius
        },
        {
          x: origin.x + endDirection.x * radius,
          y: origin.y + endDirection.y * radius
        }
      ]);
    }

    function number(value) {
      return Math.abs(value) < 0.0005 ? "0" : value.toFixed(3);
    }

    function polygonPath(polygon) {
      return polygon.map((point, index) => {
        const command = index === 0 ? "M" : "L";

        return `${command} ${number(point.x)} ${number(point.y)}`;
      }).join(" ") + " Z";
    }

    function update(time) {
      const origin = originDefinitions[state.geometry.rayOrigin] ||
        originDefinitions["bottom-center"];
      const boundaries = angleBoundaries(origin, time);

      paths.forEach((path, index) => {
        const startAngle = boundaries[index] -
          (index === 0 ? 0 : config.angularOverlap);
        const endAngle = boundaries[index + 1] +
          (index === rayCount - 1 ? 0 : config.angularOverlap);
        const polygon = rayPolygon(origin, startAngle, endAngle);

        path.setAttribute("d", polygonPath(polygon));
      });
    }

    return {
      update: update,

      forEachCell(callback) {
        paths.forEach((path, rayIndex) => {
          callback(path, 0, rayIndex);
        });
      },

      getPaletteCoordinates(rowIndex, columnIndex) {
        const rayIndex = app.symmetry.mapPolarIndex(
          columnIndex,
          rayCount,
          state.symmetry
        );

        return {
          rowIndex: rowIndex,
          columnIndex: rayIndex,
          rowArrangementIndex: rayIndex,
          columnArrangementIndex: rayIndex,
          radialPosition: rayCount <= 1
            ? 0
            : rayIndex / (rayCount - 1)
        };
      },

      getDimensions() {
        return {
          rows: 1,
          columns: rayCount
        };
      }
    };
  }

  app.geometryRegistry.register("rays", {
    label: "Animated rays spreading from an edge or corner of the frame",
    presentation: {
      className: "presentation-canvas",
      clipPath: null,
      preserveAspectRatio: "none"
    },
    create: createRayFanGeometry
  });
})(window.CircleApp = window.CircleApp || {});
