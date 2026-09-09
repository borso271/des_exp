(function (app) {
  "use strict";

  const BOUNDARY_SAMPLES_PER_TURN = 160;

  function number(value) {
    return value.toFixed(3);
  }

  function pointCommand(point) {
    return `${number(point.x)} ${number(point.y)}`;
  }

  function superellipseBoundaryPoint(
    size,
    angle,
    exponent,
    rotation
  ) {
    const localAngle = angle - rotation;
    const cosine = Math.abs(Math.cos(localAngle));
    const sine = Math.abs(Math.sin(localAngle));
    const denominator = Math.pow(
      Math.pow(cosine, exponent) + Math.pow(sine, exponent),
      1 / exponent
    );
    const distance = size / denominator;

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  function sampleBoundary(
    size,
    startAngle,
    endAngle,
    exponent,
    rotation
  ) {
    const angularSpan = endAngle - startAngle;
    const segmentCount = Math.max(
      2,
      Math.ceil(
        angularSpan /
        (Math.PI * 2) *
        BOUNDARY_SAMPLES_PER_TURN
      )
    );

    return Array.from({ length: segmentCount + 1 }, (_, index) => {
      const progress = index / segmentCount;
      const angle = startAngle + angularSpan * progress;

      return superellipseBoundaryPoint(
        size,
        angle,
        exponent,
        rotation
      );
    });
  }

  function superellipseSectorPath(
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    context
  ) {
    const exponent = context.state.geometry.superellipseRoundness;
    const rotation =
      context.state.geometry.shapeRotation * Math.PI / 180;
    const outerPoints = sampleBoundary(
      outerRadius,
      startAngle,
      endAngle,
      exponent,
      rotation
    );

    if (endAngle - startAngle >= Math.PI * 2 - 0.000001) {
      const contour = points => points.map((point, index) =>
        `${index === 0 ? "M" : "L"} ${pointCommand(point)}`).join(" ") + " Z";
      return contour(outerPoints) + (innerRadius > 0.001
        ? " " + contour(sampleBoundary(innerRadius, startAngle, endAngle, exponent, rotation)) : "");
    }

    if (innerRadius <= 0.001) {
      return [
        "M 0 0",
        ...outerPoints.map((point) => `L ${pointCommand(point)}`),
        "Z"
      ].join(" ");
    }

    const innerPoints = sampleBoundary(
      innerRadius,
      startAngle,
      endAngle,
      exponent,
      rotation
    ).reverse();

    return [
      ...outerPoints.map((point, index) => {
        return `${index === 0 ? "M" : "L"} ${pointCommand(point)}`;
      }),
      ...innerPoints.map((point) => `L ${pointCommand(point)}`),
      "Z"
    ].join(" ");
  }

  app.geometryRegistry.register("superellipse", {
    label: "Animated superellipse made from symmetric colored rings and sectors",
    presentation: {
      className: "presentation-polar",
      clipPath: "url(#disc-clip)",
      preserveAspectRatio: "xMidYMid slice"
    },
    create(context) {
      return app.geometryHelpers.createPolarGeometry(
        context,
        superellipseSectorPath
      );
    }
  });
})(window.CircleApp = window.CircleApp || {});
