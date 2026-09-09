(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const TAU = Math.PI * 2;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finite(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function centerPoint(settings, width, height) {
    return {
      x: finite(settings.centerX, 0.5) * width,
      y: finite(settings.centerY, 0.5) * height
    };
  }

  function effectiveDistance(point, center, ellipseRatio) {
    const ratio = Math.max(0.1, finite(ellipseRatio, 1));
    const deltaX = point.x - center.x;
    const deltaY = (point.y - center.y) / ratio;

    return Math.hypot(deltaX, deltaY);
  }

  function coverageRadius(center, width, height, ellipseRatio) {
    const corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];

    return Math.max(...corners.map((corner) => {
      return effectiveDistance(corner, center, ellipseRatio);
    })) + 2;
  }

  function variationValue(mode, index, count, seed) {
    const progress = index / Math.max(1, count - 1);

    switch (mode) {
      case "alternating":
        return index % 2 === 0 ? -1 : 1;
      case "wave":
        return Math.sin(progress * Math.PI * 2 - Math.PI / 2);
      case "mirrored":
        return 1 - Math.abs(progress * 2 - 1) * 2;
      case "random":
        return root.geometry.randomAt(seed, index) * 2 - 1;
      default:
        return 0;
    }
  }

  function ringBands(settings, width, height) {
    const count = Math.max(1, Math.round(settings.ringCount));
    const center = centerPoint(settings, width, height);
    const ellipseRatio = clamp(settings.ellipseRatio, 0.25, 2.5);
    const minimumDimension = Math.min(width, height);
    const innerRadius = clamp(
      settings.innerRadius * minimumDimension,
      0,
      minimumDimension * 1.5
    );
    const outerRadius = Math.max(
      innerRadius + 1,
      coverageRadius(center, width, height, ellipseRatio)
    );
    const pitch = (outerRadius - innerRadius) / count;
    const thicknessScale = clamp(settings.ringThickness, 0.05, 2);
    const gap = Math.max(0, settings.ringGap);
    const bands = [];

    for (let index = 0; index < count; index += 1) {
      const cellCenter = innerRadius + (index + 0.5) * pitch;
      const variation = variationValue(
        settings.ringVariation,
        index,
        count,
        settings.seed
      );
      const variedThicknessScale = thicknessScale * (
        1 + variation * settings.ringVariationAmount * 0.65
      );
      const thickness = Math.max(
        0.5,
        pitch * variedThicknessScale - gap
      );

      bands.push({
        family: "rings",
        type: "ring",
        index,
        count,
        center,
        ellipseRatio,
        innerRadius: Math.max(0, cellCenter - thickness / 2),
        outerRadius: cellCenter + thickness / 2,
        coverageRadius: outerRadius,
        radialPosition: (index + 0.5) / count,
        angularPosition: 0,
        variation
      });
    }

    return {
      family: "rings",
      center,
      ellipseRatio,
      innerRadius,
      outerRadius,
      shapes: bands
    };
  }

  function sectorDescriptor(settings, width, height, index, radii) {
    const count = Math.max(1, Math.round(settings.sectorCount));
    const center = radii.center || centerPoint(settings, width, height);
    const ellipseRatio = radii.ellipseRatio ||
      clamp(settings.ellipseRatio, 0.25, 2.5);
    const outerRadius = radii.outerRadius ||
      coverageRadius(center, width, height, ellipseRatio);
    const innerRadius = Math.max(0, radii.innerRadius || 0);
    const direction = settings.sectorDirection === "counterclockwise"
      ? -1
      : 1;
    const baseSweep = TAU / count;
    const maximumGap = baseSweep * 0.88;
    const gap = Math.min(
      maximumGap,
      Math.max(0, settings.angularGap * Math.PI / 180)
    );
    const usableSweep = Math.max(0.0001, baseSweep - gap);
    const variation = variationValue(
      settings.sectorVariation,
      index,
      count,
      settings.seed + 4099
    );
    const rotation = settings.rotation * Math.PI / 180;
    const startAngle = rotation + direction * index * baseSweep;
    const spiralTwist = settings.sectorVariation === "spiral"
      ? direction * baseSweep * 0.9
      : 0;
    const mirroredIndex = Math.min(index, count - 1 - index);

    return {
      family: radii.family || "sectors",
      type: radii.type || "sector",
      index,
      count,
      center,
      ellipseRatio,
      innerRadius,
      outerRadius,
      coverageRadius: outerRadius,
      startAngle,
      sweep: direction * usableSweep,
      spiralTwist,
      radialPosition: radii.radialPosition == null
        ? 0.5
        : radii.radialPosition,
      angularPosition: settings.mirrorSymmetry
        ? (mirroredIndex + 0.5) / Math.max(1, Math.ceil(count / 2))
        : (index + 0.5) / count,
      ringIndex: radii.ringIndex,
      sectorIndex: index,
      variation
    };
  }

  function sectors(settings, width, height) {
    const count = Math.max(1, Math.round(settings.sectorCount));
    const center = centerPoint(settings, width, height);
    const ellipseRatio = clamp(settings.ellipseRatio, 0.25, 2.5);
    const minimumDimension = Math.min(width, height);
    const innerRadius = clamp(
      settings.innerOpening * minimumDimension,
      0,
      minimumDimension * 1.5
    );
    const outerRadius = coverageRadius(
      center,
      width,
      height,
      ellipseRatio
    );
    const shapes = [];

    for (let index = 0; index < count; index += 1) {
      shapes.push(sectorDescriptor(settings, width, height, index, {
        center,
        ellipseRatio,
        innerRadius,
        outerRadius,
        family: "sectors",
        type: "sector"
      }));
    }

    return {
      family: "sectors",
      center,
      ellipseRatio,
      innerRadius,
      outerRadius,
      shapes
    };
  }

  function polarGrid(settings, width, height) {
    const ringSet = ringBands(settings, width, height);
    const sectorCount = Math.max(1, Math.round(settings.sectorCount));
    const shapes = [];

    ringSet.shapes.forEach((ring, ringIndex) => {
      for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
        const cell = sectorDescriptor(
          settings,
          width,
          height,
          sectorIndex,
          {
            center: ring.center,
            ellipseRatio: ring.ellipseRatio,
            innerRadius: ring.innerRadius,
            outerRadius: ring.outerRadius,
            radialPosition: ring.radialPosition,
            ringIndex,
            family: "polar",
            type: "polar-cell"
          }
        );

        cell.index = ringIndex * sectorCount + sectorIndex;
        cell.count = ringSet.shapes.length * sectorCount;
        cell.ringCount = ringSet.shapes.length;
        cell.sectorCount = sectorCount;
        cell.ringVariation = ring.variation;
        shapes.push(cell);
      }
    });

    return {
      family: "polar",
      center: ringSet.center,
      ellipseRatio: ringSet.ellipseRatio,
      innerRadius: ringSet.innerRadius,
      outerRadius: ringSet.outerRadius,
      shapes
    };
  }

  function build(family, settings, width, height) {
    if (family === "rings") {
      return ringBands(settings, width, height);
    }

    if (family === "sectors") {
      return sectors(settings, width, height);
    }

    if (family === "polar") {
      return polarGrid(settings, width, height);
    }

    throw new Error(`Unsupported radial geometry family: ${family}`);
  }

  function pointOnEllipse(shape, radius, angle) {
    return {
      x: shape.center.x + Math.cos(angle) * radius,
      y: shape.center.y + Math.sin(angle) * radius * shape.ellipseRatio
    };
  }

  function traceRing(context, shape) {
    context.beginPath();
    context.ellipse(
      shape.center.x,
      shape.center.y,
      shape.outerRadius,
      shape.outerRadius * shape.ellipseRatio,
      0,
      0,
      TAU,
      false
    );

    if (shape.innerRadius > 0.001) {
      context.ellipse(
        shape.center.x,
        shape.center.y,
        shape.innerRadius,
        shape.innerRadius * shape.ellipseRatio,
        0,
        0,
        TAU,
        true
      );
    }

    context.closePath();
  }

  function traceSector(context, shape) {
    const arcSteps = Math.max(
      4,
      Math.ceil(Math.abs(shape.sweep) / (Math.PI / 90))
    );
    const radialSteps = shape.spiralTwist === 0 ? 1 : 8;
    let point = pointOnEllipse(shape, shape.outerRadius, shape.startAngle);

    context.beginPath();
    context.moveTo(point.x, point.y);

    for (let step = 1; step <= arcSteps; step += 1) {
      const amount = step / arcSteps;
      const angle = shape.startAngle + shape.sweep * amount;

      point = pointOnEllipse(shape, shape.outerRadius, angle);
      context.lineTo(point.x, point.y);
    }

    for (let step = 1; step <= radialSteps; step += 1) {
      const amount = step / radialSteps;
      const radius = shape.outerRadius +
        (shape.innerRadius - shape.outerRadius) * amount;
      const radialProgress = 1 - radius / Math.max(1, shape.outerRadius);
      const angle = shape.startAngle + shape.sweep +
        shape.spiralTwist * radialProgress;

      point = pointOnEllipse(shape, radius, angle);
      context.lineTo(point.x, point.y);
    }

    for (let step = 1; step <= arcSteps; step += 1) {
      const amount = step / arcSteps;
      const radialProgress = 1 -
        shape.innerRadius / Math.max(1, shape.outerRadius);
      const angle = shape.startAngle + shape.sweep * (1 - amount) +
        shape.spiralTwist * radialProgress;

      point = pointOnEllipse(shape, shape.innerRadius, angle);
      context.lineTo(point.x, point.y);
    }

    for (let step = 1; step <= radialSteps; step += 1) {
      const amount = step / radialSteps;
      const radius = shape.innerRadius +
        (shape.outerRadius - shape.innerRadius) * amount;
      const radialProgress = 1 - radius / Math.max(1, shape.outerRadius);
      const angle = shape.startAngle + shape.spiralTwist * radialProgress;

      point = pointOnEllipse(shape, radius, angle);
      context.lineTo(point.x, point.y);
    }

    context.closePath();
  }

  function trace(context, shape) {
    if (shape.type === "ring") {
      traceRing(context, shape);
    } else {
      traceSector(context, shape);
    }
  }

  function palettePosition(shape, settings) {
    let position;

    if (shape.family === "rings") {
      position = shape.radialPosition + settings.radialOffset +
        shape.index * settings.ringPhase;
    } else if (shape.family === "sectors") {
      position = shape.angularPosition;
    } else {
      switch (settings.polarMapping) {
        case "radial":
          position = shape.radialPosition;
          break;
        case "angular":
          position = shape.angularPosition;
          break;
        default:
          position = (shape.radialPosition + shape.angularPosition) / 2;
      }

      if (settings.polarAssignment === "alternating") {
        position += shape.ringIndex % 2 === 0 ? 0 : 0.5;
      } else if (settings.polarAssignment === "checkerboard") {
        position += (shape.ringIndex + shape.sectorIndex) % 2 === 0
          ? 0
          : 0.5;
      }

      position += settings.radialOffset;
      position += shape.ringIndex * settings.ringPhase;
    }

    if (
      shape.family !== "rings" &&
      settings.sectorVariation === "alternating"
    ) {
      position += shape.sectorIndex % 2 === 0 ? -0.12 : 0.12;
    } else if (
      shape.family !== "rings" &&
      settings.sectorVariation === "mirrored"
    ) {
      position += shape.variation * 0.16;
    } else if (
      shape.family !== "rings" &&
      settings.sectorVariation === "random"
    ) {
      position += shape.variation * 0.2;
    }

    return position;
  }

  function coversCorners(geometrySet, width, height) {
    const corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];

    return corners.every((corner) => {
      return effectiveDistance(
        corner,
        geometrySet.center,
        geometrySet.ellipseRatio
      ) <= geometrySet.outerRadius + 0.0001;
    });
  }

  root.radialGeometry = {
    build,
    centerPoint,
    coverageRadius,
    coversCorners,
    effectiveDistance,
    palettePosition,
    trace,
    variationValue
  };
})();
