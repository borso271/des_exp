(() => {
  "use strict";
  const root = window.LightColumns = window.LightColumns || {};

  function vertices(width, height, settings) {
    const radius = Math.min(width, height) * settings.size / 2;
    const cx = width * settings.x;
    const cy = height * settings.y;
    return Array.from({ length: 3 }, (_, index) => {
      const angle = (settings.angle + index * 120) * Math.PI / 180;
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    });
  }

  function draw(context, width, height, settings) {
    context.fillStyle = settings.background;
    context.fillRect(0, 0, width, height);
    const points = vertices(width, height, settings);
    context.fillStyle = settings.color;
    context.beginPath();
    context.moveTo(...points[0]);
    points.slice(1).forEach(point => context.lineTo(...point));
    context.closePath();
    context.fill();
  }

  function build(settings, width, height) {
    const points = vertices(width, height, settings);
    const center = { x: width * settings.x, y: height * settings.y };
    const shape = {
      family: "triangle", type: "polygon", index: 0, count: 1, points, center,
      bounds: { left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])),
        top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1])) },
      ellipseRatio: 1, innerRadius: 0, outerRadius: Math.min(width, height) * settings.size / 2
    };
    return { family: "triangle", shapes: [shape], center, ellipseRatio: 1,
      innerRadius: 0, outerRadius: shape.outerRadius };
  }

  function trace(context, shape) {
    context.beginPath();
    context.moveTo(...shape.points[0]);
    shape.points.slice(1).forEach(point => context.lineTo(...point));
    context.closePath();
  }

  root.triangleGeometry = { build, trace };
  root.triangleBackground = { vertices, draw };
})();
