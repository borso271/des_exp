(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const clamp = (value, minimum, maximum) => {
    return Math.max(minimum, Math.min(maximum, value));
  };

  function randomAt(seed, index) {
    let value = (Number(seed) || 0) + index * 0x9E3779B1;
    value |= 0;
    value = Math.imul(value ^ value >>> 16, 0x21F0AAAD);
    value = Math.imul(value ^ value >>> 15, 0x735A2D97);

    return ((value ^ value >>> 15) >>> 0) / 4294967296;
  }

  function profile(pattern, index, count, seed) {
    const progress = index / Math.max(1, count - 1);

    switch (pattern) {
      case "flat":
        return 0;
      case "alternating":
        return index % 2 === 0 ? -1 : 1;
      case "wave":
        return Math.sin(progress * Math.PI * 2 - Math.PI / 2);
      case "ascending":
        return progress * 2 - 1;
      case "descending":
        return 1 - progress * 2;
      case "arch":
        return Math.abs(progress * 2 - 1) * 2 - 1;
      case "valley":
        return 1 - Math.abs(progress * 2 - 1) * 2;
      default:
        return randomAt(seed, index) * 2 - 1;
    }
  }

  function describeColumn(index, count, width, height, settings) {
    const cellWidth = width / count;
    const gap = cellWidth * clamp(settings.gap || 0, 0, 0.8);
    const left = index * cellWidth + gap / 2;
    const right = (index + 1) * cellWidth - gap / 2;
    const baseTop = height * (1 - settings.reach);
    const top = clamp(
      baseTop + profile(
        settings.pattern,
        index,
        count,
        settings.seed
      ) * height * settings.heightVariation,
      -height,
      height * 0.94
    );
    const descriptor = {
      index,
      left,
      right,
      bottom: height,
      top,
      topLeft: top,
      topRight: top,
      shape: settings.shape || "straight"
    };

    if (descriptor.shape === "slanted") {
      const slope = Math.min(cellWidth * 0.8, height * 0.12);
      const direction = index % 2 === 0 ? 1 : -1;

      descriptor.topLeft = top + slope * direction * 0.5;
      descriptor.topRight = top - slope * direction * 0.5;
    }

    if (descriptor.shape === "tapered") {
      const inset = Math.max(0, right - left) * 0.2;

      descriptor.topInsetLeft = inset;
      descriptor.topInsetRight = inset;
    }

    return descriptor;
  }

  function trace(context, column) {
    const topLeftX = column.left + (column.topInsetLeft || 0);
    const topRightX = column.right - (column.topInsetRight || 0);

    context.beginPath();

    if (column.shape === "rounded") {
      const radius = Math.min(
        (column.right - column.left) * 0.48,
        Math.max(0, (column.bottom - column.top) * 0.18)
      );

      context.moveTo(column.left, column.bottom);
      context.lineTo(column.left, column.top + radius);
      context.quadraticCurveTo(
        column.left,
        column.top,
        column.left + radius,
        column.top
      );
      context.lineTo(column.right - radius, column.top);
      context.quadraticCurveTo(
        column.right,
        column.top,
        column.right,
        column.top + radius
      );
      context.lineTo(column.right, column.bottom);
    } else {
      context.moveTo(column.left, column.bottom);
      context.lineTo(topLeftX, column.topLeft);
      context.lineTo(topRightX, column.topRight);
      context.lineTo(column.right, column.bottom);
    }

    context.closePath();
  }

  root.geometry = {
    describeColumn,
    profile,
    randomAt,
    trace
  };
})();
