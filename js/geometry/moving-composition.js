(function (app) {
  "use strict";

  // Weighted Voronoi animation adapted from moving_shapes/moving_shapes.html.
  function createMovingComposition(context) {
    const state = context.state;
    const config = context.config;
    const random = app.utils.random;
    const count = state.geometry.movingShapeCount;
    const sites = Array.from({ length: count }, () => ({
      cx: random(0.12, 0.88), cy: random(0.12, 0.88),
      ax: random(0.025, 0.10), ay: random(0.025, 0.10),
      fx: random(0.35, 0.95), fy: random(0.35, 0.95),
      phaseX: random(0, Math.PI * 2), phaseY: random(0, Math.PI * 2),
      phaseX2: random(0, Math.PI * 2), phaseY2: random(0, Math.PI * 2),
      baseWeight: 0.55 + Math.pow(Math.random(), 1.5) * 1.3,
      weightPhase: random(0, Math.PI * 2), weightSpeed: random(0.25, 0.8),
      x: 0, y: 0, weight: 0
    }));
    const paths = sites.map(() => {
      const path = document.createElementNS(app.constants.svgNamespace, "path");
      path.setAttribute("stroke-width", "0.25");
      path.setAttribute("stroke-linejoin", "round");
      context.cellsGroup.appendChild(path);
      return path;
    });
    let motionTime = 0;
    let previousTime = null;

    function clipPolygon(polygon, A, B, C) {
      if (!polygon.length) return polygon;
      const result = [];
      const inside = point => A * point[0] + B * point[1] <= C + 0.00001;
      let previous = polygon[polygon.length - 1];
      let previousInside = inside(previous);
      for (const current of polygon) {
        const currentInside = inside(current);
        if (currentInside !== previousInside) {
          const dx = current[0] - previous[0];
          const dy = current[1] - previous[1];
          const denominator = A * dx + B * dy;
          const t = Math.abs(denominator) < 1e-12
            ? 0 : (C - A * previous[0] - B * previous[1]) / denominator;
          result.push([previous[0] + dx * t, previous[1] + dy * t]);
        }
        if (currentInside) result.push(current);
        previous = current;
        previousInside = currentInside;
      }
      return result;
    }

    function update(time) {
      // Integrate speed changes so dragging the speed slider doesn't jump phases.
      if (previousTime !== null) {
        motionTime += Math.max(0, Math.min(0.05, time - previousTime)) *
          config.speed * state.geometry.movingSpeed / 100;
      }
      previousTime = time;
      // Compute distances in frame units, then map back to the shared viewBox.
      const width = Math.max(1, state.frame.width);
      const height = Math.max(1, state.frame.height);
      const weightScale = Math.max(width, height) ** 2 * config.weightStrength;
      for (const site of sites) {
        const nx = site.cx +
          Math.sin(motionTime * site.fx + site.phaseX) * site.ax +
          Math.sin(motionTime * site.fx * 0.37 + site.phaseX2) * site.ax * 0.38;
        const ny = site.cy +
          Math.cos(motionTime * site.fy + site.phaseY) * site.ay +
          Math.sin(motionTime * site.fy * 0.43 + site.phaseY2) * site.ay * 0.38;
        site.x = Math.max(0, Math.min(1, nx)) * width;
        site.y = Math.max(0, Math.min(1, ny)) * height;
        site.weight = site.baseWeight * weightScale * (1 +
          Math.sin(motionTime * site.weightSpeed + site.weightPhase) *
          state.geometry.movingBreathing / 100);
      }
      sites.forEach((site, index) => {
        let polygon = [[0, 0], [width, 0], [width, height], [0, height]];
        for (let j = 0; j < count && polygon.length; j++) {
          if (index === j) continue;
          const other = sites[j];
          polygon = clipPolygon(polygon,
            2 * (other.x - site.x), 2 * (other.y - site.y),
            other.x ** 2 + other.y ** 2 - site.x ** 2 - site.y ** 2 +
            site.weight - other.weight);
        }
        const d = polygon.length < 3 ? "" : polygon.map((point, i) =>
          `${i === 0 ? "M" : "L"} ${(point[0] / width * 192 - 96).toFixed(3)} ${(point[1] / height * 192 - 96).toFixed(3)}`
        ).join(" ") + " Z";
        paths[index].setAttribute("d", d);
        // Match solid or luminous fills to hide subpixel seams.
        paths[index].style.stroke = paths[index].getAttribute("fill") || "none";
      });
    }

    update(0);
    previousTime = null;
    return {
      update,
      forEachCell(callback) {
        paths.forEach((path, index) => callback(path, 0, index));
      },
      getDimensions() { return { rows: 1, columns: count }; },
      getPaletteCoordinates(rowIndex, columnIndex) {
        const site = sites[columnIndex];
        const dx = site.cx - 0.5;
        const dy = site.cy - 0.5;
        const radius = Math.min(1, Math.hypot(dx, dy) / Math.SQRT1_2);
        const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
        return {
          rowIndex: 0, columnIndex,
          rowArrangementIndex: Math.floor(radius * 8),
          columnArrangementIndex: Math.floor(angle / (Math.PI * 2) * state.palette.colorCount),
          checkerArrangementIndex: Math.floor(site.cx * 8) + Math.floor(site.cy * 8),
          radialPosition: radius
        };
      }
    };
  }

  app.geometryRegistry.register("moving", {
    label: "Moving composition of colored regions filling the frame",
    presentation: {
      className: "presentation-canvas",
      clipPath: null,
      preserveAspectRatio: "none"
    },
    create: createMovingComposition
  });
})(window.CircleApp = window.CircleApp || {});
