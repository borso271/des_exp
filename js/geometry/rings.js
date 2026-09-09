(function (app) {
  "use strict";

  function createPolarGeometry(context, cellPathBuilder) {
    const config = { ...context.config,
      ringCount: context.state.geometry.ringCount,
      sectorCount: context.state.geometry.sectorCount };
    const state = context.state;
    const cellsGroup = context.cellsGroup;
    const random = app.utils.random;
    const normalize = app.utils.normalize;

    function polarPoint(radius, angle) {
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    }

    function number(value) {
      return value.toFixed(3);
    }

    function annularSectorPath(
      innerRadius,
      outerRadius,
      startAngle,
      endAngle
    ) {
      if (endAngle - startAngle >= Math.PI * 2 - 0.000001) {
        function circle(radius, clockwise) {
          const start = polarPoint(radius, startAngle);
          const opposite = polarPoint(radius, startAngle + Math.PI);
          return `M ${number(start.x)} ${number(start.y)} ` +
            `A ${number(radius)} ${number(radius)} 0 1 ${clockwise} ${number(opposite.x)} ${number(opposite.y)} ` +
            `A ${number(radius)} ${number(radius)} 0 1 ${clockwise} ${number(start.x)} ${number(start.y)} Z`;
        }
        return circle(outerRadius, 1) + (innerRadius > 0.001 ? " " + circle(innerRadius, 0) : "");
      }
      const outerStart = polarPoint(outerRadius, startAngle);
      const outerEnd = polarPoint(outerRadius, endAngle);
      const angularSize = endAngle - startAngle;
      const largeArc = angularSize > Math.PI ? 1 : 0;

      if (innerRadius <= 0.001) {
        return [
          "M 0 0",
          `L ${number(outerStart.x)} ${number(outerStart.y)}`,
          `A ${number(outerRadius)} ${number(outerRadius)} 0 ${largeArc} 1`,
          `${number(outerEnd.x)} ${number(outerEnd.y)}`,
          "Z"
        ].join(" ");
      }

      const innerStart = polarPoint(innerRadius, startAngle);
      const innerEnd = polarPoint(innerRadius, endAngle);

      return [
        `M ${number(outerStart.x)} ${number(outerStart.y)}`,
        `A ${number(outerRadius)} ${number(outerRadius)} 0 ${largeArc} 1`,
        `${number(outerEnd.x)} ${number(outerEnd.y)}`,
        `L ${number(innerEnd.x)} ${number(innerEnd.y)}`,
        `A ${number(innerRadius)} ${number(innerRadius)} 0 ${largeArc} 0`,
        `${number(innerStart.x)} ${number(innerStart.y)}`,
        "Z"
      ].join(" ");
    }

    const buildCellPath = cellPathBuilder || annularSectorPath;

    const ringAnimation = Array.from(
      { length: config.ringCount },
      (_, index) => ({
        base: random(0.72, 1.35),
        phaseA: random(0, Math.PI * 2),
        phaseB: random(0, Math.PI * 2),
        rateA: random(0.38, 0.72) + index * 0.014,
        rateB: random(0.18, 0.34) + index * 0.009
      })
    );

    const sectorAnimation = Array.from(
      { length: config.sectorCount },
      (_, index) => ({
        base: random(0.78, 1.28),
        phaseA: random(0, Math.PI * 2),
        phaseB: random(0, Math.PI * 2),
        rateA: random(0.38, 0.76) + index * 0.05,
        rateB: random(0.17, 0.31) + index * 0.03
      })
    );

    const paths = Array.from(
      { length: config.ringCount },
      () => Array.from({ length: config.sectorCount }, () => {
        const path = document.createElementNS(
          app.constants.svgNamespace,
          "path"
        );

        path.setAttribute("fill-rule", "evenodd");
        cellsGroup.appendChild(path);
        return path;
      })
    );

    function calculateRingRadii(time) {
      const weights = ringAnimation.map((settings) => {
        const primaryWave = Math.sin(
          time * settings.rateA + settings.phaseA
        );
        const secondaryWave = Math.sin(
          time * settings.rateB + settings.phaseB
        );

        return Math.max(
          0.16,
          settings.base * (
            1 +
            config.ringMovement * primaryWave +
            0.11 * secondaryWave
          )
        );
      });
      const thicknesses = normalize(weights, config.radius);
      const radii = [0];
      let accumulatedRadius = 0;

      for (const thickness of thicknesses) {
        accumulatedRadius += thickness;
        radii.push(accumulatedRadius);
      }

      return radii;
    }

    function calculateSectorWidths(time) {
      const weights = sectorAnimation.map((settings) => {
        const primaryWave = Math.sin(
          time * settings.rateA + settings.phaseA
        );
        const secondaryWave = Math.sin(
          time * settings.rateB + settings.phaseB
        );

        return Math.max(
          0.16,
          settings.base * (
            1 +
            config.sectorMovement * primaryWave +
            0.12 * secondaryWave
          )
        );
      });

      const symmetricWeights = weights.map((_, sectorIndex) => {
        const sourceIndex = app.symmetry.mapPolarIndex(
          sectorIndex,
          config.sectorCount,
          state.symmetry
        );

        return weights[sourceIndex];
      });

      return normalize(symmetricWeights, Math.PI * 2);
    }

    function update(time) {
      const ringRadii = calculateRingRadii(time);
      const sectorWidths = calculateSectorWidths(time);
      const angles = [-Math.PI / 2];

      for (const width of sectorWidths) {
        angles.push(angles[angles.length - 1] + width);
      }

      for (let ring = 0; ring < config.ringCount; ring += 1) {
        const innerRadius = Math.max(
          0,
          ringRadii[ring] - config.radialOverlap
        );
        const outerRadius =
          ringRadii[ring + 1] + config.radialOverlap;

        for (let sector = 0; sector < config.sectorCount; sector += 1) {
          const startAngle = angles[sector] - (config.sectorCount === 1 ? 0 : config.angularOverlap);
          const endAngle = angles[sector + 1] + (config.sectorCount === 1 ? 0 : config.angularOverlap);

          paths[ring][sector].setAttribute(
            "d",
            buildCellPath(
              innerRadius,
              outerRadius,
              startAngle,
              endAngle,
              context
            )
          );
        }
      }
    }

    return {
      update: update,

      forEachCell(callback) {
        paths.forEach((ringPaths, ringIndex) => {
          ringPaths.forEach((path, sectorIndex) => {
            callback(path, ringIndex, sectorIndex);
          });
        });
      },

      getPaletteCoordinates(ringIndex, sectorIndex) {
        return {
          rowIndex: ringIndex,
          columnIndex: app.symmetry.mapPolarIndex(
            sectorIndex,
            config.sectorCount,
            state.symmetry
          ),
          radialPosition:
            ringIndex / Math.max(1, config.ringCount - 1)
        };
      },

      getDimensions() {
        return {
          rows: config.ringCount,
          columns: config.sectorCount
        };
      }
    };
  }

  app.geometryHelpers = {
    createPolarGeometry: createPolarGeometry
  };

  app.geometryRegistry.register("rings", {
    label: "Animated circle made from symmetric colored rings and sectors",
    presentation: {
      className: "presentation-polar",
      clipPath: "url(#disc-clip)",
      preserveAspectRatio: "xMidYMid slice"
    },
    create(context) {
      return createPolarGeometry(context);
    }
  });
})(window.CircleApp = window.CircleApp || {});
