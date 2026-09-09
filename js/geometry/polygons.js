(function (app) {
  "use strict";

  function number(value) {
    return value.toFixed(3);
  }

  function pointAt(radius, angle) {
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }

  function pointCommand(point) {
    return `${number(point.x)} ${number(point.y)}`;
  }

  function polygonBoundaryPoint(apothem, angle, sides, vertexAngle) {
    const step = (Math.PI * 2) / sides;
    const firstNormal = vertexAngle + step / 2;
    const nearestNormal = firstNormal +
      Math.round((angle - firstNormal) / step) * step;
    const distance = apothem / Math.cos(angle - nearestNormal);

    return pointAt(distance, angle);
  }

  function polygonBoundaryPoints(
    apothem,
    startAngle,
    endAngle,
    sides,
    vertexAngle
  ) {
    const step = (Math.PI * 2) / sides;
    const circumradius = apothem / Math.cos(Math.PI / sides);
    const points = [
      polygonBoundaryPoint(
        apothem,
        startAngle,
        sides,
        vertexAngle
      )
    ];
    let vertexIndex =
      Math.floor((startAngle - vertexAngle) / step) + 1;
    let angle = vertexAngle + vertexIndex * step;

    while (angle < endAngle) {
      points.push(pointAt(circumradius, angle));
      vertexIndex += 1;
      angle = vertexAngle + vertexIndex * step;
    }

    points.push(
      polygonBoundaryPoint(apothem, endAngle, sides, vertexAngle)
    );

    return points;
  }

  function polygonSectorPath(
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    context
  ) {
    const sides = context.state.geometry.polygonSides;
    const rotation =
      context.state.geometry.shapeRotation * Math.PI / 180;
    const vertexAngle = -Math.PI / 2 + rotation;
    const outerPoints = polygonBoundaryPoints(
      outerRadius,
      startAngle,
      endAngle,
      sides,
      vertexAngle
    );
    const outerCommands = outerPoints.map((point, index) => {
      return `${index === 0 ? "M" : "L"} ${pointCommand(point)}`;
    });

    if (endAngle - startAngle >= Math.PI * 2 - 0.000001) {
      const outer = [...outerCommands, "Z"].join(" ");
      if (innerRadius <= 0.001) return outer;
      const inner = polygonBoundaryPoints(innerRadius, startAngle, endAngle, sides, vertexAngle);
      return outer + " " + inner.map((point, index) =>
        `${index === 0 ? "M" : "L"} ${pointCommand(point)}`).join(" ") + " Z";
    }

    if (innerRadius <= 0.001) {
      return [
        "M 0 0",
        ...outerPoints.map((point) => `L ${pointCommand(point)}`),
        "Z"
      ].join(" ");
    }

    const innerPoints = polygonBoundaryPoints(
      innerRadius,
      startAngle,
      endAngle,
      sides,
      vertexAngle
    ).reverse();

    return [
      ...outerCommands,
      ...innerPoints.map((point) => `L ${pointCommand(point)}`),
      "Z"
    ].join(" ");
  }

  app.geometryRegistry.register("polygons", {
    label: "Animated polygon made from symmetric colored rings and sectors",
    presentation: {
      className: "presentation-polar",
      clipPath: "url(#disc-clip)",
      preserveAspectRatio: "xMidYMid slice"
    },
    create(context) {
      return app.geometryHelpers.createPolarGeometry(
        context,
        polygonSectorPath
      );
    }
  });
})(window.CircleApp = window.CircleApp || {});
