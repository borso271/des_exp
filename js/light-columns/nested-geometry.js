(() => {
  "use strict";
  const root = window.LightColumns = window.LightColumns || {};
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

  function build(settings, width, height) {
    const count = clamp(Math.round(finite(settings.count, 4)), 2, 8);
    const scale = clamp(finite(settings.scale, 0.9), 0.3, 1);
    const ratio = clamp(finite(settings.ratio, 0.75), 0.2, 0.95);
    const change = clamp(finite(settings.ratioChange, 0), -0.25, 0.25);
    const offsetX = clamp(finite(settings.offsetX, 0), -0.9, 0.9);
    const offsetY = clamp(finite(settings.offsetY, 0.4), -0.9, 0.9);
    const baseWidth = (settings.shape === "rectangle" ? width : Math.min(width, height)) * scale;
    const baseHeight = (settings.shape === "rectangle" ? height : Math.min(width, height)) * scale;
    const rectangles = [{ left: (width - baseWidth) / 2, top: (height - baseHeight) / 2,
      right: (width + baseWidth) / 2, bottom: (height + baseHeight) / 2 }];
    for (let index = 1; index < count; index++) {
      const parent = rectangles[index - 1];
      const nextRatio = clamp(ratio + (index - 1) * change, 0.2, 0.95);
      const childWidth = (parent.right - parent.left) * nextRatio;
      const childHeight = (parent.bottom - parent.top) * nextRatio;
      // Offset is a share of the available inset, so every child stays inside its parent.
      const left = parent.left + (parent.right - parent.left - childWidth) * (1 + offsetX) / 2;
      const top = parent.top + (parent.bottom - parent.top - childHeight) * (1 + offsetY) / 2;
      rectangles.push({ left, top, right: left + childWidth, bottom: top + childHeight, ratio: nextRatio });
    }
    const shapes = rectangles.map((bounds, index) => ({
      family: "nested", type: "rectangle", index, count, bounds,
      innerBounds: rectangles[index + 1] || null,
      center: { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 },
      ellipseRatio: 1, innerRadius: 0,
      outerRadius: Math.hypot(bounds.right - bounds.left, bounds.bottom - bounds.top) / 2
    }));
    return { family: "nested", shapes, center: { x: width / 2, y: height / 2 },
      ellipseRatio: 1, innerRadius: 0, outerRadius: Math.hypot(width, height) / 2 };
  }

  function trace(context, shape) {
    const outer = shape.bounds;
    context.beginPath();
    context.moveTo(outer.left, outer.top);
    context.lineTo(outer.right, outer.top);
    context.lineTo(outer.right, outer.bottom);
    context.lineTo(outer.left, outer.bottom);
    context.closePath();
    // Reverse winding cuts a hole, keeping opacity and blending independent per region.
    const inner = shape.innerBounds;
    if (inner) {
      context.moveTo(inner.left, inner.top);
      context.lineTo(inner.left, inner.bottom);
      context.lineTo(inner.right, inner.bottom);
      context.lineTo(inner.right, inner.top);
      context.closePath();
    }
  }
  root.nestedGeometry = { build, trace };
})();
