(() => {
  "use strict";

  const root = window.LightColumns = window.LightColumns || {};
  const palette = root.palette;
  const geometry = root.geometry;
  const radialGeometry = root.radialGeometry;
  const gradientMapping = root.gradientMapping;
  const mask = root.mask;
  const imageLayer = root.imageLayer;

  function mappingPosition(y, height, column, mappingSpace) {
    if (mappingSpace === "column" || mappingSpace === "shape") {
      const visibleLength = Math.max(1, height - column.top);

      return (y - column.top) / visibleLength;
    }

    return y / height;
  }

  function variationFor(index, state) {
    const phaseNoise = (
      geometry.randomAt(state.seed + 1709, index) - 0.5
    ) * state.variation.phaseJitter * 2;
    const brightness = (
      geometry.randomAt(state.seed + 9137, index) - 0.5
    ) * state.variation.brightness * 2;
    const opacityMultiplier = 1 + (
      geometry.randomAt(state.seed + 331, index) - 0.5
    ) * state.variation.opacity;

    return {
      phase: index * state.variation.phaseStep + phaseNoise,
      phaseNoise,
      brightness,
      opacityMultiplier
    };
  }

  function styleOpacity(index, count, state) {
    let opacity = state.mask.opacity;

    if (state.aesthetic === "blended") {
      opacity *= palette.clamp(state.style.bloom, 0.15, 1.25);
    } else if (state.aesthetic === "staggered") {
      const profile = geometry.profile(
        state.style.staggeredSequence,
        index,
        count,
        state.seed + 7919
      );
      const range = state.style.staggeredHeightVariation * 0.34;

      opacity *= state.style.staggeredOpacity *
        palette.clamp(0.78 + profile * range, 0.18, 1.12);
    }

    return palette.clamp(opacity, 0, 1);
  }

  function gradientSettings(state) {
    return {
      flow: state.gradient.flow,
      continuity: state.gradient.continuity,
      angularWrap: state.gradient.angularWrap,
      mappingSpace: state.palette.mappingSpace,
      polarMapping: state.radial.polarMapping
    };
  }

  function shapeSettings(state) {
    return {
      ...gradientSettings(state),
      ...state.radial
    };
  }

  class PaletteGeometryRenderer {
    constructor(canvas, width, height) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: false });
      this.width = width;
      this.height = height;
      this.layer = document.createElement("canvas");
      this.layerContext = this.layer.getContext("2d");
      this.shapeLayer = document.createElement("canvas");
      this.shapeContext = this.shapeLayer.getContext("2d");
      this.pixelRatio = 1;
      this.lastGeometrySet = null;
      this.lastGradientDescriptors = [];
      this.lastGradientStopCount = 0;
      this.lastSolidFillCount = 0;
    }

    resize(pixelRatio) {
      this.pixelRatio = pixelRatio;
      [this.canvas, this.layer, this.shapeLayer].forEach((surface) => {
        surface.width = Math.round(this.width * pixelRatio);
        surface.height = Math.round(this.height * pixelRatio);
      });
      [this.context, this.layerContext, this.shapeContext].forEach(
        (context) => {
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }
      );
    }

    traceShape(context, shape, normalizedEllipse) {
      if (shape.family === "triangle") {
        root.triangleGeometry.trace(context, shape);
        return;
      }
      if (shape.family === "columns") {
        geometry.trace(context, shape);
        return;
      }

      if (shape.family === "nested") {
        root.nestedGeometry.trace(context, shape);
        return;
      }

      if (shape.family === "moving") {
        root.movingGeometry.trace(context, shape);
        return;
      }

      radialGeometry.trace(
        context,
        normalizedEllipse
          ? { ...shape, ellipseRatio: 1 }
          : shape
      );
    }

    beginShapeTransform(context, shape, descriptor) {
      if (!descriptor.normalizedEllipse) {
        return;
      }

      context.translate(shape.center.x, shape.center.y);
      context.scale(1, shape.ellipseRatio);
      context.translate(-shape.center.x, -shape.center.y);
    }

    createGradient(context, descriptor) {
      if (descriptor.kind === "angular") {
        return context.createConicGradient(
          descriptor.startAngle,
          descriptor.center.x,
          descriptor.center.y
        );
      }

      if (descriptor.kind === "radial") {
        return context.createRadialGradient(
          descriptor.center.x,
          descriptor.center.y,
          descriptor.innerRadius,
          descriptor.center.x,
          descriptor.center.y,
          descriptor.outerRadius
        );
      }

      return context.createLinearGradient(
        descriptor.start.x,
        descriptor.start.y,
        descriptor.end.x,
        descriptor.end.y
      );
    }

    colorAt(source, descriptor, state, phase, variation, stopProgress) {
      let sourcePosition = descriptor.sourceReverse ? 1 - source : source;
      let overflow = state.palette.overflow;
      const wrap = state.gradient.angularWrap;
      const angularLoop = descriptor.kind === "angular" &&
        descriptor.fullCircle;

      if (angularLoop && wrap === "mirror") {
        sourcePosition = sourcePosition <= 0.5
          ? sourcePosition * 2
          : (1 - sourcePosition) * 2;
        overflow = "mirror";
      } else if (angularLoop && wrap === "repeat") {
        sourcePosition *= 2;
        overflow = "repeat";
      } else if (angularLoop && wrap === "seamless") {
        overflow = "repeat";
      }

      const palettePosition = palette.mapCoordinate(sourcePosition, {
        span: state.palette.span,
        offset: state.palette.offset,
        phase,
        reverse: state.palette.reverse,
        overflow
      });
      const loopSampler = angularLoop &&
        (wrap === "repeat" || wrap === "seamless");
      let sampled = loopSampler
        ? palette.sampleLoop(
          state.palette.colors,
          palettePosition,
          state.palette.interpolation
        )
        : palette.sample(
          state.palette.colors,
          palettePosition,
          state.palette.interpolation
        );

      if (angularLoop && wrap !== "mirror" && stopProgress > 0.92) {
        const startPosition = palette.mapCoordinate(0, {
          span: state.palette.span,
          offset: state.palette.offset,
          phase,
          reverse: state.palette.reverse,
          overflow: "repeat"
        });
        const startColor = palette.sampleLoop(
          state.palette.colors,
          startPosition,
          state.palette.interpolation
        );
        const amount = (stopProgress - 0.92) / 0.08;
        const eased = amount * amount * (3 - 2 * amount);

        sampled = palette.mix(sampled, startColor, eased);
      }

      return palette.toCss(
        sampled,
        variation.opacity,
        variation.brightness
      );
    }

    addGradientStops(
      canvasGradient,
      descriptor,
      state,
      phase,
      variation
    ) {
      const resolution = state.palette.interpolation === "hard" ? 320 : 144;
      const start = descriptor.stopStart;
      const end = descriptor.stopEnd;
      let firstColor = null;
      let lastColor = null;

      for (let step = 0; step <= resolution; step += 1) {
        const progress = step / resolution;
        const stop = start + (end - start) * progress;
        const color = this.colorAt(
          progress,
          descriptor,
          state,
          phase,
          variation,
          progress
        );

        if (step === 0) {
          firstColor = color;
          if (start > 0) {
            canvasGradient.addColorStop(0, color);
            this.lastGradientStopCount += 1;
          }
        }

        canvasGradient.addColorStop(stop, color);
        this.lastGradientStopCount += 1;
        lastColor = color;
      }

      if (end < 1) {
        canvasGradient.addColorStop(1, lastColor || firstColor);
        this.lastGradientStopCount += 1;
      }
    }

    prepareShapeLayer() {
      const context = this.shapeContext;

      context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.filter = "none";
      context.clearRect(0, 0, this.width, this.height);
    }

    applyColumnMask(shape, state) {
      if (shape.family !== "columns" || state.mask.softness <= 0) {
        return;
      }

      const context = this.shapeContext;
      const top = Math.min(shape.top, shape.topLeft, shape.topRight);
      const fade = context.createLinearGradient(
        0,
        top,
        0,
        top + state.mask.softness
      );

      fade.addColorStop(0, "rgba(255,255,255,0)");
      fade.addColorStop(1, "rgba(255,255,255,1)");
      context.save();
      context.globalCompositeOperation = "destination-in";
      context.fillStyle = fade;
      context.fillRect(0, 0, this.width, this.height);
      context.restore();
    }

    commitShapeLayer() {
      this.layerContext.drawImage(
        this.shapeLayer,
        0,
        0,
        this.width,
        this.height
      );
    }

    drawGradientShape(shape, geometrySet, index, count, state) {
      const usesShapeLayer = shape.family === "columns";
      const context = usesShapeLayer
        ? this.shapeContext
        : this.layerContext;
      const generatedVariation = variationFor(index, state);
      const opacity = palette.clamp(
        styleOpacity(index, count, state) *
          generatedVariation.opacityMultiplier,
        0,
        1
      );
      const settings = shapeSettings(state);
      const generatedPhase = shape.family === "rings"
        ? generatedVariation.phaseNoise
        : generatedVariation.phase;
      const phase = gradientMapping.phaseForShape(
        shape,
        settings,
        generatedPhase
      );
      const descriptors = gradientMapping.descriptors(
        shape,
        geometrySet,
        settings,
        this.width,
        this.height
      );

      if (usesShapeLayer) {
        this.prepareShapeLayer();
      }
      descriptors.forEach((descriptor) => {
        context.save();
        this.beginShapeTransform(context, shape, descriptor);
        const canvasGradient = this.createGradient(context, descriptor);

        this.addGradientStops(canvasGradient, descriptor, state, phase, {
          brightness: generatedVariation.brightness,
          opacity
        });
        context.globalAlpha = descriptor.opacity;
        context.globalCompositeOperation = descriptor.blendMode;
        context.fillStyle = canvasGradient;
        this.traceShape(context, shape, descriptor.normalizedEllipse);
        context.fill();
        context.restore();
        this.lastGradientDescriptors.push(descriptor);
      });

      if (usesShapeLayer) {
        this.applyColumnMask(shape, state);
        this.commitShapeLayer();
      }
    }

    solidSourcePosition(shape, index, count, state) {
      if (shape.family === "triangle") return 0.5;
      if (shape.family === "nested") return index / Math.max(1, count - 1);
      if (shape.family === "columns" || shape.family === "moving") {
        return (index + 0.5) / count;
      }

      return radialGeometry.palettePosition(shape, state.radial);
    }

    drawSolidShape(shape, index, count, state) {
      const directContext = this.layerContext;
      const generatedVariation = variationFor(index, state);
      const sourcePosition = this.solidSourcePosition(
        shape,
        index,
        count,
        state
      );
      const palettePosition = palette.mapCoordinate(sourcePosition, {
        span: state.palette.span,
        offset: state.palette.offset,
        phase: shape.family === "rings"
          ? generatedVariation.phaseNoise
          : generatedVariation.phase,
        reverse: state.palette.reverse,
        overflow: state.palette.overflow
      });
      const sampled = palette.sample(
        state.palette.colors,
        palettePosition,
        state.palette.interpolation
      );
      const opacity = palette.clamp(
        styleOpacity(index, count, state) *
          generatedVariation.opacityMultiplier,
        0,
        1
      );

      const fillStyle = palette.toCss(
        sampled,
        opacity,
        generatedVariation.brightness
      );

      if (shape.family === "columns") {
        const context = this.shapeContext;

        this.prepareShapeLayer();
        context.fillStyle = fillStyle;
        this.traceShape(context, shape, false);
        context.fill();
        this.applyColumnMask(shape, state);
        this.commitShapeLayer();
      } else {
        directContext.fillStyle = fillStyle;
        this.traceShape(directContext, shape, false);
        directContext.fill();
      }
      this.lastSolidFillCount += 1;
    }

    drawShapes(shapes, geometrySet, state) {
      const treatment = state.gradient.treatment || "continuous";

      shapes.forEach((shape, index) => {
        if (shape.family === "moving" && shape.points.length < 3) return;
        if (treatment === "solid") {
          this.drawSolidShape(shape, index, shapes.length, state);
        } else {
          this.drawGradientShape(
            shape,
            geometrySet,
            index,
            shapes.length,
            state
          );
        }
      });
    }

    drawGeometry(state) {
      if (state.geometryFamily === "triangle") {
        const geometrySet = root.triangleGeometry.build(state.triangle, this.width, this.height);
        this.lastGeometrySet = geometrySet;
        this.drawShapes(geometrySet.shapes, geometrySet, state);
        return;
      }
      if (state.geometryFamily === "columns") {
        const shapes = [];

        this.lastGeometrySet = null;
        for (let index = 0; index < state.columns; index += 1) {
          const column = geometry.describeColumn(
            index,
            state.columns,
            this.width,
            this.height,
            {
              ...state.geometry,
              seed: state.seed
            }
          );

          column.family = "columns";
          column.count = state.columns;
          shapes.push(column);
        }

        this.drawShapes(shapes, null, state);
        return;
      }

      if (state.geometryFamily === "nested") {
        const geometrySet = root.nestedGeometry.build(state.nested, this.width, this.height);
        this.lastGeometrySet = geometrySet;
        this.drawShapes(geometrySet.shapes, geometrySet, state);
        return;
      }

      if (state.geometryFamily === "moving") {
        const geometrySet = root.movingGeometry.build(
          { ...state.moving, seed: state.seed }, this.width, this.height
        );
        this.lastGeometrySet = geometrySet;
        this.drawShapes(geometrySet.shapes, geometrySet, state);
        return;
      }

      const geometrySet = radialGeometry.build(
        state.geometryFamily,
        {
          ...state.radial,
          seed: state.seed
        },
        this.width,
        this.height
      );

      this.lastGeometrySet = geometrySet;
      this.drawShapes(geometrySet.shapes, geometrySet, state);
    }

    render(state) {
      const context = this.context;
      const layerContext = this.layerContext;

      this.lastGradientDescriptors = [];
      this.lastGradientStopCount = 0;
      this.lastSolidFillCount = 0;
      context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      layerContext.setTransform(
        this.pixelRatio,
        0,
        0,
        this.pixelRatio,
        0,
        0
      );
      context.clearRect(0, 0, this.width, this.height);
      context.fillStyle = state.background;
      context.fillRect(0, 0, this.width, this.height);
      let imageDrawn = false;

      if (imageLayer && state.imageLayer) {
        imageDrawn = imageLayer.draw(
          context,
          state.imageLayer.image,
          this.width,
          this.height,
          state.imageLayer
        );
        if (imageDrawn && state.imageLayer.overlay) {
          imageLayer.drawOverlay(
            context,
            this.width,
            this.height,
            state.imageLayer.overlay
          );
        }
      }
      layerContext.globalCompositeOperation = "source-over";
      layerContext.globalAlpha = 1;
      layerContext.filter = "none";
      layerContext.clearRect(0, 0, this.width, this.height);
      if (state.geometryEnabled === false) {
        return;
      }
      this.drawGeometry(state);

      const styleGlow = state.geometryFamily !== "columns" &&
        state.aesthetic === "blended"
        ? state.style.blur
        : 0;
      const radialSoftness = state.geometryFamily === "columns"
        ? 0
        : state.mask.softness * 0.12;
      const glow = Math.max(
        state.light.glow,
        styleGlow,
        radialSoftness
      );

      if (glow > 0) {
        context.save();
        context.globalCompositeOperation = "screen";
        context.globalAlpha = 0.62;
        context.filter = `blur(${glow}px)`;
        context.drawImage(this.layer, 0, 0, this.width, this.height);
        context.restore();
      }

      context.save();
      context.globalCompositeOperation = state.light.blendMode;
      context.drawImage(this.layer, 0, 0, this.width, this.height);
      context.restore();
    }
  }

  root.PaletteGeometryRenderer = PaletteGeometryRenderer;
  root.PaletteColumnRenderer = PaletteGeometryRenderer;
  root.invariants = {
    gradientSettings,
    mappingPosition,
    variationFor
  };
})();
