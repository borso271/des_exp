    (() => {
      "use strict";

      const width = 1200;
      let height = 750;
      const defaultImageFilename = LightColumns.defaultImage.filename;
      const defaultImageSource = LightColumns.defaultImage.source;
      const canvas = document.querySelector("#light-canvas");
      const context = canvas.getContext("2d", { alpha: false });
      const poster = document.querySelector(".poster");
      const wordmark = document.querySelector("#wordmark");
      const eventCopy = document.querySelector("#event-copy");
      const controls = {
        aesthetic: document.querySelector("#aesthetic"),
        splitColorA: document.querySelector("#split-color-a"),
        splitColorB: document.querySelector("#split-color-b"),
        splitAngle: document.querySelector("#split-angle"),
        splitOffset: document.querySelector("#split-offset"),
        splitHover: document.querySelector("#split-hover"),
        splitSmoothing: document.querySelector("#split-smoothing"),
        triangleColor: document.querySelector("#triangle-color"),
        triangleBackground: document.querySelector("#triangle-background"),
        triangleSize: document.querySelector("#triangle-size"),
        triangleX: document.querySelector("#triangle-x"),
        triangleY: document.querySelector("#triangle-y"),
        triangleAngle: document.querySelector("#triangle-angle"),
        triangleHover: document.querySelector("#triangle-hover"),
        triangleSmoothing: document.querySelector("#triangle-smoothing"),
        geometryFamily: document.querySelector("#geometry-family"),
        nestedShape: document.querySelector("#nested-shape"),
        nestedCount: document.querySelector("#nested-count"),
        nestedScale: document.querySelector("#nested-scale"),
        nestedRatio: document.querySelector("#nested-ratio"),
        nestedRatioChange: document.querySelector("#nested-ratio-change"),
        nestedOffsetX: document.querySelector("#nested-offset-x"),
        nestedOffsetY: document.querySelector("#nested-offset-y"),
        movingCount: document.querySelector("#moving-count"),
        movingBreathing: document.querySelector("#moving-breathing"),
        movingSpeed: document.querySelector("#moving-speed"),
        movingAnimated: document.querySelector("#moving-animated"),
        movingTime: document.querySelector("#moving-time"),
        columns: document.querySelector("#columns"),
        centerX: document.querySelector("#center-x"),
        centerY: document.querySelector("#center-y"),
        ellipseRatio: document.querySelector("#ellipse-ratio"),
        ringCount: document.querySelector("#ring-count"),
        innerRadius: document.querySelector("#inner-radius"),
        ringThickness: document.querySelector("#ring-thickness"),
        ringGap: document.querySelector("#ring-gap"),
        radialOffset: document.querySelector("#radial-offset"),
        ringPhase: document.querySelector("#ring-phase"),
        ringVariation: document.querySelector("#ring-variation"),
        ringVariationAmount: document.querySelector(
          "#ring-variation-amount"
        ),
        sectorCount: document.querySelector("#sector-count"),
        sectorRotation: document.querySelector("#sector-rotation"),
        innerOpening: document.querySelector("#inner-opening"),
        angularGap: document.querySelector("#angular-gap"),
        sectorDirection: document.querySelector("#sector-direction"),
        sectorVariation: document.querySelector("#sector-variation"),
        mirrorSymmetry: document.querySelector("#mirror-symmetry"),
        polarMapping: document.querySelector("#polar-mapping"),
        polarAssignment: document.querySelector("#polar-assignment"),
        columnReach: document.querySelector("#column-reach"),
        heightPattern: document.querySelector("#height-pattern"),
        heightVariation: document.querySelector("#height-variation"),
        columnShape: document.querySelector("#column-shape"),
        columnGap: document.querySelector("#column-gap"),
        paletteSource: document.querySelector("#palette-source"),
        paletteCount: document.querySelector("#palette-count"),
        paletteType: document.querySelector("#palette-type"),
        baseHue: document.querySelector("#base-hue"),
        paletteVariability: document.querySelector(
          "#palette-variability"
        ),
        paletteSeed: document.querySelector("#palette-seed"),
        paletteInterpolation: document.querySelector(
          "#palette-interpolation"
        ),
        gradientTreatment: document.querySelector("#gradient-treatment"),
        gradientFlow: document.querySelector("#gradient-flow"),
        gradientContinuity: document.querySelector(
          "#gradient-continuity"
        ),
        angularWrap: document.querySelector("#angular-wrap"),
        mappingSpace: document.querySelector("#mapping-space"),
        paletteDirection: document.querySelector("#palette-direction"),
        paletteOffset: document.querySelector("#palette-offset"),
        paletteSpan: document.querySelector("#palette-span"),
        paletteOverflow: document.querySelector("#palette-overflow"),
        backgroundColor: document.querySelector("#background-color"),
        columnSoftness: document.querySelector("#column-softness"),
        columnOpacity: document.querySelector("#column-opacity"),
        columnGlow: document.querySelector("#column-glow"),
        columnBlend: document.querySelector("#column-blend"),
        phaseStep: document.querySelector("#phase-step"),
        phaseJitter: document.querySelector("#phase-jitter"),
        brightnessVariation: document.querySelector(
          "#brightness-variation"
        ),
        opacityVariation: document.querySelector("#opacity-variation"),
        blur: document.querySelector("#blur"),
        bloom: document.querySelector("#bloom"),
        fade: document.querySelector("#fade"),
        transition: document.querySelector("#transition"),
        hue: document.querySelector("#hue"),
        spread: document.querySelector("#spread"),
        warmth: document.querySelector("#warmth"),
        variation: document.querySelector("#variation"),
        staggeredReach: document.querySelector("#staggered-reach"),
        staggeredHeightVariation: document.querySelector(
          "#staggered-height-variation"
        ),
        staggeredSoftness: document.querySelector(
          "#staggered-softness"
        ),
        staggeredOpacity: document.querySelector("#staggered-opacity"),
        staggeredSequence: document.querySelector("#staggered-sequence"),
        preset: document.querySelector("#preset"),
        eventCopyVariant: document.querySelector("#event-copy-variant"),
        manifestoFontSize: document.querySelector("#manifesto-font-size"),
        manifestoFontWeight: document.querySelector("#manifesto-font-weight"),
        textVerticalAlign: document.querySelector("#text-vertical-align"),
        eventTextEffect: document.querySelector("#event-text-effect"),
        eventTextAccent: document.querySelector("#event-text-accent"),
        eventTextOpacity: document.querySelector("#event-text-opacity"),
        logoEffect: document.querySelector("#logo-effect"),
        logoAccent: document.querySelector("#logo-accent"),
        matchTextAccent: document.querySelector("#match-text-accent"),
        logoEffectStrength: document.querySelector(
          "#logo-effect-strength"
        ),
        logoEffectBlur: document.querySelector("#logo-effect-blur"),
        logoEffectHue: document.querySelector("#logo-effect-hue"),
        logoEffectOpacity: document.querySelector("#logo-effect-opacity"),
        backgroundImageEnabled: document.querySelector(
          "#background-image-enabled"
        ),
        lightGeometryEnabled: document.querySelector(
          "#light-geometry-enabled"
        ),
        imageOverlayEnabled: document.querySelector(
          "#image-overlay-enabled"
        ),
        imageOverlayColor: document.querySelector("#image-overlay-color"),
        imageOverlayOpacity: document.querySelector(
          "#image-overlay-opacity"
        ),
        imageOverlayBlend: document.querySelector("#image-overlay-blend"),
        backgroundImageFile: document.querySelector(
          "#background-image-file"
        ),
        backgroundImageFit: document.querySelector(
          "#background-image-fit"
        ),
        backgroundImagePositionX: document.querySelector(
          "#background-image-position-x"
        ),
        backgroundImagePositionY: document.querySelector(
          "#background-image-position-y"
        ),
        backgroundImageScale: document.querySelector(
          "#background-image-scale"
        ),
        backgroundImageOpacity: document.querySelector(
          "#background-image-opacity"
        ),
        backgroundImageBlend: document.querySelector(
          "#background-image-blend"
        ),
        backgroundImageBlur: document.querySelector(
          "#background-image-blur"
        ),
        backgroundImageBrightness: document.querySelector(
          "#background-image-brightness"
        ),
        backgroundImageContrast: document.querySelector(
          "#background-image-contrast"
        ),
        backgroundImageSaturation: document.querySelector(
          "#background-image-saturation"
        ),
        backgroundImageHue: document.querySelector(
          "#background-image-hue"
        ),
        backgroundImageGrayscale: document.querySelector(
          "#background-image-grayscale"
        ),
        seed: document.querySelector("#seed")
      };
      const paletteInputs = Array.from(
        document.querySelectorAll(".palette-color")
      );
      const paletteSwatches = Array.from(
        document.querySelectorAll(".palette-swatch")
      );
      const outputs = {
        splitAngle: document.querySelector("#split-angle-output"),
        splitOffset: document.querySelector("#split-offset-output"),
        splitSmoothing: document.querySelector("#split-smoothing-output"),
        triangleSize: document.querySelector("#triangle-size-output"),
        triangleX: document.querySelector("#triangle-x-output"),
        triangleY: document.querySelector("#triangle-y-output"),
        triangleAngle: document.querySelector("#triangle-angle-output"),
        triangleSmoothing: document.querySelector("#triangle-smoothing-output"),
        nestedCount: document.querySelector("#nested-count-output"),
        nestedScale: document.querySelector("#nested-scale-output"),
        nestedRatio: document.querySelector("#nested-ratio-output"),
        nestedRatioChange: document.querySelector("#nested-ratio-change-output"),
        nestedOffsetX: document.querySelector("#nested-offset-x-output"),
        nestedOffsetY: document.querySelector("#nested-offset-y-output"),
        movingCount: document.querySelector("#moving-count-output"),
        movingBreathing: document.querySelector("#moving-breathing-output"),
        movingSpeed: document.querySelector("#moving-speed-output"),
        columns: document.querySelector("#columns-output"),
        centerX: document.querySelector("#center-x-output"),
        centerY: document.querySelector("#center-y-output"),
        ellipseRatio: document.querySelector("#ellipse-ratio-output"),
        ringCount: document.querySelector("#ring-count-output"),
        innerRadius: document.querySelector("#inner-radius-output"),
        ringThickness: document.querySelector("#ring-thickness-output"),
        ringGap: document.querySelector("#ring-gap-output"),
        radialOffset: document.querySelector("#radial-offset-output"),
        ringPhase: document.querySelector("#ring-phase-output"),
        ringVariationAmount: document.querySelector(
          "#ring-variation-amount-output"
        ),
        sectorCount: document.querySelector("#sector-count-output"),
        sectorRotation: document.querySelector("#sector-rotation-output"),
        innerOpening: document.querySelector("#inner-opening-output"),
        angularGap: document.querySelector("#angular-gap-output"),
        columnReach: document.querySelector("#column-reach-output"),
        heightVariation: document.querySelector(
          "#height-variation-output"
        ),
        columnGap: document.querySelector("#column-gap-output"),
        paletteCount: document.querySelector("#palette-count-output"),
        baseHue: document.querySelector("#base-hue-output"),
        paletteVariability: document.querySelector(
          "#palette-variability-output"
        ),
        paletteOffset: document.querySelector("#palette-offset-output"),
        paletteSpan: document.querySelector("#palette-span-output"),
        columnSoftness: document.querySelector(
          "#column-softness-output"
        ),
        columnOpacity: document.querySelector("#column-opacity-output"),
        columnGlow: document.querySelector("#column-glow-output"),
        phaseStep: document.querySelector("#phase-step-output"),
        phaseJitter: document.querySelector("#phase-jitter-output"),
        brightnessVariation: document.querySelector(
          "#brightness-variation-output"
        ),
        opacityVariation: document.querySelector(
          "#opacity-variation-output"
        ),
        blur: document.querySelector("#blur-output"),
        bloom: document.querySelector("#bloom-output"),
        fade: document.querySelector("#fade-output"),
        transition: document.querySelector("#transition-output"),
        hue: document.querySelector("#hue-output"),
        spread: document.querySelector("#spread-output"),
        warmth: document.querySelector("#warmth-output"),
        variation: document.querySelector("#variation-output"),
        staggeredReach: document.querySelector(
          "#staggered-reach-output"
        ),
        staggeredHeightVariation: document.querySelector(
          "#staggered-height-variation-output"
        ),
        staggeredSoftness: document.querySelector(
          "#staggered-softness-output"
        ),
        staggeredOpacity: document.querySelector(
          "#staggered-opacity-output"
        ),
        eventTextAccent: document.querySelector(
          "#event-text-accent-output"
        ),
        eventTextOpacity: document.querySelector(
          "#event-text-opacity-output"
        ),
        logoAccent: document.querySelector("#logo-accent-output"),
        logoEffectStrength: document.querySelector(
          "#logo-effect-strength-output"
        ),
        logoEffectBlur: document.querySelector(
          "#logo-effect-blur-output"
        ),
        logoEffectHue: document.querySelector("#logo-effect-hue-output"),
        logoEffectOpacity: document.querySelector(
          "#logo-effect-opacity-output"
        ),
        backgroundImagePositionX: document.querySelector(
          "#background-image-position-x-output"
        ),
        backgroundImagePositionY: document.querySelector(
          "#background-image-position-y-output"
        ),
        backgroundImageScale: document.querySelector(
          "#background-image-scale-output"
        ),
        backgroundImageOpacity: document.querySelector(
          "#background-image-opacity-output"
        ),
        imageOverlayOpacity: document.querySelector(
          "#image-overlay-opacity-output"
        ),
        backgroundImageBlur: document.querySelector(
          "#background-image-blur-output"
        ),
        backgroundImageBrightness: document.querySelector(
          "#background-image-brightness-output"
        ),
        backgroundImageContrast: document.querySelector(
          "#background-image-contrast-output"
        ),
        backgroundImageSaturation: document.querySelector(
          "#background-image-saturation-output"
        ),
        backgroundImageHue: document.querySelector(
          "#background-image-hue-output"
        ),
        backgroundImageGrayscale: document.querySelector(
          "#background-image-grayscale-output"
        )
      };
      const conditionalPanels = document.querySelectorAll(
        "[data-aesthetic-only], [data-geometry-only], " +
        "[data-gradient-only], [data-continuity-only], " +
        "[data-flow-component], [data-polar-mapping-control], " +
        "[data-shape-phase-control], [data-mapping-space-control]"
      );
      const imageControlsPanel = document.querySelector(
        "[data-image-controls]"
      );
      const imageOverlayControlsPanel = document.querySelector(
        "[data-image-overlay-controls]"
      );
      const imageFilename = document.querySelector(
        "#background-image-filename"
      );
      const imageStatus = document.querySelector(
        "#background-image-status"
      );
      const settingsFileInput = document.querySelector(
        "#load-settings-file"
      );
      const settingsStatus = document.querySelector("#settings-status span");
      const exportScale = document.querySelector("#export-scale");
      const exportButton = document.querySelector("#export-png");
      const exportStatus = document.querySelector("#export-status span");
      const paletteSourcePanels = Array.from(
        document.querySelectorAll("[data-palette-source-only]")
      );
      const generatedPaletteSwatchContainer = document.querySelector(
        "#generated-palette-swatches"
      );
      const generatedPaletteSwatches = Array.from(
        { length: 16 },
        (_, index) => {
          const swatch = document.createElement("span");
          const label = document.createElement("span");
          const chip = document.createElement("span");

          swatch.className = "palette-swatch generated-swatch";
          label.textContent = String(index + 1);
          chip.className = "generated-chip";
          chip.setAttribute("aria-hidden", "true");
          swatch.append(label, chip);
          generatedPaletteSwatchContainer.append(swatch);
          return swatch;
        }
      );
      let activePaletteSource = controls.paletteSource.value;
      const paletteCounts = {
        manual: Math.round(value("paletteCount")),
        generated: 8
      };
      let generatedPaletteColors = [];
      const radialPresetBase = {
        aesthetic: "palette",
        gradientTreatment: "continuous",
        gradientFlow: "along",
        gradientContinuity: "reset",
        angularWrap: "seamless",
        centerX: 50,
        centerY: 50,
        ellipseRatio: 100,
        ringCount: 8,
        innerRadius: 0,
        ringThickness: 100,
        ringGap: 0,
        radialOffset: 0,
        ringPhase: 0,
        ringVariation: "flat",
        ringVariationAmount: 15,
        sectorCount: 12,
        sectorRotation: -90,
        innerOpening: 0,
        angularGap: 0,
        sectorDirection: "clockwise",
        sectorVariation: "flat",
        mirrorSymmetry: false,
        polarMapping: "combined",
        polarAssignment: "continuous",
        paletteInterpolation: "smooth",
        mappingSpace: "canvas",
        paletteDirection: "down",
        paletteOffset: 0,
        paletteSpan: 100,
        paletteOverflow: "mirror",
        backgroundColor: "#233bd0",
        columnSoftness: 90,
        columnOpacity: 0.94,
        columnGlow: 18,
        columnBlend: "source-over",
        phaseStep: 0,
        phaseJitter: 3,
        brightnessVariation: 3,
        opacityVariation: 4
      };
      const presets = {
        triangleLight: {
          aesthetic: "palette", geometryFamily: "triangle",
          triangleSize: 150, triangleX: 55, triangleY: 55, triangleAngle: 280,
          paletteCount: 4, paletteColors: ["#374aff", "#9564ef", "#ee91bf", "#ffbd6c"],
          gradientTreatment: "continuous", gradientFlow: "diagonal", gradientContinuity: "reset",
          mappingSpace: "shape", paletteInterpolation: "smooth", paletteDirection: "down",
          paletteOffset: 0, paletteSpan: 100, paletteOverflow: "extend",
          backgroundColor: "#151c3c", columnSoftness: 60, columnGlow: 28,
          columnOpacity: 0.9, columnBlend: "source-over", phaseStep: 0,
          phaseJitter: 0, brightnessVariation: 0, opacityVariation: 0,
          lightGeometryEnabled: true
        },
        nestedStudy: {
          aesthetic: "palette", geometryFamily: "nested", nestedShape: "square",
          nestedCount: 4, nestedScale: 90, nestedRatio: 75, nestedRatioChange: 0,
          nestedOffsetX: 0, nestedOffsetY: 40,
          paletteCount: 4, paletteColors: ["#b99a57", "#cf773e", "#9c4836", "#63392f"],
          gradientTreatment: "solid", gradientContinuity: "reset",
          paletteInterpolation: "linear", paletteDirection: "down",
          paletteOffset: 0, paletteSpan: 100, paletteOverflow: "extend",
          backgroundColor: "#e8dfcc", columnSoftness: 0, columnGlow: 0,
          columnOpacity: 1, columnBlend: "source-over", phaseStep: 0,
          phaseJitter: 0, brightnessVariation: 0, opacityVariation: 0
        },
        saturated: {
          aesthetic: "palette",
          geometryFamily: "columns",
          gradientTreatment: "continuous",
          gradientFlow: "along",
          gradientContinuity: "phase",
          angularWrap: "seamless",
          columns: 8,
          columnReach: 92,
          heightPattern: "wave",
          heightVariation: 24,
          columnShape: "straight",
          columnGap: 0,
          paletteCount: 4,
          paletteColors: ["#2448ff", "#7147ee", "#e96eb8", "#ffad3f"],
          paletteInterpolation: "smooth",
          mappingSpace: "canvas",
          paletteDirection: "down",
          paletteOffset: 0,
          paletteSpan: 100,
          paletteOverflow: "mirror",
          backgroundColor: "#233bd0",
          columnSoftness: 90,
          columnOpacity: 0.94,
          columnGlow: 18,
          columnBlend: "source-over",
          phaseStep: 12,
          phaseJitter: 4,
          brightnessVariation: 4,
          opacityVariation: 5
        },
        referencePale: {
          aesthetic: "palette",
          geometryFamily: "columns",
          gradientTreatment: "continuous",
          gradientFlow: "along",
          gradientContinuity: "phase",
          angularWrap: "seamless",
          columns: 10,
          columnReach: 82,
          heightPattern: "random",
          heightVariation: 22,
          columnShape: "straight",
          columnGap: 0,
          paletteCount: 5,
          paletteColors: [
            "#f4f6f3",
            "#aebcf1",
            "#3437ed",
            "#cf70c5",
            "#f6a54e"
          ],
          paletteInterpolation: "smooth",
          mappingSpace: "canvas",
          paletteDirection: "down",
          paletteOffset: 0,
          paletteSpan: 100,
          paletteOverflow: "extend",
          backgroundColor: "#edf0f4",
          columnSoftness: 120,
          columnOpacity: 0.92,
          columnGlow: 24,
          columnBlend: "screen",
          phaseStep: 0,
          phaseJitter: 2,
          brightnessVariation: 5,
          opacityVariation: 7
        },
        coolMirror: {
          aesthetic: "palette",
          geometryFamily: "columns",
          gradientTreatment: "continuous",
          gradientFlow: "along",
          gradientContinuity: "phase",
          angularWrap: "seamless",
          columns: 12,
          columnReach: 104,
          heightPattern: "alternating",
          heightVariation: 18,
          columnShape: "rounded",
          columnGap: 5,
          paletteCount: 5,
          paletteColors: [
            "#10bfe8",
            "#2555ff",
            "#643ce8",
            "#b456dc",
            "#ef78b8"
          ],
          paletteInterpolation: "linear",
          mappingSpace: "shape",
          paletteDirection: "down",
          paletteOffset: -10,
          paletteSpan: 115,
          paletteOverflow: "mirror",
          backgroundColor: "#1720a8",
          columnSoftness: 54,
          columnOpacity: 0.9,
          columnGlow: 12,
          columnBlend: "screen",
          phaseStep: 7,
          phaseJitter: 3,
          brightnessVariation: 3,
          opacityVariation: 4
        },
        graphicBands: {
          aesthetic: "palette",
          geometryFamily: "columns",
          gradientTreatment: "continuous",
          gradientFlow: "along",
          gradientContinuity: "phase",
          angularWrap: "seamless",
          columns: 9,
          columnReach: 100,
          heightPattern: "descending",
          heightVariation: 30,
          columnShape: "slanted",
          columnGap: 2,
          paletteCount: 3,
          paletteColors: ["#1322b9", "#f43da2", "#ffbe36"],
          paletteInterpolation: "hard",
          mappingSpace: "shape",
          paletteDirection: "down",
          paletteOffset: 0,
          paletteSpan: 100,
          paletteOverflow: "repeat",
          backgroundColor: "#e7e4d5",
          columnSoftness: 0,
          columnOpacity: 1,
          columnGlow: 0,
          columnBlend: "source-over",
          phaseStep: 10,
          phaseJitter: 0,
          brightnessVariation: 0,
          opacityVariation: 0
        },
        luminousRings: {
          ...radialPresetBase,
          geometryFamily: "rings",
          gradientTreatment: "continuous",
          gradientFlow: "along",
          gradientContinuity: "phase",
          angularWrap: "seamless",
          centerX: 50,
          centerY: 46,
          ellipseRatio: 92,
          ringCount: 11,
          ringThickness: 126,
          ringGap: 0,
          ringPhase: 6,
          ringVariation: "wave",
          ringVariationAmount: 14,
          paletteCount: 5,
          paletteColors: [
            "#1736e8",
            "#5147ff",
            "#9b55ea",
            "#ee6eb8",
            "#ff9f55"
          ],
          paletteInterpolation: "smooth",
          paletteOverflow: "mirror",
          backgroundColor: "#192cc2",
          columnSoftness: 150,
          columnOpacity: 0.86,
          columnGlow: 34,
          columnBlend: "screen",
          phaseJitter: 2,
          brightnessVariation: 3,
          opacityVariation: 5
        },
        graphicRings: {
          ...radialPresetBase,
          geometryFamily: "rings",
          gradientTreatment: "continuous",
          gradientFlow: "across",
          gradientContinuity: "continuous",
          centerX: 50,
          centerY: 50,
          ellipseRatio: 100,
          ringCount: 12,
          ringThickness: 78,
          ringGap: 5,
          radialOffset: 8,
          ringPhase: 0,
          ringVariation: "alternating",
          ringVariationAmount: 18,
          paletteCount: 4,
          paletteColors: ["#1526b8", "#21bfd3", "#ef3f92", "#ffc43d"],
          paletteInterpolation: "hard",
          paletteOverflow: "repeat",
          backgroundColor: "#f0eadc",
          columnSoftness: 0,
          columnOpacity: 1,
          columnGlow: 0,
          columnBlend: "source-over",
          phaseJitter: 0,
          brightnessVariation: 0,
          opacityVariation: 0
        },
        radialRays: {
          ...radialPresetBase,
          geometryFamily: "sectors",
          gradientTreatment: "continuous",
          gradientFlow: "along",
          gradientContinuity: "phase",
          centerX: 50,
          centerY: 100,
          sectorCount: 18,
          sectorRotation: -90,
          innerOpening: 0,
          angularGap: 0,
          sectorVariation: "alternating",
          paletteCount: 4,
          paletteColors: ["#2541dd", "#7247f2", "#ed5cae", "#ffab42"],
          paletteInterpolation: "linear",
          paletteOverflow: "mirror",
          backgroundColor: "#263dd2",
          columnSoftness: 72,
          columnOpacity: 0.94,
          columnGlow: 16,
          columnBlend: "source-over",
          phaseStep: 9,
          phaseJitter: 0,
          brightnessVariation: 2,
          opacityVariation: 0
        },
        mirroredSectors: {
          ...radialPresetBase,
          geometryFamily: "sectors",
          gradientTreatment: "continuous",
          gradientFlow: "across",
          gradientContinuity: "continuous",
          angularWrap: "mirror",
          centerX: 50,
          centerY: 18,
          ellipseRatio: 112,
          sectorCount: 16,
          sectorRotation: -90,
          angularGap: 1,
          sectorDirection: "clockwise",
          sectorVariation: "mirrored",
          mirrorSymmetry: true,
          paletteCount: 5,
          paletteColors: [
            "#1426a8",
            "#244cf0",
            "#7550e8",
            "#e253b3",
            "#ff9d4d"
          ],
          paletteInterpolation: "smooth",
          paletteOverflow: "mirror",
          backgroundColor: "#121d84",
          columnSoftness: 110,
          columnOpacity: 0.9,
          columnGlow: 24,
          columnBlend: "screen",
          phaseStep: 0,
          phaseJitter: 0,
          brightnessVariation: 3,
          opacityVariation: 3
        },
        polarCheckerboard: {
          ...radialPresetBase,
          geometryFamily: "polar",
          gradientTreatment: "continuous",
          gradientFlow: "radial-angular",
          gradientContinuity: "phase",
          angularWrap: "seamless",
          centerX: 50,
          centerY: 50,
          ellipseRatio: 100,
          ringCount: 8,
          ringThickness: 96,
          ringGap: 2,
          sectorCount: 16,
          sectorRotation: -90,
          angularGap: 0.8,
          polarMapping: "combined",
          polarAssignment: "checkerboard",
          paletteCount: 4,
          paletteColors: ["#202dbf", "#45c7d8", "#e84baa", "#ffbd38"],
          paletteInterpolation: "hard",
          paletteOverflow: "repeat",
          backgroundColor: "#efe9dc",
          columnSoftness: 0,
          columnOpacity: 1,
          columnGlow: 0,
          columnBlend: "source-over",
          phaseStep: 0,
          phaseJitter: 0,
          brightnessVariation: 0,
          opacityVariation: 0
        },
        reference: {
          aesthetic: "blended",
          geometryFamily: "columns",
          blur: 28,
          bloom: 0.86,
          fade: 34,
          transition: 54,
          hue: 0,
          spread: 36,
          warmth: 0.84,
          variation: 0.55
        },
        cool: {
          aesthetic: "blended",
          geometryFamily: "columns",
          blur: 36,
          bloom: 0.72,
          fade: 43,
          transition: 58,
          hue: -28,
          spread: 24,
          warmth: 0.34,
          variation: 0.38
        },
        dusk: {
          aesthetic: "blended",
          geometryFamily: "columns",
          blur: 20,
          bloom: 1.12,
          fade: 27,
          transition: 48,
          hue: 22,
          spread: 72,
          warmth: 1,
          variation: 0.78
        },
        soft: {
          aesthetic: "blended",
          geometryFamily: "columns",
          blur: 44,
          bloom: 0.58,
          fade: 53,
          transition: 62,
          hue: -8,
          spread: 46,
          warmth: 0.58,
          variation: 0.42
        }
      };
      let movingRequest = null;
      let hoverRequest = null;
      let hoverTarget = null;
      let hoverPrevious = null;
      let movingPrevious = null;
      let movingLastDraw = null;
      let pixelRatio = 1;
      let disposed=false, restoring=false;
      const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
      const paletteRenderer = new LightColumns.PaletteColumnRenderer(
        canvas,
        width,
        height
      );
      const backgroundImageController =
        new LightColumns.imageLayer.ImageController({
          defaultSource: defaultImageSource,
          defaultFilename: defaultImageFilename,
          onChange(snapshot) {
            syncImageControls(snapshot);
            if (controls.backgroundImageEnabled.checked) {
              render();
            }
            if (!restoring) window.LabEmbed?.changed();
          }
        });

      function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
      }

      function wrapHue(value) {
        return ((value % 360) + 360) % 360;
      }

      function color(hue, saturation, lightness, alpha) {
        return `hsla(${wrapHue(hue)}, ${saturation}%, ${lightness}%, ${alpha})`;
      }

      function mulberry32(value) {
        return function random() {
          let result = value += 0x6D2B79F5;

          result = Math.imul(result ^ result >>> 15, result | 1);
          result ^= result + Math.imul(result ^ result >>> 7, result | 61);
          return ((result ^ result >>> 14) >>> 0) / 4294967296;
        };
      }

      function value(name) {
        return Number(controls[name].value);
      }

      function readImageLayerState() {
        const snapshot = backgroundImageController.snapshot();

        return {
          enabled: controls.backgroundImageEnabled.checked,
          image: snapshot.image,
          fit: controls.backgroundImageFit.value,
          positionX: value("backgroundImagePositionX") / 100,
          positionY: value("backgroundImagePositionY") / 100,
          scale: value("backgroundImageScale") / 100,
          opacity: value("backgroundImageOpacity") / 100,
          blendMode: controls.backgroundImageBlend.value,
          overlay: {
            enabled: controls.imageOverlayEnabled.checked,
            color: controls.imageOverlayColor.value,
            opacity: value("imageOverlayOpacity") / 100,
            blendMode: controls.imageOverlayBlend.value
          },
          filters: {
            blur: value("backgroundImageBlur"),
            brightness: value("backgroundImageBrightness"),
            contrast: value("backgroundImageContrast"),
            saturation: value("backgroundImageSaturation"),
            hue: value("backgroundImageHue"),
            grayscale: value("backgroundImageGrayscale")
          }
        };
      }

      function syncImageControls(
        snapshot = backgroundImageController.snapshot()
      ) {
        const enabled = controls.backgroundImageEnabled.checked;
        const statusLabels = {
          idle: "Waiting for image",
          "awaiting-file": "Select this local image again",
          loading: "Loading image…",
          ready: "Ready",
          error: "Could not load — using background color"
        };

        imageControlsPanel.hidden = !enabled;
        imageOverlayControlsPanel.hidden =
          !enabled || !controls.imageOverlayEnabled.checked;
        controls.backgroundImageEnabled.setAttribute(
          "aria-expanded",
          String(enabled)
        );
        controls.imageOverlayEnabled.setAttribute(
          "aria-expanded",
          String(enabled && controls.imageOverlayEnabled.checked)
        );
        imageFilename.textContent = snapshot.filename || "No image";
        imageStatus.textContent = enabled
          ? statusLabels[snapshot.status]
          : "Off — current poster unchanged";
      }

      function currentSettingsDocument() {
        const imageSnapshot = backgroundImageController.snapshot();

        return LightColumns.settingsIO.createDocument({
          controls: LightColumns.settingsIO.serializeControls(controls),
          paletteColors: paletteInputs.map((input) => input.value),
          paletteCounts,
          image: {
            kind: imageSnapshot.usingDefault ? "default" : "local",
            filename: imageSnapshot.filename
          }
        });
      }

      async function applyImportedSettings(settings, preparedImage) {
        stopHoverAnimation();
        controls.paletteCount.max=settings.controls.paletteSource==='generated'?'16':'8';
        const applyResult = LightColumns.settingsIO.applyControlValues(
          controls,
          settings.controls
        );

        settings.palette.manualColors.forEach((colorValue, index) => {
          if (colorValue && paletteInputs[index]) {
            paletteInputs[index].value = colorValue;
          }
        });

        paletteCounts.manual = clamp(
          Math.round(settings.palette.counts.manual),
          2,
          8
        );
        paletteCounts.generated = clamp(
          Math.round(settings.palette.counts.generated),
          2,
          16
        );
        activePaletteSource = controls.paletteSource.value;
        controls.paletteCount.max = activePaletteSource === "manual"
          ? "8"
          : "16";
        controls.paletteCount.value = String(clamp(
          Math.round(value("paletteCount")),
          2,
          Number(controls.paletteCount.max)
        ));
        paletteCounts[activePaletteSource] = Math.round(
          value("paletteCount")
        );

        refreshGeneratedPalette();
        syncPaletteSwatches();
        syncPaletteSourceControls();
        syncConditionalControls();
        syncEventCopy();
        syncTextEffects();

        if (preparedImage) {
          backgroundImageController.adoptPrepared(preparedImage);
          render();
          return {...applyResult,localImageRequired:false,imageFailed:false};
        }

        if (settings.image.kind === "local") {
          backgroundImageController.clearForSelection(
            settings.image.filename || "Local image"
          );
          render();
          return { ...applyResult, localImageRequired: true };
        }

        const imageLoaded = await backgroundImageController.loadDefault();

        render();
        return {
          ...applyResult,
          localImageRequired: false,
          imageFailed: !imageLoaded
        };
      }

      function readState() {
        return {
          aesthetic: controls.aesthetic.value,
          columns: Math.round(value("columns")),
          blur: value("blur"),
          bloom: value("bloom"),
          fade: value("fade") / 100,
          transition: value("transition") / 100,
          hue: value("hue"),
          spread: value("spread"),
          warmth: value("warmth"),
          variation: value("variation"),
          staggeredReach: value("staggeredReach") / 100,
          staggeredHeightVariation:
            value("staggeredHeightVariation") / 100,
          staggeredSoftness: value("staggeredSoftness"),
          staggeredOpacity: value("staggeredOpacity"),
          staggeredSequence: controls.staggeredSequence.value
        };
      }

      function readGeneratedPaletteSettings() {
        return {
          type: controls.paletteType.value,
          count: Math.round(value("paletteCount")),
          baseHue: value("baseHue"),
          variability: value("paletteVariability"),
          seed: Math.round(value("paletteSeed"))
        };
      }

      function syncGeneratedPaletteSwatches() {
        generatedPaletteSwatches.forEach((swatch, index) => {
          const swatchColor = generatedPaletteColors[index];

          swatch.hidden = !swatchColor;
          if (swatchColor) {
            swatch.style.setProperty("--swatch-color", swatchColor);
            swatch.title = swatchColor.toUpperCase();
            swatch.setAttribute(
              "aria-label",
              `Generated color ${index + 1}: ${swatchColor}`
            );
          }
        });
      }

      function refreshGeneratedPalette() {
        generatedPaletteColors = LightColumns.palette.generate(
          readGeneratedPaletteSettings()
        );
        syncGeneratedPaletteSwatches();
      }

      function activePaletteColors() {
        const colorCount = Math.round(value("paletteCount"));

        if (controls.paletteSource.value === "generated") {
          return generatedPaletteColors.slice(0, colorCount);
        }

        return paletteInputs
          .slice(0, colorCount)
          .map((input) => input.value);
      }

      function readPaletteState() {
        return {
          aesthetic: controls.aesthetic.value,
          geometryFamily: controls.geometryFamily.value,
          geometryEnabled: controls.lightGeometryEnabled.checked,
          moving: readMovingSettings(),
          triangle: { size: value("triangleSize") / 100, x: value("triangleX") / 100,
            y: value("triangleY") / 100, angle: value("triangleAngle") },
          nested: {
            shape: controls.nestedShape.value, count: value("nestedCount"),
            scale: value("nestedScale") / 100, ratio: value("nestedRatio") / 100,
            ratioChange: value("nestedRatioChange") / 100,
            offsetX: value("nestedOffsetX") / 100, offsetY: value("nestedOffsetY") / 100
          },
          columns: Math.round(value("columns")),
          seed: Math.round(value("seed")),
          background: controls.backgroundColor.value,
          imageLayer: readImageLayerState(),
          geometry: {
            reach: value("columnReach") / 100,
            heightVariation: value("heightVariation") / 100,
            pattern: controls.heightPattern.value,
            shape: controls.columnShape.value,
            gap: value("columnGap") / 100
          },
          gradient: {
            treatment: controls.gradientTreatment.value,
            flow: controls.gradientFlow.value,
            continuity: controls.gradientContinuity.value,
            angularWrap: controls.angularWrap.value
          },
          radial: {
            centerX: value("centerX") / 100,
            centerY: value("centerY") / 100,
            ellipseRatio: value("ellipseRatio") / 100,
            ringCount: Math.round(value("ringCount")),
            innerRadius: value("innerRadius") / 100,
            ringThickness: value("ringThickness") / 100,
            ringGap: value("ringGap"),
            radialOffset: value("radialOffset") / 100,
            ringPhase: value("ringPhase") / 100,
            ringVariation: controls.ringVariation.value,
            ringVariationAmount: value("ringVariationAmount") / 100,
            sectorCount: Math.round(value("sectorCount")),
            rotation: value("sectorRotation"),
            innerOpening: value("innerOpening") / 100,
            angularGap: value("angularGap"),
            sectorDirection: controls.sectorDirection.value,
            sectorVariation: controls.sectorVariation.value,
            mirrorSymmetry: controls.mirrorSymmetry.checked,
            polarMapping: controls.polarMapping.value,
            polarAssignment: controls.polarAssignment.value
          },
          palette: {
            colors: activePaletteColors(),
            interpolation: controls.paletteInterpolation.value,
            mappingSpace: controls.mappingSpace.value,
            reverse: controls.paletteDirection.value === "up",
            offset: value("paletteOffset") / 100,
            span: value("paletteSpan") / 100,
            overflow: controls.paletteOverflow.value
          },
          mask: {
            softness: value("columnSoftness"),
            opacity: value("columnOpacity")
          },
          light: {
            glow: value("columnGlow"),
            blendMode: controls.columnBlend.value
          },
          style: {
            blur: value("blur"),
            bloom: value("bloom"),
            staggeredOpacity: value("staggeredOpacity"),
            staggeredHeightVariation:
              value("staggeredHeightVariation") / 100,
            staggeredSequence: controls.staggeredSequence.value
          },
          variation: {
            phaseStep: value("phaseStep") / 100,
            phaseJitter: value("phaseJitter") / 100,
            brightness: value("brightnessVariation"),
            opacity: value("opacityVariation") / 100
          }
        };
      }

      function syncPaletteSwatches() {
        const count = Math.round(value("paletteCount"));

        paletteSwatches.forEach((swatch, index) => {
          swatch.hidden = index >= Math.min(count, 8);
        });
      }

      function syncPaletteSourceControls() {
        const source = controls.paletteSource.value;
        const fixedType = LightColumns.palette.isFixedType(
          controls.paletteType.value
        );

        controls.paletteCount.max = source === "manual" ? "8" : "16";
        paletteSourcePanels.forEach((panel) => {
          panel.hidden = panel.dataset.paletteSourceOnly !== source;
        });
        document.querySelector("[data-base-hue-control]").hidden =
          source !== "generated" || fixedType;
        controls.baseHue.disabled = source !== "generated" || fixedType;
      }

      function switchPaletteSource() {
        const nextSource = controls.paletteSource.value;

        paletteCounts[activePaletteSource] = Math.round(
          value("paletteCount")
        );
        activePaletteSource = nextSource;
        controls.paletteCount.max = nextSource === "manual" ? "8" : "16";
        controls.paletteCount.value = String(paletteCounts[nextSource]);
        syncPaletteSourceControls();
        syncPaletteSwatches();
        if (nextSource === "generated") {
          refreshGeneratedPalette();
        }
        render();
      }

      function readMovingSettings() {
        return { count: value("movingCount"), breathing: value("movingBreathing") / 100,
          time: value("movingTime"), seed: value("seed") };
      }

      function movingActive() {
        return !isGraphicBackground() && controls.geometryFamily.value === "moving" &&
          controls.movingAnimated.checked && controls.lightGeometryEnabled.checked && motionAllowed();
      }
      function motionAllowed(){return !disposed && !restoring && !document.hidden &&
        (window.LabEmbed?window.LabEmbed.motionAllowed:!reducedMotion?.matches);}
      function syncMotion(){syncMovingAnimation();if(!hoverBackgroundActive())stopHoverAnimation();}
      reducedMotion?.addEventListener('change',syncMotion);

      function syncMovingAnimation() {
        if (movingActive()) {
          if (movingRequest === null) movingRequest = requestAnimationFrame(animateMoving);
        } else {
          if (movingRequest !== null) cancelAnimationFrame(movingRequest);
          movingRequest = null;
          movingPrevious = null;
          movingLastDraw = null;
        }
      }

      function animateMoving(now) {
        movingRequest = null;
        if (!movingActive()) { syncMovingAnimation(); return; }
        if (movingPrevious !== null) {
          controls.movingTime.value = String(value("movingTime") +
            Math.min(0.1, (now - movingPrevious) / 1000) * value("movingSpeed") / 100);
        }
        movingPrevious = now;
        // Limit raster work; keep the clock independent of drawing frequency.
        if (movingLastDraw === null || now - movingLastDraw >= 1000 / 24) {
          movingLastDraw = now;
          render();
        }
        syncMovingAnimation();
      }

      function isGraphicBackground() {
        return ["split", "triangle"].includes(controls.aesthetic.value);
      }

      function hoverBackgroundActive() {
        return isGraphicBackground() && controls[`${controls.aesthetic.value}Hover`].checked && motionAllowed();
      }

      function stopHoverAnimation() {
        if (hoverRequest !== null) cancelAnimationFrame(hoverRequest);
        hoverRequest = null;
        hoverPrevious = null;
        hoverTarget = null;
      }

      function animateHoverBackground(now) {
        hoverRequest = null;
        if (!hoverBackgroundActive() || hoverTarget === null) { stopHoverAnimation(); return; }
        const dt = hoverPrevious === null ? 1 / 60 : Math.min(0.1, (now - hoverPrevious) / 1000);
        hoverPrevious = now;
        const angleName = `${controls.aesthetic.value}Angle`;
        const delta = LightColumns.splitBackground.angleDelta(value(angleName), hoverTarget);
        const smoothing = value(`${controls.aesthetic.value}Smoothing`);
        const amount = smoothing === 0 ? 1 : 1 - Math.exp(-dt / (0.03 + smoothing * 0.006));
        const next = Math.abs(delta) < 0.05 ? hoverTarget : value(angleName) + delta * amount;
        controls[angleName].value = String(LightColumns.splitBackground.normalizeAngle(next));
        render();
        if (Math.abs(LightColumns.splitBackground.angleDelta(value(angleName), hoverTarget)) > 0.01) {
          hoverRequest = requestAnimationFrame(animateHoverBackground);
        } else {
          hoverPrevious = null;
        }
      }

      poster.addEventListener("pointermove", event => {
        if (!hoverBackgroundActive()) return;
        const bounds = poster.getBoundingClientRect();
        const triangle = controls.aesthetic.value === "triangle";
        const cx = triangle ? value("triangleX") / 100 : 0.5;
        const cy = triangle ? value("triangleY") / 100 : 0.5;
        const dx = event.clientX - bounds.left - bounds.width * cx;
        const dy = event.clientY - bounds.top - bounds.height * cy;
        // A small dead zone avoids unstable angles at the pivot.
        if (Math.hypot(dx, dy) < 12) return;
        hoverTarget = LightColumns.splitBackground.normalizeAngle(Math.atan2(dy, dx) * 180 / Math.PI);
        if (hoverRequest === null) hoverRequest = requestAnimationFrame(animateHoverBackground);
      });
      poster.addEventListener("pointerleave", stopHoverAnimation);
      poster.addEventListener("pointercancel", stopHoverAnimation);

      function syncOutputs() {
        outputs.triangleAngle.value = `${value("triangleAngle").toFixed(1)}°`;
        for (const name of ["triangleSize", "triangleX", "triangleY", "triangleSmoothing"]) {
          outputs[name].value = `${controls[name].value}%`;
        }
        outputs.splitAngle.value = `${value("splitAngle").toFixed(1)}°`;
        outputs.splitOffset.value = `${controls.splitOffset.value}%`;
        outputs.splitSmoothing.value = `${controls.splitSmoothing.value}%`;
        outputs.nestedCount.value = `${controls.nestedCount.value}`;
        outputs.nestedScale.value = `${controls.nestedScale.value}%`;
        outputs.nestedRatio.value = `${controls.nestedRatio.value}%`;
        outputs.nestedRatioChange.value = `${controls.nestedRatioChange.value} pp`;
        outputs.nestedOffsetX.value = `${controls.nestedOffsetX.value}%`;
        outputs.nestedOffsetY.value = `${controls.nestedOffsetY.value}%`;

        outputs.movingCount.value = controls.movingCount.value;
        outputs.movingBreathing.value = `${controls.movingBreathing.value}%`;
        outputs.movingSpeed.value = `${controls.movingSpeed.value}%`;
        outputs.columns.value = controls.columns.value;
        outputs.centerX.value = `${controls.centerX.value}%`;
        outputs.centerY.value = `${controls.centerY.value}%`;
        outputs.ellipseRatio.value = value("ellipseRatio").toFixed(2);
        outputs.ringCount.value = controls.ringCount.value;
        outputs.innerRadius.value = `${controls.innerRadius.value}%`;
        outputs.ringThickness.value = `${controls.ringThickness.value}%`;
        outputs.ringGap.value = `${controls.ringGap.value} px`;
        outputs.radialOffset.value = `${controls.radialOffset.value}%`;
        outputs.ringPhase.value = `${controls.ringPhase.value}%`;
        outputs.ringVariationAmount.value =
          `${controls.ringVariationAmount.value}%`;
        outputs.sectorCount.value = controls.sectorCount.value;
        outputs.sectorRotation.value = `${controls.sectorRotation.value}°`;
        outputs.innerOpening.value = `${controls.innerOpening.value}%`;
        outputs.angularGap.value = `${controls.angularGap.value}°`;
        outputs.columnReach.value = `${controls.columnReach.value}%`;
        outputs.heightVariation.value =
          `${controls.heightVariation.value}%`;
        outputs.columnGap.value = `${controls.columnGap.value}%`;
        outputs.paletteCount.value = controls.paletteCount.value;
        outputs.baseHue.value = `${controls.baseHue.value}°`;
        outputs.paletteVariability.value =
          `${controls.paletteVariability.value}%`;
        outputs.paletteOffset.value = `${controls.paletteOffset.value}%`;
        outputs.paletteSpan.value = `${controls.paletteSpan.value}%`;
        outputs.columnSoftness.value =
          `${controls.columnSoftness.value} px`;
        outputs.columnOpacity.value = value("columnOpacity").toFixed(2);
        outputs.columnGlow.value = `${controls.columnGlow.value} px`;
        outputs.phaseStep.value = `${controls.phaseStep.value}%`;
        outputs.phaseJitter.value = `${controls.phaseJitter.value}%`;
        outputs.brightnessVariation.value =
          `${controls.brightnessVariation.value}%`;
        outputs.opacityVariation.value =
          `${controls.opacityVariation.value}%`;
        outputs.blur.value = controls.blur.value;
        outputs.bloom.value = value("bloom").toFixed(2);
        outputs.fade.value = `${controls.fade.value}%`;
        outputs.transition.value = `${controls.transition.value}%`;
        outputs.hue.value = `${controls.hue.value}°`;
        outputs.spread.value = `${controls.spread.value}°`;
        outputs.warmth.value = value("warmth").toFixed(2);
        outputs.variation.value = value("variation").toFixed(2);
        outputs.staggeredReach.value =
          `${controls.staggeredReach.value}%`;
        outputs.staggeredHeightVariation.value =
          `${controls.staggeredHeightVariation.value}%`;
        outputs.staggeredSoftness.value =
          `${controls.staggeredSoftness.value} px`;
        outputs.staggeredOpacity.value =
          value("staggeredOpacity").toFixed(2);
        outputs.backgroundImagePositionX.value =
          `${controls.backgroundImagePositionX.value}%`;
        outputs.backgroundImagePositionY.value =
          `${controls.backgroundImagePositionY.value}%`;
        outputs.backgroundImageScale.value =
          `${controls.backgroundImageScale.value}%`;
        outputs.backgroundImageOpacity.value =
          `${controls.backgroundImageOpacity.value}%`;
        outputs.imageOverlayOpacity.value =
          `${controls.imageOverlayOpacity.value}%`;
        outputs.backgroundImageBlur.value =
          `${controls.backgroundImageBlur.value} px`;
        outputs.backgroundImageBrightness.value =
          `${controls.backgroundImageBrightness.value}%`;
        outputs.backgroundImageContrast.value =
          `${controls.backgroundImageContrast.value}%`;
        outputs.backgroundImageSaturation.value =
          `${controls.backgroundImageSaturation.value}%`;
        outputs.backgroundImageHue.value =
          `${controls.backgroundImageHue.value}°`;
        outputs.backgroundImageGrayscale.value =
          `${controls.backgroundImageGrayscale.value}%`;
      }

      const posterText=PosterText.create({poster,wordmark,eventCopy,root:document.querySelector('#text-controls')});
      const {syncEventCopy,syncCopyTypography,syncTextEffects}=posterText;
      Object.assign(controls,posterText.controls);

      function syncConditionalControls() {
        const aesthetic = controls.aesthetic.value;
        const geometryFamily = controls.geometryFamily.value;
        const treatment = controls.gradientTreatment.value;
        const continuity = controls.gradientContinuity.value;
        const resolvedFlow = LightColumns.gradientMapping.resolveFlow(
          geometryFamily,
          controls.gradientFlow.value,
          controls.polarMapping.value
        );

        conditionalPanels.forEach((panel) => {
          if (panel.hasAttribute("data-show-for-triangle")) {
            panel.hidden = aesthetic !== "triangle" &&
              (isGraphicBackground() || geometryFamily !== "triangle");
            return;
          }
          if (isGraphicBackground()) {
            panel.hidden = panel.dataset.aestheticOnly !== aesthetic;
            return;
          }
          const supportedAesthetics = panel.dataset.aestheticOnly
            ? panel.dataset.aestheticOnly.split(" ")
            : null;
          const supportedGeometries = panel.dataset.geometryOnly
            ? panel.dataset.geometryOnly.split(" ")
            : null;
          const supportedTreatments = panel.dataset.gradientOnly
            ? panel.dataset.gradientOnly.split(" ")
            : null;
          const supportedContinuities = panel.dataset.continuityOnly
            ? panel.dataset.continuityOnly.split(" ")
            : null;
          const radialOverride = panel.hasAttribute(
            "data-show-for-radial"
          ) && !["columns", "moving"].includes(geometryFamily);
          const aestheticMatches = !supportedAesthetics ||
            supportedAesthetics.includes(aesthetic) || radialOverride;
          const geometryMatches = !supportedGeometries ||
            supportedGeometries.includes(geometryFamily);
          const treatmentMatches = !supportedTreatments ||
            supportedTreatments.includes(treatment);
          const continuityMatches = !supportedContinuities ||
            supportedContinuities.includes(continuity);
          const flowMatches = !panel.dataset.flowComponent ||
            (
              panel.dataset.flowComponent === "angular" &&
              LightColumns.gradientMapping.hasAngularComponent(resolvedFlow)
            );
          const polarMappingMatches = !panel.hasAttribute(
            "data-polar-mapping-control"
          ) || treatment === "solid" ||
            controls.gradientFlow.value === "along";
          const shapePhaseMatches = !panel.hasAttribute(
            "data-shape-phase-control"
          ) || treatment === "solid" || continuity === "phase";
          const mappingSpaceMatches = !panel.hasAttribute(
            "data-mapping-space-control"
          ) || continuity === "continuous" ||
            (geometryFamily === "columns" && continuity === "phase");

          panel.hidden = !(
            aestheticMatches &&
            geometryMatches &&
            treatmentMatches &&
            continuityMatches &&
            flowMatches &&
            polarMappingMatches &&
            shapePhaseMatches &&
            mappingSpaceMatches
          );
        });

        document.querySelector("#softness-label").textContent =
          geometryFamily === "columns"
            ? "Top-fade softness"
            : "Edge softness";
        document.querySelector("#opacity-label").textContent =
          geometryFamily === "columns" ? "Column opacity" : "Shape opacity";
        document.querySelector("#phase-step-label").textContent =
          geometryFamily === "columns" ? "Per-column phase" :
            geometryFamily === "sectors" ? "Per-sector phase" :
              "Per-cell phase";
        document.querySelector("#palette-direction-label").textContent =
          geometryFamily === "columns" ? "Direction" : "Palette order";
        document.querySelector("#palette-direction-forward").textContent =
          geometryFamily === "columns" ? "Top to bottom" : "Forward";
        document.querySelector("#palette-direction-reverse").textContent =
          geometryFamily === "columns" ? "Bottom to top" : "Reverse";
      }

      function resizeCanvas() {
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const bounds=poster.getBoundingClientRect();
        if(bounds.width>0&&bounds.height>0) height=width*bounds.height/bounds.width;
        paletteRenderer.resize(pixelRatio,width,height);
      }

      function captureCanvasAtScale(exportRatio) {
        const previousRatio = pixelRatio;

        pixelRatio = exportRatio;
        paletteRenderer.resize(pixelRatio);
        try {
          render();
          return canvas.toDataURL("image/png");
        } catch (error) {
          if (error && error.name === "SecurityError") {
            throw new Error(
              "The active image blocked export. Select it through the " +
              "Local image control and try again."
            );
          }
          throw error;
        } finally {
          pixelRatio = previousRatio;
          paletteRenderer.resize(pixelRatio);
          render();
        }
      }

      function syncExportStatus() {
        const output = LightColumns.pngExport.dimensions(
          width,
          height,
          exportScale.value
        );

        exportStatus.textContent =
          `Ready to export ${output.width} × ${output.height} px.`;
      }

      async function exportPosterPng() {
        const scale = LightColumns.pngExport.normalizeScale(
          exportScale.value
        );
        const imageSnapshot = backgroundImageController.snapshot();

        if (
          !isGraphicBackground() &&
          controls.backgroundImageEnabled.checked &&
          imageSnapshot.status === "loading"
        ) {
          exportStatus.textContent =
            "Wait for the background image to finish loading.";
          return;
        }

        exportButton.disabled = true;
        exportStatus.textContent = "Preparing high-resolution PNG…";
        try {
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }
          syncCopyTypography();

          const backgroundDataUrl = captureCanvasAtScale(scale);
          const filename = [
            "be-art",
            isGraphicBackground() ? "two-color" : controls.geometryFamily.value,
            controls.aesthetic.value,
            controls.seed.value,
            `${scale}x`
          ].join("-");
          const output = await LightColumns.pngExport.exportPng({
            element: poster,
            backgroundDataUrl,
            width,
            height,
            scale,
            sourceCss: document.querySelector("style").textContent,
            filename
          });

          exportStatus.textContent =
            `Exported ${output.width} × ${output.height} px PNG.`;
        } catch (error) {
          exportStatus.textContent = error.message ||
            "The PNG could not be exported.";
        } finally {
          exportButton.disabled = false;
        }
      }

      function addStops(gradient, stops) {
        stops.forEach((stop) => {
          gradient.addColorStop(stop[0], stop[1]);
        });
      }

      function drawEllipticalField(settings) {
        context.save();
        context.translate(settings.x, settings.y);
        context.scale(settings.radiusX, settings.radiusY);

        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);

        addStops(gradient, settings.stops);
        context.fillStyle = gradient;
        context.fillRect(-1.35, -1.35, 2.7, 2.7);
        context.restore();
      }

      function drawBlendedColumn(index, state, random, wholeRegion = false) {
        const columnWidth = wholeRegion ? width : width / state.columns;
        const x = wholeRegion ? 0 : index * columnWidth;
        const r1 = random();
        const r2 = random();
        const r3 = random();
        const r4 = random();
        const localShift = state.hue +
          (r2 - 0.5) * state.spread * 2 * state.variation +
          (index - (state.columns - 1) / 2) * state.spread /
            Math.max(1, state.columns - 1);
        const coolHue = 240 + localShift;
        const violetHue = 268 + localShift;
        const warmHue = 22 + localShift * 0.22;
        const warmSaturation = 70 + 18 * state.warmth;
        const warmLightness = 72 - 14 * state.warmth;
        const paleEnd = clamp(state.fade, -0.4, 0.7);
        const blueStart = clamp(
          state.transition - 0.12,
          Math.max(0.03, paleEnd + 0.03),
          0.76
        );
        const violetStart = clamp(
          state.transition + 0.12,
          blueStart + 0.03,
          0.9
        );
        const base = context.createLinearGradient(0, 0, 0, height);
        const baseStops = [];

        if (paleEnd > 0) {
          baseStops.push(
            [0, color(coolHue, 22, 95, 1)],
            [paleEnd, color(coolHue, 48, 84, 0.94)]
          );
        } else if (paleEnd === 0) {
          baseStops.push([0, color(coolHue, 48, 84, 0.94)]);
        } else {
          const visibleAmount = clamp(
            -paleEnd / (blueStart - paleEnd),
            0,
            1
          );

          baseStops.push([0, color(
            coolHue,
            48 + (92 - 48) * visibleAmount,
            84 + (59 - 84) * visibleAmount,
            0.94 + (1 - 0.94) * visibleAmount
          )]);
        }

        baseStops.push(
          [blueStart, color(coolHue, 92, 59, 1)],
          [violetStart, color(violetHue, 84, 60, 1)],
          [1, color(warmHue, warmSaturation, warmLightness, 0.98)]
        );
        addStops(base, baseStops);

        context.save();
        context.beginPath();
        context.rect(x, 0, columnWidth + 0.5, height);
        context.clip();
        context.fillStyle = base;
        context.fillRect(x, 0, columnWidth + 0.5, height);
        context.globalAlpha = state.bloom;
        context.filter = `blur(${state.blur * (0.82 + r3 * 0.28)}px)`;

        drawEllipticalField({
          x: x + columnWidth * (0.25 + 0.5 * r2),
          y: height * (0.76 + 0.06 * r3),
          radiusX: Math.max(columnWidth * 1.05, 85),
          radiusY: height * 0.42,
          stops: [
            [0, color(warmHue, 94, 69, 0.92)],
            [0.45, color(330 + localShift * 0.15, 80, 70, 0.48)],
            [1, color(violetHue, 80, 55, 0)]
          ]
        });

        drawEllipticalField({
          x: x + columnWidth * (0.6 - 0.34 * r1),
          y: height * (0.48 + 0.07 * r4),
          radiusX: Math.max(columnWidth * 0.95, 76),
          radiusY: height * 0.37,
          stops: [
            [0, color(205 + localShift * 0.35, 96, 67, 0.84)],
            [0.45, color(244 + localShift, 92, 59, 0.38)],
            [1, color(coolHue, 95, 55, 0)]
          ]
        });

        context.restore();
      }

      function interpolateHue(start, end, amount) {
        const distance = ((end - start + 540) % 360) - 180;

        return wrapHue(start + distance * amount);
      }

      function sampleSpectrum(anchors, position) {
        const safePosition = clamp(position, 0, 1);
        let start = anchors[0];
        let end = anchors[anchors.length - 1];

        for (let index = 0; index < anchors.length - 1; index += 1) {
          if (safePosition <= anchors[index + 1].position) {
            start = anchors[index];
            end = anchors[index + 1];
            break;
          }
        }

        const span = Math.max(0.0001, end.position - start.position);
        const amount = clamp(
          (safePosition - start.position) / span,
          0,
          1
        );

        return {
          hue: interpolateHue(start.hue, end.hue, amount),
          saturation: start.saturation +
            (end.saturation - start.saturation) * amount,
          lightness: start.lightness +
            (end.lightness - start.lightness) * amount
        };
      }

      function staggeredProfile(index, state, randomValue) {
        const progress = index / Math.max(1, state.columns - 1);

        switch (state.staggeredSequence) {
          case "alternating":
            return clamp(
              (index % 2 === 0 ? -0.82 : 0.82) +
                (randomValue - 0.5) * 0.28,
              -1,
              1
            );
          case "wave":
            return clamp(
              Math.sin(progress * Math.PI * 2 - Math.PI / 2) * 0.88 +
                (randomValue - 0.5) * 0.22,
              -1,
              1
            );
          case "ascending":
            return progress * 2 - 1;
          default:
            return randomValue * 2 - 1;
        }
      }

      function drawStaggeredColumn(index, state, random, wholeRegion = false) {
        const columnWidth = wholeRegion ? width : width / state.columns;
        const x = wholeRegion ? 0 : index * columnWidth;
        const heightNoise = random();
        const hueNoise = random();
        const opacityNoise = random();
        random();

        const localShift = state.hue +
          (hueNoise - 0.5) * state.spread * 2 * state.variation +
          (index - (state.columns - 1) / 2) * state.spread /
            Math.max(1, state.columns - 1);
        const profile = staggeredProfile(index, state, heightNoise);
        const top = clamp(
          1 - state.staggeredReach +
            profile * state.staggeredHeightVariation * 0.36,
          -0.65,
          0.86
        );
        const fadeSize = state.staggeredSoftness / height;
        const fadeEnd = clamp(top + fadeSize, top, 1);
        const localOpacity = clamp(
          state.staggeredOpacity * (
            1 + (opacityNoise - 0.5) * 0.16 * state.variation
          ),
          0,
          1
        );
        const warmHue = 28 + localShift * 0.2;
        const anchors = [
          {
            position: 0,
            hue: 220 + localShift * 0.2,
            saturation: 18,
            lightness: 96
          },
          {
            position: 0.25,
            hue: 228 + localShift * 0.5,
            saturation: 50,
            lightness: 84
          },
          {
            position: 0.48,
            hue: 240 + localShift,
            saturation: 92,
            lightness: 58
          },
          {
            position: 0.68,
            hue: 270 + localShift,
            saturation: 84,
            lightness: 61
          },
          {
            position: 0.84,
            hue: 326 + localShift * 0.32,
            saturation: 80,
            lightness: 70
          },
          {
            position: 1,
            hue: warmHue,
            saturation: 72 + 22 * state.warmth,
            lightness: 72 - 14 * state.warmth
          }
        ];
        const positions = anchors.map((anchor) => anchor.position);
        const rampSteps = state.staggeredSoftness === 0
          ? [top, Math.min(1, top + 0.0001)]
          : [0, 0.25, 0.5, 0.75, 1].map((amount) => {
              return top + (fadeEnd - top) * amount;
            });

        positions.push(...rampSteps);

        const uniquePositions = Array.from(new Set(positions.map((position) => {
          return clamp(position, 0, 1).toFixed(6);
        }))).map(Number).sort((first, second) => first - second);
        const gradient = context.createLinearGradient(0, 0, 0, height);

        uniquePositions.forEach((position) => {
          const spectrum = sampleSpectrum(anchors, position);
          let alpha;

          if (state.staggeredSoftness === 0) {
            alpha = position <= top ? 0 : localOpacity;
          } else {
            const amount = clamp(
              (position - top) / Math.max(0.0001, fadeEnd - top),
              0,
              1
            );
            const softened = amount * amount * (3 - 2 * amount);

            alpha = localOpacity * softened;
          }

          gradient.addColorStop(position, color(
            spectrum.hue,
            spectrum.saturation,
            spectrum.lightness,
            alpha
          ));
        });

        context.fillStyle = gradient;
        context.fillRect(x, 0, columnWidth + 0.75, height);
      }

      function render() {
        if(disposed)return;
        syncOutputs();
        syncMovingAnimation();
        if (!hoverBackgroundActive()) stopHoverAnimation();

        if (isGraphicBackground()) {
          context.save();
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          context.globalAlpha = 1;
          context.globalCompositeOperation = "source-over";
          context.filter = "none";
          if (controls.aesthetic.value === "triangle") {
            LightColumns.triangleBackground.draw(context, width, height, {
              color: controls.triangleColor.value, background: controls.triangleBackground.value,
              size: value("triangleSize") / 100, x: value("triangleX") / 100,
              y: value("triangleY") / 100, angle: value("triangleAngle")
            });
          } else {
            LightColumns.splitBackground.draw(context, width, height, {
              colorA: controls.splitColorA.value, colorB: controls.splitColorB.value,
              angle: value("splitAngle"), offset: value("splitOffset") / 100
            });
          }
          context.restore();
          return;
        }

        if (
          controls.aesthetic.value === "palette" ||
          !["columns", "moving"].includes(controls.geometryFamily.value)
        ) {
          paletteRenderer.render(readPaletteState());
          return;
        }

        const state = readState();
        const random = mulberry32(Math.round(value("seed")));

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#eef0f4";
        context.fillRect(0, 0, width, height);
        const imageLayerState = readImageLayerState();

        const imageDrawn = LightColumns.imageLayer.draw(
          context,
          imageLayerState.image,
          width,
          height,
          imageLayerState
        );
        if (imageDrawn) {
          LightColumns.imageLayer.drawOverlay(
            context,
            width,
            height,
            imageLayerState.overlay
          );
        }

        if (!controls.lightGeometryEnabled.checked) {
          return;
        }

        if (controls.geometryFamily.value === "moving") {
          const geometry = LightColumns.movingGeometry.build(readMovingSettings(), width, height);
          state.columns = geometry.shapes.length;
          geometry.shapes.forEach((shape, index) => {
            if (shape.points.length < 3) return;
            const bounds = shape.bounds;
            context.save();
            LightColumns.movingGeometry.trace(context, shape);
            context.clip();
            context.translate(bounds.left, bounds.top);
            context.scale(Math.max(0.001, bounds.right - bounds.left) / width,
              Math.max(0.001, bounds.bottom - bounds.top) / height);
            const regionRandom = mulberry32(Math.round(value("seed")) + index * 7919);
            if (state.aesthetic === "staggered") drawStaggeredColumn(index, state, regionRandom, true);
            else drawBlendedColumn(index, state, regionRandom, true);
            context.restore();
          });
          return;
        }

        for (let index = 0; index < state.columns; index += 1) {
          if (state.aesthetic === "staggered") {
            drawStaggeredColumn(index, state, random);
          } else {
            drawBlendedColumn(index, state, random);
          }
        }
      }

      function applyPreset(name) {
        stopHoverAnimation();
        const preset = presets[name];
        const previousPaletteSource = activePaletteSource;
        const previousPaletteCount = Math.round(value("paletteCount"));

        if (!preset) {
          return;
        }

        if (Array.isArray(preset.paletteColors)) {
          controls.paletteSource.value = "manual";
        }

        Object.entries(preset).forEach(([key, presetValue]) => {
          if (key === "paletteColors") {
            presetValue.forEach((colorValue, index) => {
              paletteInputs[index].value = colorValue;
            });
          } else if (controls[key]) {
            if (controls[key].type === "checkbox") {
              controls[key].checked = Boolean(presetValue);
            } else {
              controls[key].value = String(presetValue);
            }
          }
        });
        paletteCounts[previousPaletteSource] = previousPaletteCount;
        activePaletteSource = controls.paletteSource.value;
        controls.paletteCount.max =
          activePaletteSource === "manual" ? "8" : "16";
        controls.paletteCount.value = String(clamp(
          Math.round(value("paletteCount")),
          2,
          Number(controls.paletteCount.max)
        ));
        paletteCounts[activePaletteSource] = Math.round(
          value("paletteCount")
        );
        syncPaletteSwatches();
        syncPaletteSourceControls();
        if (activePaletteSource === "generated") {
          refreshGeneratedPalette();
        }
        syncConditionalControls();
        render();
      }

      Object.entries(controls).forEach(([name, control]) => {
        if ([
          "aesthetic",
          "splitAngle",
          "triangleAngle",
          "triangleX",
          "triangleY",
          "geometryFamily",
          "paletteSource",
          "paletteCount",
          "paletteType",
          "baseHue",
          "paletteVariability",
          "paletteSeed",
          "preset",
          "eventCopyVariant",
          "manifestoFontSize",
          "manifestoFontWeight",
          "textVerticalAlign",
          "eventTextEffect",
          "eventTextAccent",
          "eventTextOpacity",
          "logoEffect",
          "logoAccent",
          "matchTextAccent",
          "logoEffectStrength",
          "logoEffectBlur",
          "logoEffectHue",
          "logoEffectOpacity",
          "backgroundImageEnabled",
          "lightGeometryEnabled",
          "imageOverlayEnabled",
          "imageOverlayColor",
          "imageOverlayOpacity",
          "imageOverlayBlend",
          "backgroundImageFile",
          "backgroundImageFit",
          "backgroundImagePositionX",
          "backgroundImagePositionY",
          "backgroundImageScale",
          "backgroundImageOpacity",
          "backgroundImageBlend",
          "backgroundImageBlur",
          "backgroundImageBrightness",
          "backgroundImageContrast",
          "backgroundImageSaturation",
          "backgroundImageHue",
          "backgroundImageGrayscale"
        ].includes(name)) {
          return;
        }

        control.addEventListener(
          control.tagName === "SELECT" ? "change" : "input",
          () => {
            if ([
              "gradientTreatment",
              "gradientFlow",
              "gradientContinuity",
              "polarMapping"
            ].includes(name)) {
              syncConditionalControls();
            }
            render();
          }
        );
      });

      paletteInputs.forEach((input) => {
        input.addEventListener("input", render);
      });

      controls.paletteCount.addEventListener("input", () => {
        paletteCounts[activePaletteSource] = Math.round(
          value("paletteCount")
        );
        syncPaletteSwatches();
        if (activePaletteSource === "generated") {
          refreshGeneratedPalette();
        }
        render();
      });

      controls.paletteSource.addEventListener("change", switchPaletteSource);

      controls.paletteType.addEventListener("change", () => {
        syncPaletteSourceControls();
        refreshGeneratedPalette();
        render();
      });

      ["baseHue", "paletteVariability", "paletteSeed"].forEach((name) => {
        controls[name].addEventListener("input", () => {
          refreshGeneratedPalette();
          render();
        });
      });

      document.querySelector("#shuffle-generated-palette").addEventListener(
        "click",
        () => {
          const nextSeed = (
            Math.round(value("paletteSeed")) +
            1 +
            Math.floor(Math.random() * 999999998)
          ) % 999999999;

          controls.paletteSeed.value = String(nextSeed);
          refreshGeneratedPalette();
          render();
        }
      );

      controls.aesthetic.addEventListener("change", () => {
        stopHoverAnimation();
        syncConditionalControls();
        render();
      });

      ["splitAngle", "triangleAngle", "triangleX", "triangleY"].forEach(name => {
        controls[name].addEventListener("input", () => {
          stopHoverAnimation();
          render();
        });
      });

      document.querySelector("#moving-regenerate").addEventListener("click", () => {
        const maximum = Number(controls.seed.max) || 999999;
        controls.seed.value = String((value("seed") + 1) % maximum);
        controls.movingTime.value = "0";
        render();
      });
      document.addEventListener("visibilitychange", syncMovingAnimation);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopHoverAnimation();
      });

      document.querySelector("#nested-color-study").addEventListener("click", () => {
        controls.preset.value = "nestedStudy";
        applyPreset("nestedStudy");
      });

      document.querySelector("#triangle-light-study").addEventListener("click", () => {
        controls.preset.value = "triangleLight";
        applyPreset("triangleLight");
      });

      controls.geometryFamily.addEventListener("change", () => {
        syncConditionalControls();
        render();
      });

      controls.preset.addEventListener("change", () => {
        applyPreset(controls.preset.value);
      });

      controls.eventCopyVariant.addEventListener("change", syncEventCopy);
      ["manifestoFontSize", "manifestoFontWeight"].forEach(name => {
        controls[name].addEventListener("input", syncCopyTypography);
      });

      [
        "textVerticalAlign",
        "eventTextEffect",
        "eventTextAccent",
        "eventTextOpacity",
        "logoEffect",
        "logoAccent",
        "matchTextAccent",
        "logoEffectStrength",
        "logoEffectBlur",
        "logoEffectHue",
        "logoEffectOpacity"
      ].forEach((name) => {
        const control = controls[name];

        control.addEventListener(
          control.tagName === "SELECT" ? "change" : "input",
          syncTextEffects
        );
      });

      document.querySelector("#download-settings").addEventListener(
        "click",
        () => {
          try {
            LightColumns.settingsIO.download(
              currentSettingsDocument(),
              "canvas-light-geometry-settings.json"
            );
            settingsStatus.textContent = "Current settings downloaded.";
          } catch (error) {
            settingsStatus.textContent = "Settings could not be downloaded.";
          }
        }
      );

      settingsFileInput.addEventListener("change", async (event) => {
        const [file] = event.currentTarget.files;

        if (!file) {
          return;
        }

        settingsStatus.textContent = "Loading settings…";
        try {
          const source = await LightColumns.settingsIO.readFile(file);
          const settings = LightColumns.settingsIO.parse(source);
          const result = await applyImportedSettings(settings);

          if (result.localImageRequired) {
            settingsStatus.textContent =
              `Settings loaded. Select ${settings.image.filename ||
                "the local image"} again.`;
          } else if (result.imageFailed) {
            settingsStatus.textContent =
              "Settings loaded; the default image is unavailable.";
          } else if (result.invalid.length > 0) {
            settingsStatus.textContent =
              `Settings loaded; ${result.invalid.length} invalid ` +
              "value(s) kept their previous defaults.";
          } else {
            settingsStatus.textContent = "Settings loaded.";
          }
        } catch (error) {
          settingsStatus.textContent = error.message ||
            "Settings could not be loaded.";
        } finally {
          settingsFileInput.value = "";
        }
      });

      exportScale.addEventListener("change", syncExportStatus);
      exportButton.addEventListener("click", exportPosterPng);

      controls.backgroundImageEnabled.addEventListener("input", () => {
        syncImageControls();
        render();
      });

      controls.lightGeometryEnabled.addEventListener("input", render);
      controls.imageOverlayEnabled.addEventListener("input", () => {
        syncImageControls();
        render();
      });

      [
        "imageOverlayColor",
        "imageOverlayOpacity",
        "imageOverlayBlend",
        "backgroundImageFit",
        "backgroundImagePositionX",
        "backgroundImagePositionY",
        "backgroundImageScale",
        "backgroundImageOpacity",
        "backgroundImageBlend",
        "backgroundImageBlur",
        "backgroundImageBrightness",
        "backgroundImageContrast",
        "backgroundImageSaturation",
        "backgroundImageHue",
        "backgroundImageGrayscale"
      ].forEach((name) => {
        const control = controls[name];

        control.addEventListener(
          control.tagName === "SELECT" ? "change" : "input",
          render
        );
      });

      controls.backgroundImageFile.addEventListener("change", (event) => {
        const [file] = event.currentTarget.files;

        if (file) {
          backgroundImageController.loadFile(file).then((loaded) => {
            settingsStatus.textContent = loaded
              ? `Local image ${file.name} selected.`
              : `Local image ${file.name} could not be loaded.`;
          });
        }
      });

      document.querySelector("#background-image-reset").addEventListener(
        "click",
        () => {
          controls.backgroundImageFile.value = "";
          backgroundImageController.loadDefault();
        }
      );

      document.querySelector("#background-image-filters-reset")
        .addEventListener("click", () => {
          const defaults = LightColumns.imageLayer.defaults.filters;

          controls.backgroundImageBlur.value = String(defaults.blur);
          controls.backgroundImageBrightness.value =
            String(defaults.brightness);
          controls.backgroundImageContrast.value =
            String(defaults.contrast);
          controls.backgroundImageSaturation.value =
            String(defaults.saturation);
          controls.backgroundImageHue.value = String(defaults.hue);
          controls.backgroundImageGrayscale.value =
            String(defaults.grayscale);
          render();
        });

      document.querySelector("#randomize").addEventListener("click", () => {
        controls.seed.value = String(
          Math.floor(Math.random() * 1000000000)
        );
        render();
      });

      function movePalette(direction) {
        const count = Math.round(value("paletteCount"));
        const colors = paletteInputs.slice(0, count).map((input) => {
          return input.value;
        });

        if (direction === "left") {
          colors.push(colors.shift());
        } else if (direction === "right") {
          colors.unshift(colors.pop());
        } else {
          colors.reverse();
        }

        colors.forEach((colorValue, index) => {
          paletteInputs[index].value = colorValue;
        });
        render();
      }

      document.querySelector("#palette-shift-left").addEventListener(
        "click",
        () => movePalette("left")
      );
      document.querySelector("#palette-shift-right").addEventListener(
        "click",
        () => movePalette("right")
      );
      document.querySelector("#palette-reverse").addEventListener(
        "click",
        () => movePalette("reverse")
      );

      window.addEventListener("resize", () => {
        const nextRatio = Math.min(window.devicePixelRatio || 1, 2);

        syncCopyTypography();
        if (nextRatio !== pixelRatio) {
          resizeCanvas();
          render();
        }
      });
      window.addEventListener("beforeunload", () => {
        stopHoverAnimation();
        if (movingRequest !== null) cancelAnimationFrame(movingRequest);
        backgroundImageController.destroy();
      });

      resizeCanvas();
      refreshGeneratedPalette();
      syncPaletteSwatches();
      syncPaletteSourceControls();
      syncConditionalControls();
      syncEventCopy();
      document.fonts?.ready.then(syncCopyTypography);
      document.fonts?.addEventListener("loadingdone", syncCopyTypography);
      if (window.ResizeObserver) {
        const typographyObserver = new ResizeObserver(syncCopyTypography);
        typographyObserver.observe(wordmark);
        typographyObserver.observe(poster);
      }
      syncTextEffects();
      syncImageControls();
      syncExportStatus();
      render();
      // Complete native lab state. The host never interprets the art controls.
      const portableImages=new WeakMap();
      function getState() {
        const settings=currentSettingsDocument();settings.exportedAt='';
        const image=backgroundImageController.snapshot();
        let imageData=null;
        if(!image.usingDefault&&image.image){
          imageData=image.portableSource||portableImages.get(image.image);
          if(!imageData){
            const buffer=document.createElement('canvas');
            buffer.width=image.image.naturalWidth;buffer.height=image.image.naturalHeight;
            buffer.getContext('2d').drawImage(image.image,0,0);
            imageData=buffer.toDataURL('image/png');portableImages.set(image.image,imageData);
          }
        }
        return {settings,imageData};
      }
      function exactKeys(input,expected,label){
        if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==Object.keys(expected).length||Object.keys(expected).some(key=>!Object.hasOwn(input,key)))throw new Error(`Incomplete or unsupported ${label}.`);
      }
      function validateState(input){
        exactKeys(input,{settings:null,imageData:null},'Canvas state');
        const settings=input.settings;
        exactKeys(settings,currentSettingsDocument(),'Canvas settings');
        const parsed=LightColumns.settingsIO.parse(JSON.stringify(settings));
        if(settings.exportedAt!==''||parsed.format!==settings.format||parsed.version!==settings.version)throw new Error('Unsupported native settings format.');
        LightColumns.settingsIO.validateCompleteControls(controls,settings.controls,{
          paletteCount:{max:settings.controls.paletteSource==='generated'?'16':'8'}
        });
        exactKeys(settings.palette,{manualColors:null,counts:null},'palette');
        if(!Array.isArray(settings.palette.manualColors)||settings.palette.manualColors.length!==paletteInputs.length||settings.palette.manualColors.some(color=>!/^#[0-9a-f]{6}$/.test(color)))throw new Error('Invalid manual palette.');
        exactKeys(settings.palette.counts,paletteCounts,'palette counts');
        for(const [key,count] of Object.entries(settings.palette.counts))if(!Number.isInteger(count)||count<2||count>(key==='manual'?8:16))throw new Error('Invalid palette count.');
        if(settings.palette.counts[settings.controls.paletteSource]!==settings.controls.paletteCount)throw new Error('Palette counts disagree.');
        exactKeys(settings.image,{kind:null,filename:null},'image settings');
        if(!['local','default'].includes(settings.image.kind)||typeof settings.image.filename!=='string'||settings.image.filename.length>2000)throw new Error('Invalid image settings.');
        if(settings.image.kind==='default'&&settings.image.filename!==defaultImageFilename)throw new Error('Unknown default image.');
        if(input.imageData!==null && (settings.image.kind!=='local'||typeof input.imageData!=='string'||!/^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(input.imageData)))throw new Error('Invalid embedded image.');
        return JSON.parse(JSON.stringify(input));
      }
      async function setState(input){
        const next=validateState(input),imageSettings=next.settings.image;
        const staged=new LightColumns.imageLayer.ImageController({defaultSource:defaultImageSource,defaultFilename:defaultImageFilename});
        if(imageSettings.kind==='default'){
          if(!await staged.loadDefault())throw new Error('The original background image could not load.');
        }else if(next.imageData){
          if(!await staged.loadSource(next.imageData,imageSettings.filename))throw new Error('The saved image could not be decoded.');
        }else staged.clearForSelection(imageSettings.filename);
        if(disposed){staged.destroy();throw new Error('The lab was closed.');}
        restoring=true;syncMotion();
        try{
          await applyImportedSettings(next.settings,staged.snapshot());
          if(next.imageData)portableImages.set(backgroundImageController.snapshot().image,next.imageData);
        }finally{restoring=false;staged.destroy();}
        syncCopyTypography();render();window.LabEmbed?.changed();
        return getState();
      }
      function resizeEmbedded(){resizeCanvas();syncCopyTypography();render();}
      function renderAt(time){
        if(typeof time!=='number'||!Number.isFinite(time)||time<0)throw new Error('Invalid animation time.');
        controls.movingTime.value=String(time);stopHoverAnimation();render();
      }
      let initialState;
      async function resetState(){return setState(initialState);}
      function dispose(){
        disposed=true;stopHoverAnimation();if(movingRequest!==null)cancelAnimationFrame(movingRequest);
        backgroundImageController.destroy();posterText.dispose();resizeObserver?.disconnect();
        reducedMotion?.removeEventListener('change',syncMotion);
        [paletteRenderer.canvas,paletteRenderer.layer,paletteRenderer.shapeLayer].forEach(surface=>{surface.width=1;surface.height=1;});
      }
      const resizeObserver=window.ResizeObserver?new ResizeObserver(resizeEmbedded):null;
      resizeObserver?.observe(poster);
      window.canvasLight=Object.freeze({getState,validateState,setState,renderAt,resize:resizeEmbedded,reset:resetState,
        applyPreset(name){if(!Object.hasOwn(presets,name))throw new Error('Unknown Canvas preset.');controls.preset.value=name;applyPreset(name);window.LabEmbed?.changed();return getState();},
        render,dispose
      });
      backgroundImageController.loadDefault().then(()=>{
        initialState=getState();
        window.LabEmbed?.register({getState,validateState,setState,reset:resetState,
          validateTextState(native,text){for(const [key,value] of Object.entries(text))if(native.settings.controls[key]!==value)throw new Error(`Native and shared text settings disagree: ${key}.`);},
          applyPreset:window.canvasLight.applyPreset,resize:resizeEmbedded,renderAt,syncMotion,
          isAnimated:()=>controls.geometryFamily.value==='moving'&&controls.movingAnimated.checked||isGraphicBackground()&&controls[`${controls.aesthetic.value}Hover`].checked,
          dispose
        });
      }).catch(error=>window.LabEmbed?.fail(error.message));
    })();
