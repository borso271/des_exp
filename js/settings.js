(function (app) {
  "use strict";

  const format = "circle-art-configuration";
  const version = 1;
  const maximumSize = 1024 * 1024;
  // Map the existing controls to state without replaying geometry-changing events.
  const bindings = {
    symmetryControl: "symmetry",
    geometryTypeControl: "geometry.type",
    ringCountControl: "geometry.ringCount",
    sectorCountControl: "geometry.sectorCount",
    polygonSidesControl: "geometry.polygonSides",
    superellipseRoundnessControl: "geometry.superellipseRoundness",
    shapeRotationControl: "geometry.shapeRotation",
    gridRowsControl: "geometry.gridRows",
    gridColumnsControl: "geometry.gridColumns",
    diagonalBandCountControl: "geometry.diagonalBandCount",
    diagonalAngleControl: "geometry.diagonalAngle",
    diagonalOffsetControl: "geometry.diagonalOffset",
    pinchedColumnsControl: "geometry.pinchedColumns",
    pinchedCountControl: "geometry.pinchedCount",
    pinchedDepthControl: "geometry.pinchedDepth",
    pinchedPositionControl: "geometry.pinchedPosition",
    pinchedSidesControl: "geometry.pinchedSides",
    pinchedSlantControl: "geometry.pinchedSlant",
    pinchedMotionControl: "geometry.pinchedMotion",
    pinchedSpeedControl: "geometry.pinchedSpeed",
    movingShapeCountControl: "geometry.movingShapeCount",
    movingBreathingControl: "geometry.movingBreathing",
    movingSpeedControl: "geometry.movingSpeed",
    rayOriginControl: "geometry.rayOrigin",
    rayCountControl: "geometry.rayCount",
    rayMotionControl: "geometry.rayMotion",
    raySpeedControl: "geometry.raySpeed",
    gradientTypeControl: "rendering.gradientType",
    gradientAngleControl: "rendering.gradientAngle",
    gradientReverseControl: "rendering.gradientReverse",
    renderStyleControl: "rendering.style",
    luminousBloomControl: "rendering.bloom",
    luminousSoftnessControl: "rendering.softness",
    luminousPaleDepthControl: "rendering.paleDepth",
    luminousTransitionControl: "rendering.transition",
    luminousWarmthControl: "rendering.warmth",
    luminousScaleControl: "rendering.fieldScale",
    luminousVariationControl: "rendering.variation",
    luminousMotionControl: "rendering.motion",
    luminousSpeedControl: "rendering.speed",
    framePresetControl: "frame.preset",
    frameWidthControl: "frame.width",
    frameHeightControl: "frame.height",
    showLogoControl: "overlays.showLogo",
    showEventCopyControl: "overlays.showEventCopy",
    textContentControl: "overlays.textContent",
    eventTextEffectControl: "overlays.eventTextEffect",
    eventTextAccentControl: "overlays.eventTextAccent",
    logoAlignmentControl: "overlays.alignment",
    logoPaddingControl: "overlays.padding",
    logoEffectControl: "overlays.logoEffect",
    logoAccentControl: "overlays.logoAccent",
    matchTextAccentControl: "overlays.matchTextAccent",
    logoEffectStrengthControl: "overlays.effectStrength",
    logoEffectBlurControl: "overlays.effectBlur",
    logoEffectHueControl: "overlays.effectHue",
    logoEffectOpacityControl: "overlays.effectOpacity",
    paletteTypeControl: "palette.type",
    baseHueControl: "palette.baseHue",
    colorCountControl: "palette.colorCount",
    colorVariabilityControl: "palette.variability",
    arrangementControl: "palette.arrangement"
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const unit = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  let elements;

  function capture() {
    return {
      format, version,
      exportedAt: new Date().toISOString(),
      controls: Object.fromEntries(Object.keys(bindings).map(name => {
        const control = elements[name];
        const value = control.type === "checkbox" ? control.checked :
          control.type === "range" || control.type === "number" ? Number(control.value) : control.value;
        return [control.id, value];
      })),
      palette: clone({ noise: app.state.palette.noise, cellNoise: app.state.palette.cellNoise,
        offset: app.state.palette.offset }),
      renderingSeed: app.state.rendering.seed
    };
  }

  function validateControl(control, value) {
    let valid = false;
    if (control.type === "checkbox") valid = typeof value === "boolean";
    else if (control.tagName === "SELECT") {
      valid = typeof value === "string" && [...control.options].some(option => option.value === value);
    } else if (control.type === "color") valid = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
    else if (control.type === "range" || control.type === "number") {
      const minimum = control.min === "" ? -Infinity : Number(control.min);
      const maximum = control.max === "" ? Infinity : Number(control.max);
      const step = Number(control.step || 1);
      const stepBase = Number.isFinite(minimum) ? minimum : 0;
      valid = typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum &&
        (control.step === "any" || Math.abs((value - stepBase) / step - Math.round((value - stepBase) / step)) < 1e-7);
    }
    if (!valid) throw new Error(`Invalid setting: ${control.id}.`);
  }

  function parse(text) {
    if (text.length > maximumSize) throw new Error("The configuration file is too large (maximum 1 MB).");
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("This file is not valid JSON."); }
    if (!record(data) || data.format !== format) throw new Error("Choose a circle.html configuration file.");
    if (data.version !== version) throw new Error("This configuration version is not supported.");
    if (!record(data.controls)) throw new Error("The configuration has no controls.");
    // Configurations saved before count controls used fixed 8 × 16 cells.
    if (!("ring-count" in data.controls)) data.controls["ring-count"] = 8;
    if (!("sector-count" in data.controls)) data.controls["sector-count"] = 16;
    if (!("gradient-type" in data.controls)) data.controls["gradient-type"] = "linear";
    if (!("gradient-angle" in data.controls)) data.controls["gradient-angle"] = 90;
    if (!("gradient-reverse" in data.controls)) data.controls["gradient-reverse"] = false;
    if (!("text-content" in data.controls)) data.controls["text-content"] = "event";
    for (const name of Object.keys(bindings)) validateControl(elements[name], data.controls[elements[name].id]);
    const palette = data.palette;
    if (!record(palette) || !Array.isArray(palette.noise) || palette.noise.length !== 16 ||
        !palette.noise.every(n => record(n) && unit(n.hue) && unit(n.saturation) && unit(n.lightness)) ||
        !Number.isInteger(palette.offset) || palette.offset < 0 || palette.offset > 15 ||
        !Array.isArray(palette.cellNoise) || palette.cellNoise.length < 1 || palette.cellNoise.length > 64 ||
        !palette.cellNoise.every(row => Array.isArray(row) && row.length > 0 && row.length <= 128 && row.every(unit))) {
      throw new Error("The configuration contains invalid palette data.");
    }
    if (!Number.isInteger(data.renderingSeed) || data.renderingSeed < 0 || data.renderingSeed > 1000000000) {
      throw new Error("The configuration contains an invalid light-field seed.");
    }
    // Validate the palette matrix against the requested geometry before any writes.
    const values = data.controls;
    const type = values["geometry-type"];
    const polar = ["rings", "polygons", "superellipse"].includes(type);
    let rows = polar ? values["ring-count"] : 1;
    let columns = polar ? values["sector-count"] : 1;
    if (type === "grid") { rows = values["grid-rows"]; columns = values["grid-columns"]; }
    if (type === "diagonal") columns = values["diagonal-band-count"];
    if (type === "rays") columns = values["ray-count"];
    if (type === "moving") columns = values["moving-shape-count"];
    if (type === "pinched") { rows = values["pinched-count"] * 2 + 1; columns = values["pinched-columns"]; }
    if (palette.cellNoise.length !== rows || palette.cellNoise.some(row => row.length !== columns)) {
      throw new Error("The saved palette does not match the geometry dimensions.");
    }
    return data;
  }

  function apply(text) {
    const data = parse(text);
    for (const [name, path] of Object.entries(bindings)) {
      const keys = path.split(".");
      const target = keys.length === 1 ? app.state : app.state[keys[0]];
      target[keys[keys.length - 1]] = data.controls[elements[name].id];
    }
    const preset = app.constants.framePresets[app.state.frame.preset];
    if (preset && (preset.width !== app.state.frame.width || preset.height !== app.state.frame.height)) {
      app.state.frame.preset = "custom";
    }
    if (app.state.overlays.matchTextAccent) app.state.overlays.logoAccent = app.state.overlays.eventTextAccent;
    app.state.rendering.seed = data.renderingSeed;
    const palette = app.state.palette;
    palette.noise = clone(data.palette.noise);
    palette.cellNoise = clone(data.palette.cellNoise);
    palette.offset = data.palette.offset;
    palette.cellNoiseBySize = {};
    app.renderer.setGeometry(app.state.geometry.type);
    const dimensions = app.renderer.getDimensions();
    palette.cellNoiseBySize[`${dimensions.rows}x${dimensions.columns}`] = palette.cellNoise;
    app.palette.refresh();
    app.overlays.renderAll();
    app.controls.refresh();
  }

  function download() {
    const blob = new Blob([JSON.stringify(capture(), null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `circle-${app.state.geometry.type}-configuration.json`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function initialize() {
    elements = app.controls.collectElements();
    const status = document.querySelector("#configuration-status");
    const input = document.querySelector("#load-configuration");
    document.querySelector("#download-configuration").addEventListener("click", () => {
      try { download(); status.textContent = "Configuration downloaded."; }
      catch { status.textContent = "The configuration could not be downloaded."; }
    });
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      input.disabled = true;
      try {
        if (file.size > maximumSize) throw new Error("The configuration file is too large (maximum 1 MB).");
        const text = typeof file.text === "function" ? await file.text() : await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("The configuration file could not be read."));
          reader.readAsText(file);
        });
        apply(text);
        status.textContent = "Configuration loaded.";
      } catch (error) { status.textContent = error.message; }
      finally { input.value = ""; input.disabled = false; }
    });
  }
  app.settings = { initialize, capture, parse, apply };
})(window.CircleApp = window.CircleApp || {});
