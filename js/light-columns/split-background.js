(() => {
  "use strict";
  const root = window.LightColumns = window.LightColumns || {};

  function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  function angleDelta(from, to) {
    return normalizeAngle(to - from + 180) - 180;
  }

  function polygon(width, height, angle, offset) {
    const radians = angle * Math.PI / 180;
    const nx = -Math.sin(radians);
    const ny = Math.cos(radians);
    const reach = (Math.abs(nx) * width + Math.abs(ny) * height) / 2;
    const distance = Math.max(-0.95, Math.min(0.95, offset)) * reach;
    const corners = [[0, 0], [width, 0], [width, height], [0, height]];
    const signed = ([x, y]) => nx * (x - width / 2) + ny * (y - height / 2) - distance;
    const points = [];
    corners.forEach((a, index) => {
      const b = corners[(index + 1) % corners.length];
      const da = signed(a);
      const db = signed(b);
      if (da >= 0) points.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        points.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    });
    return points;
  }

  function draw(context, width, height, settings) {
    context.fillStyle = settings.colorA;
    context.fillRect(0, 0, width, height);
    const points = polygon(width, height, settings.angle, settings.offset);
    if (!points.length) return;
    context.fillStyle = settings.colorB;
    context.beginPath();
    context.moveTo(...points[0]);
    points.slice(1).forEach(point => context.lineTo(...point));
    context.closePath();
    context.fill();
  }

  root.splitBackground = { normalizeAngle, angleDelta, polygon, draw };
})();
