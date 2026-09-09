(function (app) {
  "use strict";

  let elements = null;

  function collectElements() {
    return {
      svg: document.querySelector("#art"),
      cellsGroup: document.querySelector("#cells"),
      controlsPanel: document.querySelector("#controls-panel"),
      hideControlsButton: document.querySelector("#hide-controls"),
      showControlsButton: document.querySelector("#show-controls"),
      symmetryControl: document.querySelector("#symmetry-mode"),
      geometryTypeControl: document.querySelector("#geometry-type"),
      geometrySpecificGroups: document.querySelectorAll(
        "[data-geometry-only]"
      ),
      renderSpecificGroups: document.querySelectorAll(
        "[data-render-only]"
      ),
      ringCountControl: document.querySelector("#ring-count"),
      ringCountValue: document.querySelector("#ring-count-value"),
      sectorCountControl: document.querySelector("#sector-count"),
      sectorCountValue: document.querySelector("#sector-count-value"),
      polygonSidesControl: document.querySelector("#polygon-sides"),
      polygonSidesValue: document.querySelector("#polygon-sides-value"),
      superellipseRoundnessControl: document.querySelector(
        "#superellipse-roundness"
      ),
      superellipseRoundnessValue: document.querySelector(
        "#superellipse-roundness-value"
      ),
      shapeRotationControl: document.querySelector("#shape-rotation"),
      shapeRotationValue: document.querySelector(
        "#shape-rotation-value"
      ),
      gridRowsControl: document.querySelector("#grid-rows"),
      gridRowsValue: document.querySelector("#grid-rows-value"),
      gridColumnsControl: document.querySelector("#grid-columns"),
      gridColumnsValue: document.querySelector("#grid-columns-value"),
      diagonalBandCountControl: document.querySelector(
        "#diagonal-band-count"
      ),
      diagonalBandCountValue: document.querySelector(
        "#diagonal-band-count-value"
      ),
      diagonalAngleControl: document.querySelector("#diagonal-angle"),
      diagonalAngleValue: document.querySelector(
        "#diagonal-angle-value"
      ),
      diagonalOffsetControl: document.querySelector("#diagonal-offset"),
      diagonalOffsetValue: document.querySelector(
        "#diagonal-offset-value"
      ),
      pinchedColumnsControl: document.querySelector("#pinched-columns"),
      pinchedColumnsValue: document.querySelector(
        "#pinched-columns-value"
      ),
      pinchedCountControl: document.querySelector("#pinched-count"),
      pinchedCountValue: document.querySelector("#pinched-count-value"),
      pinchedDepthControl: document.querySelector("#pinched-depth"),
      pinchedDepthValue: document.querySelector("#pinched-depth-value"),
      pinchedPositionControl: document.querySelector(
        "#pinched-position"
      ),
      pinchedPositionValue: document.querySelector(
        "#pinched-position-value"
      ),
      pinchedSidesControl: document.querySelector("#pinched-sides"),
      pinchedSlantControl: document.querySelector("#pinched-slant"),
      pinchedSlantValue: document.querySelector("#pinched-slant-value"),
      pinchedMotionControl: document.querySelector("#pinched-motion"),
      pinchedMotionValue: document.querySelector("#pinched-motion-value"),
      pinchedSpeedControl: document.querySelector("#pinched-speed"),
      pinchedSpeedValue: document.querySelector("#pinched-speed-value"),
      movingShapeCountControl: document.querySelector("#moving-shape-count"),
      movingShapeCountValue: document.querySelector("#moving-shape-count-value"),
      movingBreathingControl: document.querySelector("#moving-breathing"),
      movingBreathingValue: document.querySelector("#moving-breathing-value"),
      movingSpeedControl: document.querySelector("#moving-speed"),
      movingSpeedValue: document.querySelector("#moving-speed-value"),
      movingRegenerateButton: document.querySelector("#moving-regenerate"),
      rayOriginControl: document.querySelector("#ray-origin"),
      rayCountControl: document.querySelector("#ray-count"),
      rayCountValue: document.querySelector("#ray-count-value"),
      rayMotionControl: document.querySelector("#ray-motion"),
      rayMotionValue: document.querySelector("#ray-motion-value"),
      raySpeedControl: document.querySelector("#ray-speed"),
      raySpeedValue: document.querySelector("#ray-speed-value"),
      gradientTypeControl: document.querySelector("#gradient-type"),
      gradientAngleControl: document.querySelector("#gradient-angle"),
      gradientAngleValue: document.querySelector("#gradient-angle-value"),
      gradientReverseControl: document.querySelector("#gradient-reverse"),
      renderStyleControl: document.querySelector("#render-style"),
      luminousBloomControl: document.querySelector("#luminous-bloom"),
      luminousBloomValue: document.querySelector(
        "#luminous-bloom-value"
      ),
      luminousSoftnessControl: document.querySelector(
        "#luminous-softness"
      ),
      luminousSoftnessValue: document.querySelector(
        "#luminous-softness-value"
      ),
      luminousPaleDepthControl: document.querySelector(
        "#luminous-pale-depth"
      ),
      luminousPaleDepthValue: document.querySelector(
        "#luminous-pale-depth-value"
      ),
      luminousTransitionControl: document.querySelector(
        "#luminous-transition"
      ),
      luminousTransitionValue: document.querySelector(
        "#luminous-transition-value"
      ),
      luminousWarmthControl: document.querySelector(
        "#luminous-warmth"
      ),
      luminousWarmthValue: document.querySelector(
        "#luminous-warmth-value"
      ),
      luminousScaleControl: document.querySelector("#luminous-scale"),
      luminousScaleValue: document.querySelector(
        "#luminous-scale-value"
      ),
      luminousVariationControl: document.querySelector(
        "#luminous-variation"
      ),
      luminousVariationValue: document.querySelector(
        "#luminous-variation-value"
      ),
      luminousMotionControl: document.querySelector("#luminous-motion"),
      luminousMotionValue: document.querySelector(
        "#luminous-motion-value"
      ),
      luminousSpeedControl: document.querySelector("#luminous-speed"),
      luminousSpeedValue: document.querySelector(
        "#luminous-speed-value"
      ),
      randomizeLuminousButton: document.querySelector(
        "#randomize-luminous"
      ),
      animationBox: document.querySelector(".animation-box"),
      framePresetControl: document.querySelector("#frame-preset"),
      frameWidthControl: document.querySelector("#frame-width"),
      frameWidthValue: document.querySelector("#frame-width-value"),
      frameHeightControl: document.querySelector("#frame-height"),
      frameHeightValue: document.querySelector("#frame-height-value"),
      beArtsLogo: document.querySelector("#be-arts-logo"),
      logoGraphic: document.querySelector(".logo-graphic"),
      logoSolid: document.querySelector(".logo-solid"),
      eventCopy: document.querySelector(".event-copy"),
      textContentControl: document.querySelector("#text-content"),
      showLogoControl: document.querySelector("#show-be-arts-logo"),
      showEventCopyControl: document.querySelector("#show-event-copy"),
      eventTextEffectControl: document.querySelector("#event-text-effect"),
      eventTextAccentControl: document.querySelector("#event-text-accent"),
      eventTextAccentValue: document.querySelector(
        "#event-text-accent-value"
      ),
      logoAlignmentControl: document.querySelector("#logo-alignment"),
      logoPaddingControl: document.querySelector("#logo-padding"),
      logoPaddingValue: document.querySelector("#logo-padding-value"),
      logoEffectControl: document.querySelector("#logo-effect"),
      logoAccentControl: document.querySelector("#logo-accent"),
      logoAccentValue: document.querySelector("#logo-accent-value"),
      matchTextAccentControl: document.querySelector("#match-text-accent"),
      logoEffectStrengthControl: document.querySelector(
        "#logo-effect-strength"
      ),
      logoEffectStrengthValue: document.querySelector(
        "#logo-effect-strength-value"
      ),
      logoEffectBlurControl: document.querySelector("#logo-effect-blur"),
      logoEffectBlurValue: document.querySelector(
        "#logo-effect-blur-value"
      ),
      logoEffectHueControl: document.querySelector("#logo-effect-hue"),
      logoEffectHueValue: document.querySelector("#logo-effect-hue-value"),
      logoEffectOpacityControl: document.querySelector(
        "#logo-effect-opacity"
      ),
      logoEffectOpacityValue: document.querySelector(
        "#logo-effect-opacity-value"
      ),
      paletteTypeControl: document.querySelector("#palette-type"),
      baseHueControl: document.querySelector("#base-hue"),
      baseHueValue: document.querySelector("#base-hue-value"),
      colorCountControl: document.querySelector("#color-count"),
      colorCountValue: document.querySelector("#color-count-value"),
      colorVariabilityControl: document.querySelector(
        "#color-variability"
      ),
      colorVariabilityValue: document.querySelector(
        "#color-variability-value"
      ),
      arrangementControl: document.querySelector("#color-arrangement"),
      arrangementRowsOption: document.querySelector(
        '#color-arrangement option[value="rings"]'
      ),
      arrangementColumnsOption: document.querySelector(
        '#color-arrangement option[value="sectors"]'
      ),
      shufflePaletteButton: document.querySelector("#shuffle-palette")
    };
  }

  function hydrateControls() {
    const state = app.state;
    const overlayState = state.overlays;
    const paletteState = state.palette;

    elements.controlsPanel.hidden = !state.controlsVisible;
    elements.showControlsButton.hidden = state.controlsVisible;
    elements.showControlsButton.setAttribute(
      "aria-expanded",
      String(state.controlsVisible)
    );
    elements.symmetryControl.value = state.symmetry;
    elements.geometryTypeControl.value = state.geometry.type;
    elements.ringCountControl.value = state.geometry.ringCount;
    elements.sectorCountControl.value = state.geometry.sectorCount;
    elements.polygonSidesControl.value = state.geometry.polygonSides;
    elements.superellipseRoundnessControl.value =
      state.geometry.superellipseRoundness;
    elements.shapeRotationControl.value = state.geometry.shapeRotation;
    elements.gridRowsControl.value = state.geometry.gridRows;
    elements.gridColumnsControl.value = state.geometry.gridColumns;
    elements.diagonalBandCountControl.value =
      state.geometry.diagonalBandCount;
    elements.diagonalAngleControl.value = state.geometry.diagonalAngle;
    elements.diagonalOffsetControl.value = state.geometry.diagonalOffset;
    elements.pinchedColumnsControl.value = state.geometry.pinchedColumns;
    elements.pinchedCountControl.value = state.geometry.pinchedCount;
    elements.pinchedDepthControl.value = state.geometry.pinchedDepth;
    elements.pinchedPositionControl.value = state.geometry.pinchedPosition;
    elements.pinchedSidesControl.value = state.geometry.pinchedSides;
    elements.pinchedSlantControl.value = state.geometry.pinchedSlant;
    elements.pinchedMotionControl.value = state.geometry.pinchedMotion;
    elements.pinchedSpeedControl.value = state.geometry.pinchedSpeed;
    elements.movingShapeCountControl.value = state.geometry.movingShapeCount;
    elements.movingBreathingControl.value = state.geometry.movingBreathing;
    elements.movingSpeedControl.value = state.geometry.movingSpeed;
    elements.rayOriginControl.value = state.geometry.rayOrigin;
    elements.rayCountControl.value = state.geometry.rayCount;
    elements.rayMotionControl.value = state.geometry.rayMotion;
    elements.raySpeedControl.value = state.geometry.raySpeed;
    elements.gradientTypeControl.value = state.rendering.gradientType;
    elements.gradientAngleControl.value = state.rendering.gradientAngle;
    elements.gradientReverseControl.checked = state.rendering.gradientReverse;
    elements.renderStyleControl.value = state.rendering.style;
    elements.luminousBloomControl.value = state.rendering.bloom;
    elements.luminousSoftnessControl.value = state.rendering.softness;
    elements.luminousPaleDepthControl.value = state.rendering.paleDepth;
    elements.luminousTransitionControl.value = state.rendering.transition;
    elements.luminousWarmthControl.value = state.rendering.warmth;
    elements.luminousScaleControl.value = state.rendering.fieldScale;
    elements.luminousVariationControl.value = state.rendering.variation;
    elements.luminousMotionControl.value = state.rendering.motion;
    elements.luminousSpeedControl.value = state.rendering.speed;
    elements.framePresetControl.value = state.frame.preset;
    elements.frameWidthControl.value = state.frame.width;
    elements.frameHeightControl.value = state.frame.height;
    elements.showLogoControl.checked = overlayState.showLogo;
    elements.showEventCopyControl.checked = overlayState.showEventCopy;
    elements.textContentControl.value = overlayState.textContent;
    elements.eventTextEffectControl.value = overlayState.eventTextEffect;
    elements.eventTextAccentControl.value = overlayState.eventTextAccent;
    elements.logoAlignmentControl.value = overlayState.alignment;
    elements.logoPaddingControl.value = overlayState.padding;
    elements.logoEffectControl.value = overlayState.logoEffect;
    elements.logoAccentControl.value = overlayState.logoAccent;
    elements.matchTextAccentControl.checked =
      overlayState.matchTextAccent;
    elements.logoEffectStrengthControl.value =
      overlayState.effectStrength;
    elements.logoEffectBlurControl.value = overlayState.effectBlur;
    elements.logoEffectHueControl.value = overlayState.effectHue;
    elements.logoEffectOpacityControl.value = overlayState.effectOpacity;
    elements.paletteTypeControl.value = paletteState.type;
    elements.baseHueControl.value = paletteState.baseHue;
    elements.colorCountControl.value = paletteState.colorCount;
    elements.colorVariabilityControl.value = paletteState.variability;
    elements.arrangementControl.value = paletteState.arrangement;
  }

  function updateOutputs() {
    const frameState = app.state.frame;
    elements.gradientAngleValue.value = `${app.state.rendering.gradientAngle}°`;
    elements.ringCountValue.value = String(app.state.geometry.ringCount);
    elements.sectorCountValue.value = String(app.state.geometry.sectorCount);
    const overlayState = app.state.overlays;
    const paletteState = app.state.palette;

    elements.polygonSidesValue.value =
      String(app.state.geometry.polygonSides);
    elements.superellipseRoundnessValue.value =
      app.state.geometry.superellipseRoundness.toFixed(1);
    elements.shapeRotationValue.value =
      `${app.state.geometry.shapeRotation}°`;
    elements.gridRowsValue.value = String(app.state.geometry.gridRows);
    elements.gridColumnsValue.value = String(
      app.state.geometry.gridColumns
    );
    elements.diagonalBandCountValue.value = String(
      app.state.geometry.diagonalBandCount
    );
    elements.diagonalAngleValue.value =
      `${app.state.geometry.diagonalAngle}°`;
    elements.diagonalOffsetValue.value =
      `${app.state.geometry.diagonalOffset}%`;
    elements.pinchedColumnsValue.value = String(
      app.state.geometry.pinchedColumns
    );
    elements.pinchedCountValue.value = String(
      app.state.geometry.pinchedCount
    );
    elements.pinchedDepthValue.value =
      `${app.state.geometry.pinchedDepth}%`;
    elements.pinchedPositionValue.value =
      `${app.state.geometry.pinchedPosition}%`;
    elements.pinchedSlantValue.value =
      `${app.state.geometry.pinchedSlant}%`;
    elements.pinchedMotionValue.value =
      `${app.state.geometry.pinchedMotion}%`;
    elements.pinchedSpeedValue.value =
      `${app.state.geometry.pinchedSpeed}%`;
    elements.movingShapeCountValue.value = String(app.state.geometry.movingShapeCount);
    elements.movingBreathingValue.value = `${app.state.geometry.movingBreathing}%`;
    elements.movingSpeedValue.value = `${app.state.geometry.movingSpeed}%`;
    elements.rayCountValue.value = String(app.state.geometry.rayCount);
    elements.rayMotionValue.value = `${app.state.geometry.rayMotion}%`;
    elements.raySpeedValue.value = `${app.state.geometry.raySpeed}%`;
    elements.luminousBloomValue.value =
      `${app.state.rendering.bloom}%`;
    elements.luminousSoftnessValue.value = String(
      app.state.rendering.softness
    );
    elements.luminousPaleDepthValue.value =
      `${app.state.rendering.paleDepth}%`;
    elements.luminousTransitionValue.value =
      `${app.state.rendering.transition}%`;
    elements.luminousWarmthValue.value =
      `${app.state.rendering.warmth}%`;
    elements.luminousScaleValue.value =
      `${app.state.rendering.fieldScale}%`;
    elements.luminousVariationValue.value =
      `${app.state.rendering.variation}%`;
    elements.luminousMotionValue.value =
      `${app.state.rendering.motion}%`;
    elements.luminousSpeedValue.value =
      `${app.state.rendering.speed}%`;
    elements.frameWidthValue.value = `${frameState.width} px`;
    elements.frameHeightValue.value = `${frameState.height} px`;
    elements.eventTextAccentValue.value =
      overlayState.eventTextAccent.toUpperCase();
    elements.logoPaddingValue.value = `${overlayState.padding} px`;
    elements.logoAccentValue.value =
      overlayState.logoAccent.toUpperCase();
    elements.logoEffectStrengthValue.value =
      `${overlayState.effectStrength}%`;
    elements.logoEffectBlurValue.value = `${overlayState.effectBlur} px`;
    elements.logoEffectHueValue.value = `${overlayState.effectHue}°`;
    elements.logoEffectOpacityValue.value =
      `${overlayState.effectOpacity}%`;
    elements.baseHueValue.value = `${paletteState.baseHue}°`;
    elements.colorCountValue.value = String(paletteState.colorCount);
    elements.colorVariabilityValue.value =
      `${paletteState.variability}%`;
  }

  function updateControlStates() {
    const overlayState = app.state.overlays;
    const manifesto = overlayState.textContent === "manifesto";
    const logoHidden = !overlayState.showLogo || manifesto;
    elements.showLogoControl.disabled = manifesto;
    const copyHidden = !overlayState.showEventCopy;
    const allContentHidden = logoHidden && copyHidden;
    const logoUsesAccent = app.overlays.logoUsesAccent(
      overlayState.logoEffect
    );
    const polarEnabled = ["rings", "polygons", "superellipse"].includes(app.state.geometry.type);
    const polygonControlsEnabled = app.state.geometry.type === "polygons";
    const superellipseControlsEnabled =
      app.state.geometry.type === "superellipse";
    const rotationEnabled = ["polygons", "superellipse"].includes(
      app.state.geometry.type
    );
    const gridControlsEnabled = app.state.geometry.type === "grid";
    const diagonalControlsEnabled =
      app.state.geometry.type === "diagonal";
    const pinchedControlsEnabled =
      app.state.geometry.type === "pinched";
    const rayControlsEnabled = app.state.geometry.type === "rays";
    const movingEnabled = app.state.geometry.type === "moving";
    const luminousEnabled = app.state.rendering.style === "luminous";

    elements.geometrySpecificGroups.forEach((group) => {
      const geometryTypes = group.dataset.geometryOnly.split(" ");

      group.hidden = !geometryTypes.includes(app.state.geometry.type);
    });

    elements.renderSpecificGroups.forEach((group) => {
      group.hidden = !group.dataset.renderOnly.split(" ").includes(app.state.rendering.style);
    });

    elements.ringCountControl.disabled = !polarEnabled;
    elements.sectorCountControl.disabled = !polarEnabled;
    [...elements.symmetryControl.options].forEach(option => {
      option.disabled = polarEnabled && app.state.geometry.sectorCount % 2 !== 0 &&
        ["vertical", "four-way", "point"].includes(option.value);
    });
    if (elements.symmetryControl.selectedOptions[0].disabled) {
      app.state.symmetry = "none";
      elements.symmetryControl.value = "none";
      if (app.state.palette.colors.length) app.palette.apply();
    }
    elements.polygonSidesControl.disabled = !polygonControlsEnabled;
    elements.superellipseRoundnessControl.disabled =
      !superellipseControlsEnabled;
    elements.shapeRotationControl.disabled = !rotationEnabled;
    elements.gridRowsControl.disabled = !gridControlsEnabled;
    elements.gridColumnsControl.disabled = !gridControlsEnabled;
    elements.diagonalBandCountControl.disabled =
      !diagonalControlsEnabled;
    elements.diagonalAngleControl.disabled = !diagonalControlsEnabled;
    elements.diagonalOffsetControl.disabled = !diagonalControlsEnabled;
    elements.pinchedColumnsControl.disabled = !pinchedControlsEnabled;
    elements.pinchedCountControl.disabled = !pinchedControlsEnabled;
    elements.pinchedDepthControl.disabled = !pinchedControlsEnabled;
    elements.pinchedPositionControl.disabled = !pinchedControlsEnabled;
    elements.pinchedSidesControl.disabled = !pinchedControlsEnabled;
    elements.pinchedSlantControl.disabled = !pinchedControlsEnabled;
    elements.pinchedMotionControl.disabled = !pinchedControlsEnabled;
    elements.pinchedSpeedControl.disabled = !pinchedControlsEnabled;
    elements.movingShapeCountControl.disabled = !movingEnabled;
    elements.movingBreathingControl.disabled = !movingEnabled;
    elements.movingSpeedControl.disabled = !movingEnabled;
    elements.movingRegenerateButton.disabled = !movingEnabled;
    // Free-moving regions have no symmetry axis; preserve the other families' setting.
    const symmetryHidden = movingEnabled || (polarEnabled && app.state.geometry.sectorCount === 1);
    elements.symmetryControl.disabled = symmetryHidden;
    elements.symmetryControl.closest(".control-group").hidden = symmetryHidden;
    elements.rayOriginControl.disabled = !rayControlsEnabled;
    elements.rayCountControl.disabled = !rayControlsEnabled;
    elements.rayMotionControl.disabled = !rayControlsEnabled;
    elements.raySpeedControl.disabled = !rayControlsEnabled;
    const gradientEnabled = app.state.rendering.style === "gradient";
    const linearEnabled = gradientEnabled && app.state.rendering.gradientType === "linear";
    elements.gradientTypeControl.disabled = !gradientEnabled;
    elements.gradientReverseControl.disabled = !gradientEnabled;
    elements.gradientAngleControl.disabled = !linearEnabled;
    document.querySelector("#gradient-direction-group").hidden = !linearEnabled;
    elements.luminousBloomControl.disabled = !luminousEnabled;
    elements.luminousSoftnessControl.disabled = !luminousEnabled;
    elements.luminousPaleDepthControl.disabled = !luminousEnabled;
    elements.luminousTransitionControl.disabled = !luminousEnabled;
    elements.luminousWarmthControl.disabled = !luminousEnabled;
    elements.luminousScaleControl.disabled = !luminousEnabled;
    elements.luminousVariationControl.disabled = !luminousEnabled;
    elements.luminousMotionControl.disabled = !luminousEnabled;
    elements.luminousSpeedControl.disabled = !luminousEnabled;
    elements.randomizeLuminousButton.disabled = !luminousEnabled;
    elements.logoAlignmentControl.disabled = allContentHidden;
    elements.logoPaddingControl.disabled = allContentHidden;
    elements.logoEffectControl.disabled = logoHidden;
    elements.logoEffectStrengthControl.disabled =
      logoHidden || ["solid", "accent"].includes(overlayState.logoEffect);
    elements.logoEffectBlurControl.disabled =
      logoHidden || overlayState.logoEffect !== "glass";
    elements.logoEffectHueControl.disabled =
      logoHidden || overlayState.logoEffect !== "hue";
    elements.logoEffectOpacityControl.disabled = logoHidden;
    elements.matchTextAccentControl.disabled =
      logoHidden || !logoUsesAccent;
    elements.logoAccentControl.disabled =
      logoHidden || !logoUsesAccent || overlayState.matchTextAccent;
    elements.eventTextEffectControl.disabled = copyHidden;
    elements.eventTextAccentControl.disabled =
      copyHidden || !app.overlays.textUsesAccent(
        overlayState.eventTextEffect
      );
    elements.baseHueControl.disabled = app.palette.isFixedType(
      app.state.palette.type
    );
  }

  function getControlsRailWidth() {
    if (elements.controlsPanel.hidden) {
      return 0;
    }

    const panelStyles = window.getComputedStyle(elements.controlsPanel);
    const rightInset = Number.parseFloat(panelStyles.right) || 0;
    const artworkGap = 18;

    return Math.min(
      window.innerWidth,
      Math.ceil(
        elements.controlsPanel.getBoundingClientRect().width +
        rightInset +
        artworkGap
      )
    );
  }

  function updateFrameSize() {
    const frameState = app.state.frame;
    const availableWidth = Math.max(
      1,
      window.innerWidth - getControlsRailWidth()
    );
    const viewportScale = Math.min(
      1,
      (availableWidth * 0.94) / frameState.width,
      (window.innerHeight * 0.94) / frameState.height
    );

    elements.animationBox.style.setProperty(
      "--frame-width",
      `${frameState.width * viewportScale}px`
    );
    elements.animationBox.style.setProperty(
      "--frame-height",
      `${frameState.height * viewportScale}px`
    );
    updateOutputs();
  }

  function syncControlsLayout() {
    const controlsRailWidth = getControlsRailWidth();

    document.body.style.setProperty(
      "--controls-rail-width",
      `${controlsRailWidth}px`
    );
    updateFrameSize();
  }

  function setControlsVisible(visible) {
    app.state.controlsVisible = visible;
    elements.controlsPanel.hidden = !visible;
    elements.showControlsButton.hidden = visible;
    elements.showControlsButton.setAttribute(
      "aria-expanded",
      String(visible)
    );
    syncControlsLayout();
  }

  function renderOverlaysAndControls() {
    if (app.state.overlays.matchTextAccent) {
      app.state.overlays.logoAccent =
        app.state.overlays.eventTextAccent;
      elements.logoAccentControl.value =
        app.state.overlays.logoAccent;
    }

    app.overlays.renderAll();
    updateOutputs();
    updateControlStates();
  }

  function updateArrangementLabels() {
    const gridActive = app.state.geometry.type === "grid";
    const diagonalActive = app.state.geometry.type === "diagonal";
    const pinchedActive = app.state.geometry.type === "pinched";
    const raysActive = app.state.geometry.type === "rays";

    if (gridActive) {
      elements.arrangementRowsOption.textContent = "By row";
      elements.arrangementColumnsOption.textContent = "By column";
    } else if (diagonalActive) {
      elements.arrangementRowsOption.textContent = "By band";
      elements.arrangementColumnsOption.textContent = "Band sequence";
    } else if (pinchedActive) {
      elements.arrangementRowsOption.textContent = "By zone";
      elements.arrangementColumnsOption.textContent = "By stripe";
    } else if (raysActive) {
      elements.arrangementRowsOption.textContent = "By ray";
      elements.arrangementColumnsOption.textContent = "Ray sequence";
    } else {
      elements.arrangementRowsOption.textContent = "By ring";
      elements.arrangementColumnsOption.textContent = "By sector";
    }
  }

  function bindEvents() {
    elements.hideControlsButton.addEventListener("click", () => {
      setControlsVisible(false);
      elements.showControlsButton.focus();
    });

    elements.showControlsButton.addEventListener("click", () => {
      setControlsVisible(true);
      elements.hideControlsButton.focus();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.controlsPanel.hidden) {
        setControlsVisible(false);
        elements.showControlsButton.focus();
      }
    });

    elements.symmetryControl.addEventListener("change", () => {
      app.state.symmetry = elements.symmetryControl.value;
      app.palette.apply();
    });

    elements.geometryTypeControl.addEventListener("change", () => {
      app.setGeometry(elements.geometryTypeControl.value);
      updateArrangementLabels();
      updateOutputs();
      updateControlStates();
    });

    [[elements.ringCountControl, "ringCount"], [elements.sectorCountControl, "sectorCount"]].forEach(([control, key]) => {
      control.addEventListener("input", () => {
        app.state.geometry[key] = Number(control.value);
        app.setGeometry(app.state.geometry.type);
        updateOutputs();
        updateControlStates();
      });
    });

    elements.polygonSidesControl.addEventListener("input", () => {
      app.state.geometry.polygonSides = Number(
        elements.polygonSidesControl.value
      );
      updateOutputs();
    });

    elements.superellipseRoundnessControl.addEventListener("input", () => {
      app.state.geometry.superellipseRoundness = Number(
        elements.superellipseRoundnessControl.value
      );
      updateOutputs();
    });

    elements.shapeRotationControl.addEventListener("input", () => {
      app.state.geometry.shapeRotation = Number(
        elements.shapeRotationControl.value
      );
      updateOutputs();
    });

    elements.gridRowsControl.addEventListener("input", () => {
      app.state.geometry.gridRows = Number(elements.gridRowsControl.value);
      app.setGeometry("grid");
      updateOutputs();
    });

    elements.gridColumnsControl.addEventListener("input", () => {
      app.state.geometry.gridColumns = Number(
        elements.gridColumnsControl.value
      );
      app.setGeometry("grid");
      updateOutputs();
    });

    elements.diagonalBandCountControl.addEventListener("input", () => {
      app.state.geometry.diagonalBandCount = Number(
        elements.diagonalBandCountControl.value
      );
      app.setGeometry("diagonal");
      updateOutputs();
    });

    elements.diagonalAngleControl.addEventListener("input", () => {
      app.state.geometry.diagonalAngle = Number(
        elements.diagonalAngleControl.value
      );
      updateOutputs();
    });

    elements.diagonalOffsetControl.addEventListener("input", () => {
      app.state.geometry.diagonalOffset = Number(
        elements.diagonalOffsetControl.value
      );
      updateOutputs();
    });

    elements.pinchedColumnsControl.addEventListener("input", () => {
      app.state.geometry.pinchedColumns = Number(
        elements.pinchedColumnsControl.value
      );
      app.setGeometry("pinched");
      updateOutputs();
    });

    elements.pinchedCountControl.addEventListener("input", () => {
      app.state.geometry.pinchedCount = Number(
        elements.pinchedCountControl.value
      );
      app.setGeometry("pinched");
      updateOutputs();
    });

    elements.pinchedDepthControl.addEventListener("input", () => {
      app.state.geometry.pinchedDepth = Number(
        elements.pinchedDepthControl.value
      );
      updateOutputs();
    });

    elements.pinchedPositionControl.addEventListener("input", () => {
      app.state.geometry.pinchedPosition = Number(
        elements.pinchedPositionControl.value
      );
      updateOutputs();
    });

    elements.pinchedSidesControl.addEventListener("change", () => {
      app.state.geometry.pinchedSides = elements.pinchedSidesControl.value;
    });

    elements.pinchedSlantControl.addEventListener("input", () => {
      app.state.geometry.pinchedSlant = Number(
        elements.pinchedSlantControl.value
      );
      updateOutputs();
    });

    elements.pinchedMotionControl.addEventListener("input", () => {
      app.state.geometry.pinchedMotion = Number(
        elements.pinchedMotionControl.value
      );
      updateOutputs();
    });

    elements.pinchedSpeedControl.addEventListener("input", () => {
      app.state.geometry.pinchedSpeed = Number(
        elements.pinchedSpeedControl.value
      );
      updateOutputs();
    });

    elements.movingShapeCountControl.addEventListener("input", () => {
      app.state.geometry.movingShapeCount = Number(elements.movingShapeCountControl.value);
      app.setGeometry("moving");
      updateOutputs();
    });
    elements.movingBreathingControl.addEventListener("input", () => {
      app.state.geometry.movingBreathing = Number(elements.movingBreathingControl.value);
      updateOutputs();
    });
    elements.movingSpeedControl.addEventListener("input", () => {
      app.state.geometry.movingSpeed = Number(elements.movingSpeedControl.value);
      updateOutputs();
    });
    elements.movingRegenerateButton.addEventListener("click", () => {
      app.setGeometry("moving");
    });

    elements.rayOriginControl.addEventListener("change", () => {
      app.state.geometry.rayOrigin = elements.rayOriginControl.value;
    });

    elements.rayCountControl.addEventListener("input", () => {
      app.state.geometry.rayCount = Number(elements.rayCountControl.value);
      app.setGeometry("rays");
      updateOutputs();
    });

    elements.rayMotionControl.addEventListener("input", () => {
      app.state.geometry.rayMotion = Number(
        elements.rayMotionControl.value
      );
      updateOutputs();
    });

    elements.raySpeedControl.addEventListener("input", () => {
      app.state.geometry.raySpeed = Number(elements.raySpeedControl.value);
      updateOutputs();
    });

    [[elements.gradientTypeControl, "gradientType"],
      [elements.gradientAngleControl, "gradientAngle"],
      [elements.gradientReverseControl, "gradientReverse"]].forEach(([control, key]) => {
      control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => {
        app.state.rendering[key] = control.type === "checkbox" ? control.checked :
          control.type === "range" ? Number(control.value) : control.value;
        app.rendering.refresh();
        updateOutputs();
        updateControlStates();
      });
    });

    elements.renderStyleControl.addEventListener("change", () => {
      app.state.rendering.style = elements.renderStyleControl.value;
      app.rendering.refresh();
      updateControlStates();
    });

    elements.luminousBloomControl.addEventListener("input", () => {
      app.state.rendering.bloom = Number(
        elements.luminousBloomControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousSoftnessControl.addEventListener("input", () => {
      app.state.rendering.softness = Number(
        elements.luminousSoftnessControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousPaleDepthControl.addEventListener("input", () => {
      app.state.rendering.paleDepth = Number(
        elements.luminousPaleDepthControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousTransitionControl.addEventListener("input", () => {
      app.state.rendering.transition = Number(
        elements.luminousTransitionControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousWarmthControl.addEventListener("input", () => {
      app.state.rendering.warmth = Number(
        elements.luminousWarmthControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousScaleControl.addEventListener("input", () => {
      app.state.rendering.fieldScale = Number(
        elements.luminousScaleControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousVariationControl.addEventListener("input", () => {
      app.state.rendering.variation = Number(
        elements.luminousVariationControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousMotionControl.addEventListener("input", () => {
      app.state.rendering.motion = Number(
        elements.luminousMotionControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.luminousSpeedControl.addEventListener("input", () => {
      app.state.rendering.speed = Number(
        elements.luminousSpeedControl.value
      );
      app.rendering.refresh();
      updateOutputs();
    });

    elements.randomizeLuminousButton.addEventListener("click", () => {
      app.rendering.randomize();
    });

    elements.framePresetControl.addEventListener("change", () => {
      const presetName = elements.framePresetControl.value;
      const preset = app.constants.framePresets[presetName];

      app.state.frame.preset = presetName;

      if (preset) {
        app.state.frame.width = preset.width;
        app.state.frame.height = preset.height;
        elements.frameWidthControl.value = preset.width;
        elements.frameHeightControl.value = preset.height;
        updateFrameSize();
      }
    });

    elements.frameWidthControl.addEventListener("input", () => {
      app.state.frame.preset = "custom";
      app.state.frame.width = Number(elements.frameWidthControl.value);
      elements.framePresetControl.value = "custom";
      updateFrameSize();
    });

    elements.frameHeightControl.addEventListener("input", () => {
      app.state.frame.preset = "custom";
      app.state.frame.height = Number(elements.frameHeightControl.value);
      elements.framePresetControl.value = "custom";
      updateFrameSize();
    });

    elements.showLogoControl.addEventListener("change", () => {
      app.state.overlays.showLogo = elements.showLogoControl.checked;
      renderOverlaysAndControls();
    });

    elements.textContentControl.addEventListener("change", () => {
      app.state.overlays.textContent = elements.textContentControl.value;
      renderOverlaysAndControls();
    });

    elements.showEventCopyControl.addEventListener("change", () => {
      app.state.overlays.showEventCopy =
        elements.showEventCopyControl.checked;
      renderOverlaysAndControls();
    });

    elements.eventTextEffectControl.addEventListener("change", () => {
      app.state.overlays.eventTextEffect =
        elements.eventTextEffectControl.value;
      renderOverlaysAndControls();
    });

    elements.eventTextAccentControl.addEventListener("input", () => {
      app.state.overlays.eventTextAccent =
        elements.eventTextAccentControl.value;
      renderOverlaysAndControls();
    });

    elements.logoAlignmentControl.addEventListener("change", () => {
      app.state.overlays.alignment = elements.logoAlignmentControl.value;
      renderOverlaysAndControls();
    });

    elements.logoPaddingControl.addEventListener("input", () => {
      app.state.overlays.padding = Number(
        elements.logoPaddingControl.value
      );
      renderOverlaysAndControls();
    });

    elements.logoEffectControl.addEventListener("change", () => {
      app.state.overlays.logoEffect = elements.logoEffectControl.value;
      renderOverlaysAndControls();
    });

    elements.logoAccentControl.addEventListener("input", () => {
      app.state.overlays.logoAccent = elements.logoAccentControl.value;
      renderOverlaysAndControls();
    });

    elements.matchTextAccentControl.addEventListener("change", () => {
      app.state.overlays.matchTextAccent =
        elements.matchTextAccentControl.checked;
      renderOverlaysAndControls();
    });

    elements.logoEffectStrengthControl.addEventListener("input", () => {
      app.state.overlays.effectStrength = Number(
        elements.logoEffectStrengthControl.value
      );
      renderOverlaysAndControls();
    });

    elements.logoEffectBlurControl.addEventListener("input", () => {
      app.state.overlays.effectBlur = Number(
        elements.logoEffectBlurControl.value
      );
      renderOverlaysAndControls();
    });

    elements.logoEffectHueControl.addEventListener("input", () => {
      app.state.overlays.effectHue = Number(
        elements.logoEffectHueControl.value
      );
      renderOverlaysAndControls();
    });

    elements.logoEffectOpacityControl.addEventListener("input", () => {
      app.state.overlays.effectOpacity = Number(
        elements.logoEffectOpacityControl.value
      );
      renderOverlaysAndControls();
    });

    elements.paletteTypeControl.addEventListener("change", () => {
      app.state.palette.type = elements.paletteTypeControl.value;
      app.palette.refresh();
      updateOutputs();
      updateControlStates();
    });

    elements.baseHueControl.addEventListener("input", () => {
      app.state.palette.baseHue = Number(elements.baseHueControl.value);
      app.palette.refresh();
      updateOutputs();
    });

    elements.colorCountControl.addEventListener("input", () => {
      app.state.palette.colorCount = Number(elements.colorCountControl.value);
      app.palette.refresh();
      updateOutputs();
    });

    elements.colorVariabilityControl.addEventListener("input", () => {
      app.state.palette.variability = Number(
        elements.colorVariabilityControl.value
      );
      app.palette.refresh();
      updateOutputs();
    });

    elements.arrangementControl.addEventListener("change", () => {
      app.state.palette.arrangement = elements.arrangementControl.value;
      app.palette.apply();
    });

    elements.shufflePaletteButton.addEventListener("click", () => {
      app.palette.shuffle();
      updateOutputs();
    });

    window.addEventListener("resize", syncControlsLayout);
  }

  function initialize(collectedElements) {
    elements = collectedElements;
    hydrateControls();
    bindEvents();
    updateArrangementLabels();
    syncControlsLayout();
    updateOutputs();
    updateControlStates();
  }

  app.controls = {
    collectElements: collectElements,
    initialize: initialize,
    refresh() {
      hydrateControls();
      updateArrangementLabels();
      syncControlsLayout();
      updateOutputs();
      updateControlStates();
    },
    updateControlStates: updateControlStates,
    syncControlsLayout: syncControlsLayout
  };
})(window.CircleApp = window.CircleApp || {});
