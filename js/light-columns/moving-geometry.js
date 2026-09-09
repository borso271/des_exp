(() => {
  "use strict";
  const root = window.LightColumns = window.LightColumns || {};
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  // The power-cell motion from moving_shapes, with a seed for settings replay.
  function clip(polygon, A, B, C) {
    if (!polygon.length) return polygon;
    const result = [];
    const inside = p => A * p.x + B * p.y <= C + 0.00001;
    let previous = polygon[polygon.length - 1];
    let previousInside = inside(previous);
    for (const current of polygon) {
      const currentInside = inside(current);
      if (previousInside !== currentInside) {
        const dx = current.x - previous.x;
        const dy = current.y - previous.y;
        const denominator = A * dx + B * dy;
        const t = Math.abs(denominator) < 1e-12 ? 0 :
          (C - A * previous.x - B * previous.y) / denominator;
        result.push({ x: previous.x + dx * t, y: previous.y + dy * t });
      }
      if (currentInside) result.push(current);
      previous = current;
      previousInside = currentInside;
    }
    return result;
  }

  function build(settings, width, height) {
    const count = clamp(Math.round(settings.count || 18), 2, 60);
    const time = (Number(settings.time) || 0) * 0.23;
    const breathing = clamp(settings.breathing ?? 0.65, 0, 1);
    const scale = Math.max(width, height) ** 2 * 0.025;
    const sites = Array.from({ length: count }, (_, index) => {
      const r = n => root.geometry.randomAt(settings.seed, index * 16 + n);
      const cx = 0.12 + r(0) * 0.76;
      const cy = 0.12 + r(1) * 0.76;
      const ax = 0.025 + r(2) * 0.075;
      const ay = 0.025 + r(3) * 0.075;
      const fx = 0.35 + r(4) * 0.6;
      const fy = 0.35 + r(5) * 0.6;
      const phase = n => r(n) * Math.PI * 2;
      return {
        x: clamp(cx + Math.sin(time * fx + phase(6)) * ax +
          Math.sin(time * fx * 0.37 + phase(8)) * ax * 0.38, 0, 1) * width,
        y: clamp(cy + Math.cos(time * fy + phase(7)) * ay +
          Math.sin(time * fy * 0.43 + phase(9)) * ay * 0.38, 0, 1) * height,
        weight: (0.55 + r(10) ** 1.5 * 1.3) * scale *
          (1 + Math.sin(time * (0.25 + r(12) * 0.55) + phase(11)) * breathing)
      };
    });
    const shapes = sites.map((site, index) => {
      let points = [{ x: 0, y: 0 }, { x: width, y: 0 },
        { x: width, y: height }, { x: 0, y: height }];
      for (let j = 0; j < count && points.length; j++) {
        if (j === index) continue;
        const other = sites[j];
        points = clip(points, 2 * (other.x - site.x), 2 * (other.y - site.y),
          other.x ** 2 + other.y ** 2 - site.x ** 2 - site.y ** 2 +
          site.weight - other.weight);
      }
      const bounds = points.length ? {
        left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
        top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y))
      } : { left: site.x, right: site.x, top: site.y, bottom: site.y };
      return { family: "moving", type: "polygon", index, count, points, bounds,
        center: { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 },
        ellipseRatio: 1, innerRadius: 0,
        outerRadius: Math.max(1, Math.hypot(bounds.right - bounds.left, bounds.bottom - bounds.top) / 2) };
    });
    return { family: "moving", shapes, center: { x: width / 2, y: height / 2 },
      ellipseRatio: 1, innerRadius: 0, outerRadius: Math.hypot(width, height) / 2 };
  }

  function trace(context, shape) {
    context.beginPath();
    shape.points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
  }
  root.movingGeometry = { build, trace };
})();
