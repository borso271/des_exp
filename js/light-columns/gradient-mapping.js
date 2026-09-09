(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const TAU = Math.PI * 2;

  function finite(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function resolveFlow(family, requestedFlow, polarMapping) {
    if (requestedFlow === "along") {
      if (["columns", "moving", "nested", "triangle"].includes(family)) {
        return "vertical";
      }

      if (family === "rings") {
        return "angular";
      }

      if (family === "sectors") {
        return "radial";
      }

      return polarMapping === "radial" || polarMapping === "angular"
        ? polarMapping
        : "combined";
    }

    if (requestedFlow === "across") {
      if (["columns", "moving", "nested", "triangle"].includes(family)) {
        return "horizontal";
      }

      if (family === "rings") {
        return "radial";
      }

      if (family === "sectors") {
        return "angular";
      }

      return "combined";
    }

    return requestedFlow === "radial-angular"
      ? "combined"
      : requestedFlow;
  }

  function hasAngularComponent(flow) {
    return flow === "angular" || flow === "combined";
  }

  function pointOnShape(shape, radius, angle) {
    return {
      x: shape.center.x + Math.cos(angle) * radius,
      y: shape.center.y +
        Math.sin(angle) * radius * finite(shape.ellipseRatio, 1)
    };
  }

  function shapeBounds(shape, width, height) {
    if (["moving", "nested", "triangle"].includes(shape.family)) return shape.bounds;
    if (shape.family === "columns") {
      return {
        left: shape.left,
        right: shape.right,
        top: Math.min(shape.topLeft, shape.topRight, shape.top),
        bottom: shape.bottom
      };
    }

    if (shape.type === "ring") {
      return {
        left: shape.center.x - shape.outerRadius,
        right: shape.center.x + shape.outerRadius,
        top: shape.center.y - shape.outerRadius * shape.ellipseRatio,
        bottom: shape.center.y + shape.outerRadius * shape.ellipseRatio
      };
    }

    const points = [
      pointOnShape(shape, shape.innerRadius, shape.startAngle),
      pointOnShape(shape, shape.outerRadius, shape.startAngle)
    ];
    const steps = Math.max(8, Math.ceil(Math.abs(shape.sweep) / (Math.PI / 18)));

    for (let step = 0; step <= steps; step += 1) {
      const amount = step / steps;
      const angle = shape.startAngle + shape.sweep * amount;

      points.push(pointOnShape(shape, shape.outerRadius, angle));
      points.push(pointOnShape(shape, shape.innerRadius, angle));
    }

    return {
      left: Math.min(...points.map((point) => point.x)),
      right: Math.max(...points.map((point) => point.x)),
      top: Math.min(...points.map((point) => point.y)),
      bottom: Math.max(...points.map((point) => point.y))
    };
  }

  function geometryEnvelope(family, geometrySet, width, height) {
    if (family === "columns") {
      return {
        center: { x: width / 2, y: height / 2 },
        ellipseRatio: 1,
        innerRadius: 0,
        outerRadius: Math.hypot(width, height) / 2
      };
    }

    return geometrySet;
  }

  function localMapping(settings, family) {
    if (family === "columns") {
      return settings.mappingSpace === "shape";
    }

    return settings.continuity !== "continuous" ||
      settings.mappingSpace === "shape";
  }

  function radialDescriptor(shape, envelope, settings) {
    const useLocal = localMapping(settings, shape.family);
    const supportsLocalRadius = shape.family !== "columns";
    const innerRadius = useLocal && supportsLocalRadius
      ? shape.innerRadius
      : envelope.innerRadius;
    const outerRadius = useLocal && supportsLocalRadius
      ? shape.outerRadius
      : envelope.outerRadius;

    return {
      kind: "radial",
      center: ["moving", "nested", "triangle"].includes(shape.family) && useLocal ? shape.center : envelope.center,
      innerRadius: finite(innerRadius, 0),
      outerRadius: Math.max(
        finite(innerRadius, 0) + 0.001,
        finite(outerRadius, 1)
      ),
      normalizedEllipse: !["columns", "moving", "nested", "triangle"].includes(shape.family),
      stopStart: 0,
      stopEnd: 1,
      sourceReverse: false,
      fullCircle: false,
      opacity: 1,
      blendMode: "source-over"
    };
  }

  function angularDescriptor(shape, envelope, settings) {
    const useLocal = localMapping(settings, shape.family);
    const localWedge = useLocal &&
      !["columns", "moving", "nested", "triangle"].includes(shape.family) &&
      shape.type !== "ring";
    const sweep = localWedge ? shape.sweep : TAU;
    const startAngle = localWedge
      ? (sweep < 0 ? shape.startAngle + sweep : shape.startAngle)
      : -Math.PI / 2;

    return {
      kind: "angular",
      center: ["moving", "nested", "triangle"].includes(shape.family) && useLocal ? shape.center : envelope.center,
      startAngle,
      normalizedEllipse: !["columns", "moving", "nested", "triangle"].includes(shape.family),
      stopStart: 0,
      stopEnd: localWedge
        ? Math.max(0.0001, Math.min(1, Math.abs(sweep) / TAU))
        : 1,
      sourceReverse: sweep < 0,
      fullCircle: !localWedge,
      opacity: 1,
      blendMode: "source-over"
    };
  }

  function linearDescriptor(kind, shape, settings, width, height) {
    const useLocal = localMapping(settings, shape.family);
    const bounds = useLocal
      ? shapeBounds(shape, width, height)
      : { left: 0, right: width, top: 0, bottom: height };
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    let start;
    let end;

    if (kind === "horizontal") {
      start = { x: bounds.left, y: centerY };
      end = { x: bounds.right, y: centerY };
    } else if (kind === "diagonal") {
      start = { x: bounds.left, y: bounds.top };
      end = { x: bounds.right, y: bounds.bottom };
    } else {
      start = { x: centerX, y: bounds.top };
      end = { x: centerX, y: bounds.bottom };
    }

    if (
      Math.abs(end.x - start.x) < 0.001 &&
      Math.abs(end.y - start.y) < 0.001
    ) {
      end.y += 1;
    }

    return {
      kind: "linear",
      flow: kind,
      start,
      end,
      normalizedEllipse: false,
      stopStart: 0,
      stopEnd: 1,
      sourceReverse: false,
      fullCircle: false,
      opacity: 1,
      blendMode: "source-over"
    };
  }

  function descriptors(shape, geometrySet, settings, width, height) {
    const flow = resolveFlow(
      shape.family,
      settings.flow,
      settings.polarMapping
    );
    const envelope = geometryEnvelope(
      shape.family,
      geometrySet,
      width,
      height
    );

    if (flow === "radial") {
      return [radialDescriptor(shape, envelope, settings)];
    }

    if (flow === "angular") {
      return [angularDescriptor(shape, envelope, settings)];
    }

    if (flow === "combined") {
      const radial = radialDescriptor(shape, envelope, settings);
      const angular = angularDescriptor(shape, envelope, settings);

      angular.opacity = 0.58;
      angular.blendMode = "screen";
      return [radial, angular];
    }

    return [linearDescriptor(flow, shape, settings, width, height)];
  }

  function assignmentPhase(shape, settings) {
    let phase = 0;

    if (shape.family === "rings") {
      phase += finite(settings.radialOffset, 0);
      phase += finite(shape.variation, 0) *
        finite(settings.ringVariationAmount, 0) * 0.3;
    } else if (shape.family === "sectors") {
      if (settings.sectorVariation === "alternating") {
        phase += shape.sectorIndex % 2 === 0 ? -0.12 : 0.12;
      } else if (settings.sectorVariation === "mirrored") {
        phase += finite(shape.variation, 0) * 0.16;
      } else if (settings.sectorVariation === "random") {
        phase += finite(shape.variation, 0) * 0.2;
      }
    } else if (shape.family === "polar") {
      phase += finite(settings.radialOffset, 0);
      if (settings.polarAssignment === "alternating") {
        phase += shape.ringIndex % 2 === 0 ? 0 : 0.5;
      } else if (settings.polarAssignment === "checkerboard") {
        phase += (shape.ringIndex + shape.sectorIndex) % 2 === 0
          ? 0
          : 0.5;
      }

      if (settings.sectorVariation === "alternating") {
        phase += shape.sectorIndex % 2 === 0 ? -0.12 : 0.12;
      } else if (settings.sectorVariation === "mirrored") {
        phase += finite(shape.variation, 0) * 0.16;
      } else if (settings.sectorVariation === "random") {
        phase += finite(shape.variation, 0) * 0.2;
      }
    }

    return phase;
  }

  function phaseForShape(shape, settings, generatedPhase) {
    let phase = assignmentPhase(shape, settings);

    if (settings.continuity !== "phase") {
      return phase;
    }

    phase += finite(generatedPhase, 0);

    if (shape.family === "rings") {
      phase += shape.index * finite(settings.ringPhase, 0);
    } else if (shape.family === "polar") {
      phase += shape.ringIndex * finite(settings.ringPhase, 0);
    }

    return phase;
  }

  root.gradientMapping = {
    TAU,
    assignmentPhase,
    descriptors,
    hasAngularComponent,
    phaseForShape,
    resolveFlow,
    shapeBounds
  };
})();
