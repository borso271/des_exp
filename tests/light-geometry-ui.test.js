const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const projectRoot = path.resolve(__dirname, "..");
const pagePath = path.join(projectRoot, "canvas_light_columns_demo.html");
const source = [pagePath,"js/shared/poster-text.css","js/shared/poster-text.js","js/light-columns/app.js"].map(file=>fs.readFileSync(path.resolve(projectRoot,file),"utf8")).join("\n");
const runtimeErrors = [];
const animationCallbacks = new Map();
let animationId = 0;
const virtualConsole = new VirtualConsole();
let drawCount = 0;
const gradientKinds = [];
const gradientColors = [];
let gradientStopCount = 0;
let imageDrawCount = 0;
const renderOperations = [];
let settingsDownloadCount = 0;
const settingsDownloadNames = [];
const imageSources = [];

virtualConsole.on("jsdomError", (error) => runtimeErrors.push(error));

function makeGradient() {
  return {
    addColorStop(offset, color) {
      assert.ok(
        Number.isFinite(offset) && offset >= 0 && offset <= 1,
        `invalid gradient stop ${offset}`
      );
      gradientColors.push(color);
      gradientStopCount += 1;
    }
  };
}

function makeContext(owner, browserWindow) {
  const ownerName = owner && owner.id ? owner.id : "offscreen";

  return {
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    filter: "none",
    save() {},
    restore() {},
    translate() {},
    scale() {},
    setTransform() {},
    clearRect() {},
    beginPath() {},
    closePath() {},
    rect() {},
    clip() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    ellipse() {},
    stroke() {
      drawCount += 1;
    },
    fillText() {
      drawCount += 1;
    },
    measureText() {
      return {
        actualBoundingBoxAscent: 12,
        actualBoundingBoxDescent: 3
      };
    },
    fill() {
      drawCount += 1;
    },
    fillRect() {
      drawCount += 1;
      renderOperations.push({
        owner: ownerName,
        operation: "fillRect",
        fillStyle: this.fillStyle,
        globalAlpha: this.globalAlpha,
        composite: this.globalCompositeOperation
      });
    },
    drawImage(source) {
      drawCount += 1;
      const sourceType = source instanceof browserWindow.Image
        ? "image"
        : "canvas";

      if (sourceType === "image") {
        imageDrawCount += 1;
      }
      renderOperations.push({
        owner: ownerName,
        operation: "drawImage",
        sourceType
      });
    },
    createLinearGradient() {
      gradientKinds.push("linear");
      return makeGradient();
    },
    createRadialGradient() {
      gradientKinds.push("radial");
      return makeGradient();
    },
    createConicGradient() {
      gradientKinds.push("angular");
      return makeGradient();
    }
  };
}

function change(window, control, value) {
  if (value !== undefined) {
    control.value = value;
  }
  control.dispatchEvent(new window.Event("change"));
}

function input(window, control, value) {
  if (value !== undefined) {
    control.value = value;
  }
  control.dispatchEvent(new window.Event("input"));
}

(async () => {
  assert.match(source, /\.app\s*\{[\s\S]*?height:\s*100dvh/);
  assert.match(source, /\.controls\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(source, /\.stage-wrap\s*\{[\s\S]*?overflow:\s*hidden/);
  const posterCopyRule = fs.readFileSync(path.join(projectRoot,"js/shared/poster-text.css"),"utf8").match(/\.poster-copy\s*\{([\s\S]*?)\}/);

  assert.ok(posterCopyRule, "poster copy styling must exist");
  assert.doesNotMatch(
    posterCopyRule[1],
    /z-index\s*:/,
    "the overlay must share the poster stacking context to blend with Canvas"
  );
  assert.match(source, /\.poster\s*\{[\s\S]*?isolation:\s*isolate/);

  const dom = await JSDOM.fromFile(pagePath, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.requestAnimationFrame = callback => {
        animationCallbacks.set(++animationId, callback);
        return animationId;
      };
      window.cancelAnimationFrame = id => animationCallbacks.delete(id);
      Object.defineProperty(window, "devicePixelRatio", {
        configurable: true,
        value: 2
      });
      window.Image = class FakeImage {
        constructor() {
          this.naturalWidth = 2500;
          this.naturalHeight = 1560;
        }

        set src(value) {
          this.source = value;
          imageSources.push(value);
          queueMicrotask(() => {
            if (this.onload) {
              this.onload();
            }
          });
        }
      };
      window.URL.createObjectURL = () => "blob:test-image";
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = function click() {
        settingsDownloadCount += 1;
        settingsDownloadNames.push(this.download);
      };
      window.HTMLCanvasElement.prototype.getContext = function getContext() {
        return makeContext(this, window);
      };
      window.HTMLCanvasElement.prototype.toDataURL = () => {
        return "data:image/png;base64,canvas-background";
      };
      window.HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
        callback(new window.Blob(["png"], { type: "image/png" }));
      };
    }
  });

  await new Promise((resolve) => {
    dom.window.addEventListener("load", resolve, { once: true });
  });
  await new Promise((resolve) => setImmediate(resolve));

  const document = dom.window.document;
  const ids = Array.from(document.querySelectorAll("[id]")).map((element) => {
    return element.id;
  });
  const family = document.querySelector("#geometry-family");
  const aesthetic = document.querySelector("#aesthetic");
  const treatment = document.querySelector("#gradient-treatment");
  const flow = document.querySelector("#gradient-flow");
  const continuity = document.querySelector("#gradient-continuity");
  const angularWrap = document.querySelector("#angular-wrap");
  const mappingSpace = document.querySelector("#mapping-space");
  const ringPhase = document.querySelector("#ring-phase").closest(".control");
  const shapePhase = document.querySelector("#phase-step").closest(".control");
  const columnControl = document.querySelector("#columns").closest(".control");
  const radialOrigin = document.querySelector(
    '[data-geometry-only="rings sectors polar"]'
  );
  const ringPanel = document.querySelector(
    'fieldset[data-geometry-only="rings polar"]'
  );
  const sectorPanel = document.querySelector(
    'fieldset[data-geometry-only="sectors polar"]'
  );
  const polarPanel = document.querySelector(
    'fieldset[data-geometry-only="polar"]'
  );
  const palettePanel = document.querySelector("#palette-count").closest(
    "fieldset"
  );
  const blendedPanel = document.querySelector(
    'fieldset[data-aesthetic-only="blended"]'
  );
  const staggeredPanel = document.querySelector(
    'fieldset[data-aesthetic-only="staggered"]'
  );
  const legacyColorPanel = document.querySelector(
    'fieldset[data-aesthetic-only="blended staggered"]'
  );

  assert.equal(ids.length, new Set(ids).size, "HTML ids must be unique");
  assert.deepEqual(
    Array.from(flow.options).map((option) => option.value),
    [
      "along",
      "across",
      "radial",
      "angular",
      "horizontal",
      "vertical",
      "diagonal",
      "radial-angular"
    ]
  );
  assert.deepEqual(
    Array.from(continuity.options).map((option) => option.value),
    ["reset", "continuous", "phase"]
  );
  assert.deepEqual(
    Array.from(angularWrap.options).map((option) => option.value),
    ["seamless", "mirror", "repeat"]
  );
  assert.equal(family.value, "columns");
  assert.equal(treatment.value, "continuous");
  assert.equal(flow.value, "along");
  assert.equal(continuity.value, "phase");
  assert.equal(angularWrap.closest(".control").hidden, true);
  assert.equal(mappingSpace.closest(".control").hidden, false);
  assert.equal(shapePhase.hidden, false);
  assert.equal(radialOrigin.hidden, true);
  assert.equal(columnControl.hidden, false);
  assert.equal(document.querySelectorAll(".poster-copy .event").length, 1);
  assert.equal(
    document.querySelector(".wordmark img").getAttribute("src"),
    "logo_be_arts.svg"
  );

  const imageEnabled = document.querySelector("#background-image-enabled");
  const lightGeometryEnabled = document.querySelector(
    "#light-geometry-enabled"
  );
  const imageOverlayEnabled = document.querySelector(
    "#image-overlay-enabled"
  );
  const imageOverlayControls = document.querySelector(
    "[data-image-overlay-controls]"
  );
  const imageOverlayColor = document.querySelector("#image-overlay-color");
  const imageOverlayOpacity = document.querySelector(
    "#image-overlay-opacity"
  );
  const imageOverlayBlend = document.querySelector("#image-overlay-blend");
  const imageControls = document.querySelector("[data-image-controls]");
  const imageFit = document.querySelector("#background-image-fit");
  const imageBlend = document.querySelector("#background-image-blend");
  const imageFilename = document.querySelector(
    "#background-image-filename"
  );
  const imageStatus = document.querySelector("#background-image-status");
  const downloadSettings = document.querySelector("#download-settings");
  const loadSettingsFile = document.querySelector("#load-settings-file");
  const settingsStatus = document.querySelector("#settings-status span");
  const exportScale = document.querySelector("#export-scale");
  const exportPng = document.querySelector("#export-png");
  const exportStatus = document.querySelector("#export-status span");

  assert.equal(imageEnabled.checked, false);
  assert.match(
    imageSources[0],
    /^data:image\/webp;base64,/,
    "the default image must load from an export-safe embedded source"
  );
  assert.equal(lightGeometryEnabled.checked, true);
  assert.equal(imageOverlayEnabled.checked, false);
  assert.equal(imageControls.hidden, true);
  assert.equal(imageOverlayControls.hidden, true);
  assert.equal(imageDrawCount, 0, "the disabled image must never be drawn");
  assert.equal(
    imageFilename.textContent,
    "El_nacimiento_de_Venus,_por_Sandro_Botticelli.jpg"
  );
  assert.match(imageStatus.textContent, /^Off/);
  assert.ok(downloadSettings);
  assert.equal(loadSettingsFile.accept, "application/json,.json");
  assert.match(settingsStatus.textContent, /Ready to save/);
  assert.deepEqual(
    Array.from(exportScale.options).map((option) => option.value),
    ["1", "2", "4"]
  );
  assert.match(exportStatus.textContent, /2400 × 1500/);
  assert.deepEqual(
    Array.from(imageFit.options).map((option) => option.value),
    ["cover", "contain", "stretch"]
  );
  assert.deepEqual(
    Array.from(imageBlend.options).map((option) => option.value),
    [
      "normal",
      "multiply",
      "screen",
      "overlay",
      "soft-light",
      "color",
      "luminosity"
    ]
  );
  assert.deepEqual(
    Array.from(imageOverlayBlend.options).map((option) => option.value),
    [
      "normal",
      "multiply",
      "screen",
      "overlay",
      "soft-light",
      "color",
      "luminosity"
    ]
  );

  const assertImageBeforeGeometry = (operations, message) => {
    const mainOperations = operations.filter((operation) => {
      return operation.owner === "light-canvas";
    });
    const backgroundIndex = mainOperations.findIndex((operation) => {
      return operation.operation === "fillRect";
    });
    const imageIndex = mainOperations.findIndex((operation) => {
      return operation.operation === "drawImage" &&
        operation.sourceType === "image";
    });
    const geometryIndex = mainOperations.findIndex((operation, index) => {
      return index > imageIndex && (
        operation.operation === "fillRect" ||
        (
          operation.operation === "drawImage" &&
          operation.sourceType === "canvas"
        )
      );
    });

    assert.ok(backgroundIndex >= 0, `${message}: background is drawn`);
    assert.ok(imageIndex > backgroundIndex, `${message}: image follows background`);
    assert.ok(geometryIndex > imageIndex, `${message}: geometry follows image`);
  };

  imageEnabled.checked = true;
  const paletteOperationsStart = renderOperations.length;
  imageEnabled.dispatchEvent(new dom.window.Event("input"));
  assert.equal(imageControls.hidden, false);
  assert.equal(imageOverlayControls.hidden, true);
  assert.equal(imageEnabled.getAttribute("aria-expanded"), "true");
  assert.match(imageStatus.textContent, /^Ready/);
  assert.equal(imageDrawCount, 1);
  assertImageBeforeGeometry(
    renderOperations.slice(paletteOperationsStart),
    "palette rendering"
  );

  const imageOnlyOperationsStart = renderOperations.length;

  lightGeometryEnabled.checked = false;
  lightGeometryEnabled.dispatchEvent(new dom.window.Event("input"));
  const imageOnlyOperations = renderOperations.slice(
    imageOnlyOperationsStart
  ).filter((operation) => operation.owner === "light-canvas");

  assert.ok(imageOnlyOperations.some((operation) => {
    return operation.operation === "drawImage" &&
      operation.sourceType === "image";
  }), "image-only mode must retain the image");
  assert.ok(!imageOnlyOperations.some((operation) => {
    return operation.operation === "drawImage" &&
      operation.sourceType === "canvas";
  }), "image-only mode must omit light geometry");

  imageOverlayEnabled.checked = true;
  imageOverlayEnabled.dispatchEvent(new dom.window.Event("input"));
  assert.equal(imageOverlayControls.hidden, false);
  assert.equal(imageOverlayEnabled.getAttribute("aria-expanded"), "true");
  imageOverlayColor.value = "#ff3366";
  imageOverlayOpacity.value = "100";
  imageOverlayBlend.value = "normal";
  const overlayOperationsStart = renderOperations.length;

  imageOverlayOpacity.dispatchEvent(new dom.window.Event("input"));
  const overlayOperations = renderOperations.slice(overlayOperationsStart);

  assert.ok(overlayOperations.some((operation) => {
    return operation.owner === "light-canvas" &&
      operation.operation === "fillRect" &&
      operation.fillStyle === "#ff3366" &&
      operation.globalAlpha === 1;
  }), "the optional opaque image overlay must render above the image");
  assert.equal(
    document.querySelector("#image-overlay-opacity-output").value,
    "100%"
  );

  lightGeometryEnabled.checked = true;
  lightGeometryEnabled.dispatchEvent(new dom.window.Event("input"));
  imageOverlayEnabled.checked = false;
  imageOverlayEnabled.dispatchEvent(new dom.window.Event("input"));
  assert.equal(imageOverlayControls.hidden, true);

  const legacyOperationsStart = renderOperations.length;
  change(dom.window, aesthetic, "blended");
  assertImageBeforeGeometry(
    renderOperations.slice(legacyOperationsStart),
    "blended rendering"
  );

  const imageCombinations = [];
  ["columns", "rings", "sectors", "polar"].forEach((geometryFamily) => {
    ["palette", "blended", "staggered"].forEach((style) => {
      const drawsBefore = imageDrawCount;

      change(dom.window, family, geometryFamily);
      change(dom.window, aesthetic, style);
      assert.ok(
        imageDrawCount > drawsBefore,
        `image must render with ${geometryFamily}/${style}`
      );
      imageCombinations.push(`${geometryFamily}/${style}`);
    });
  });
  assert.equal(imageCombinations.length, 12);

  input(dom.window, document.querySelector("#background-image-blur"), "8");
  input(
    dom.window,
    document.querySelector("#background-image-brightness"),
    "135"
  );
  change(dom.window, imageFit, "contain");
  change(dom.window, imageBlend, "soft-light");
  document.querySelector("#background-image-filters-reset").click();
  assert.equal(document.querySelector("#background-image-blur").value, "0");
  assert.equal(
    document.querySelector("#background-image-brightness").value,
    "100"
  );

  imageEnabled.checked = false;
  imageEnabled.dispatchEvent(new dom.window.Event("input"));
  const imageDrawsWhileDisabled = imageDrawCount;
  input(dom.window, document.querySelector("#background-image-opacity"), "42");
  assert.equal(imageControls.hidden, true);
  assert.equal(imageEnabled.getAttribute("aria-expanded"), "false");
  assert.equal(
    imageDrawCount,
    imageDrawsWhileDisabled,
    "edited image settings must have no rendering effect while disabled"
  );
  assert.match(imageStatus.textContent, /^Off/);

  change(dom.window, family, "columns");
  change(dom.window, aesthetic, "palette");

  const wordmark = document.querySelector("#wordmark");
  const eventCopy = document.querySelector("#event-copy");
  const eventCopyVariant = document.querySelector("#event-copy-variant");
  const eventTextEffect = document.querySelector("#event-text-effect");
  const eventTextOpacity = document.querySelector("#event-text-opacity");
  const logoEffect = document.querySelector("#logo-effect");
  const eventAccentControl = document.querySelector(
    "[data-event-accent-control]"
  );
  const logoAccentControl = document.querySelector(
    "[data-logo-accent-control]"
  );
  const logoStrengthControl = document.querySelector(
    "[data-logo-strength-control]"
  );
  const logoBlurControl = document.querySelector(
    "[data-logo-blur-control]"
  );
  const logoHueControl = document.querySelector(
    "[data-logo-hue-control]"
  );
  const wordmarkVector = document.querySelector(".wordmark-vector");
  const wordmarkImage = document.querySelector(".wordmark-image");
  const wordmarkEffect = document.querySelector(".wordmark-effect");

  assert.ok(wordmarkVector, "a directly styled logo vector must exist");
  assert.equal(wordmarkVector.querySelectorAll("path").length, 5);

  assert.deepEqual(
    Array.from(eventCopyVariant.options).map((option) => option.value),
    ["museum", "logo", "custom", "none", "renaissance", "logo-renaissance", "manifesto", "manifesto-title"]
  );
  assert.equal(eventCopy.dataset.copyVariant, "museum");
  change(dom.window, eventCopyVariant, "renaissance");
  assert.equal(eventCopy.dataset.copyVariant, "renaissance");
  assert.deepEqual(
    Array.from(document.querySelectorAll(".event-venue > span")).map(
      (element) => element.textContent
    ),
    ["The New Renaissance"]
  );
  assert.deepEqual(
    Array.from(document.querySelectorAll(".renaissance-dates > span")).map(
      (element) => element.textContent
    ),
    ["November 2026", "January 2028"]
  );
  assert.equal(document.querySelectorAll(".renaissance-date").length, 2);
  assert.doesNotMatch(document.querySelector(".renaissance-dates").textContent, /[–—-]/);
  assert.equal(
    document.querySelector(".renaissance-footnote").textContent,
    "Meaning and Art in the age of AI"
  );
  assert.deepEqual(
    Array.from(document.querySelectorAll(".event-footer span")).map(
      (element) => element.textContent
    ),
    ["Meaning and Art in the age of AI", "beartgroup.com"]
  );
  assert.match(
    source,
    /data-copy-variant="renaissance"[^}]*\.event-venue\s*\{[^}]*font-size:\s*6\.4cqw/
  );
  assert.match(
    source,
    /data-copy-variant="renaissance"[^}]*\.renaissance-dates\s*\{[^}]*font-size:\s*4\.1cqw/
  );
  assert.match(
    source,
    /data-copy-variant="renaissance"[^}]*\.renaissance-date\s*\{[^}]*letter-spacing:\s*0\.5cqw/
  );
  assert.match(
    source,
    /\.event\[data-copy-variant="renaissance"\]\s*\{[^}]*height:\s*24cqw[^}]*grid-template-rows:\s*auto auto auto[^}]*align-content:\s*space-between[^}]*gap:\s*0/
  );
  assert.doesNotMatch(source, /margin-bottom:\s*2\.2cqw/);
  assert.doesNotMatch(source, /padding:\s*1\.9cqw 0/);
  assert.doesNotMatch(source, /margin-top:\s*1\.25cqw/);
  assert.match(
    source,
    /data-copy-variant="renaissance"[^}]*\.speakers\s*\{[^}]*border-top:\s*0[^}]*border-bottom:\s*0/
  );
  assert.equal(
    dom.window.getComputedStyle(
      document.querySelector(".renaissance-footnote")
    ).maxWidth,
    "64%"
  );
  change(dom.window, eventCopyVariant, "manifesto-title");
  assert.deepEqual(
    Array.from(document.querySelectorAll(".event-venue [data-export-text]")).map(element => element.textContent),
    ["NO", "SOMOS", "ESPECTADORES"]
  );
  assert.equal(dom.window.getComputedStyle(document.querySelector(".wordmark")).display, "none");
  assert.match(dom.window.getComputedStyle(document.querySelector(".event-venue")).fontFamily, /Solea/);
  assert.equal(document.querySelector("[data-manifesto-controls]").hidden, true);
  change(dom.window, eventCopyVariant, "museum");
  assert.equal(eventCopy.dataset.copyVariant, "museum");
  assert.match(document.querySelector(".event-venue").textContent, /Museo/);
  assert.equal(document.querySelectorAll(".speakers li").length, 4);

  assert.deepEqual(
    Array.from(eventTextEffect.options).map((option) => option.value),
    ["solid-black", "solid-white", "invert", "difference", "accent"]
  );
  assert.deepEqual(
    Array.from(logoEffect.options).map((option) => option.value),
    [
      "solid-black",
      "solid-white",
      "accent",
      "invert",
      "difference",
      "glass",
      "hypercolor",
      "hue"
    ]
  );
  assert.equal(wordmark.dataset.logoEffect, "invert");
  assert.equal(eventCopy.dataset.textEffect, "invert");
  assert.equal(eventTextOpacity.value, "100");
  assert.equal(eventCopy.style.getPropertyValue("--text-opacity"), "1");
  assert.equal(eventAccentControl.hidden, true);
  assert.equal(logoAccentControl.hidden, true);
  assert.equal(logoStrengthControl.hidden, false);
  assert.equal(logoBlurControl.hidden, true);
  assert.equal(logoHueControl.hidden, true);

  change(dom.window, logoEffect, "accent");
  assert.equal(wordmark.dataset.logoEffect, "accent");
  assert.equal(dom.window.getComputedStyle(wordmarkImage).opacity, "0");
  assert.notEqual(dom.window.getComputedStyle(wordmarkVector).opacity, "0");
  assert.equal(dom.window.getComputedStyle(wordmarkEffect).opacity, "0");

  change(dom.window, logoEffect, "difference");
  assert.equal(wordmark.dataset.logoEffect, "difference");
  assert.equal(
    dom.window.getComputedStyle(wordmark).mixBlendMode,
    "difference"
  );
  assert.notEqual(dom.window.getComputedStyle(wordmarkVector).opacity, "0");
  assert.equal(dom.window.getComputedStyle(wordmarkEffect).opacity, "0");
  change(dom.window, logoEffect, "invert");

  change(dom.window, eventTextEffect, "difference");
  assert.equal(eventCopy.dataset.textEffect, "difference");
  assert.equal(wordmark.dataset.logoEffect, "invert");
  assert.equal(eventAccentControl.hidden, false);

  input(dom.window, eventTextOpacity, "37");
  assert.equal(eventCopy.style.getPropertyValue("--text-opacity"), "0.37");
  assert.equal(
    document.querySelector("#event-text-opacity-output").value,
    "37%"
  );
  input(dom.window, eventTextOpacity, "100");

  change(dom.window, logoEffect, "glass");
  assert.equal(wordmark.dataset.logoEffect, "glass");
  assert.equal(eventCopy.dataset.textEffect, "difference");
  assert.equal(logoBlurControl.hidden, false);
  assert.equal(logoHueControl.hidden, true);

  change(dom.window, logoEffect, "hue");
  assert.equal(logoAccentControl.hidden, false);
  assert.equal(logoBlurControl.hidden, true);
  assert.equal(logoHueControl.hidden, false);

  const eventAccent = document.querySelector("#event-text-accent");
  const logoAccent = document.querySelector("#logo-accent");
  const matchAccent = document.querySelector("#match-text-accent");

  eventAccent.value = "#ff3366";
  eventAccent.dispatchEvent(new dom.window.Event("input"));
  matchAccent.checked = true;
  matchAccent.dispatchEvent(new dom.window.Event("input"));
  assert.equal(logoAccent.disabled, true);
  assert.equal(logoAccentControl.hidden, true);
  assert.equal(
    wordmark.style.getPropertyValue("--logo-accent"),
    "#ff3366"
  );

  const paletteSource = document.querySelector("#palette-source");
  const paletteCount = document.querySelector("#palette-count");
  const paletteType = document.querySelector("#palette-type");
  const baseHue = document.querySelector("#base-hue");
  const baseHueControl = document.querySelector("[data-base-hue-control]");
  const manualSwatches = document.querySelector("#palette-swatches");
  const manualActions = document.querySelector(
    ".palette-actions[data-palette-source-only='manual']"
  );
  const generatedSwatches = Array.from(
    document.querySelectorAll(".generated-swatch")
  );
  const generatedOnlyPanels = Array.from(
    document.querySelectorAll('[data-palette-source-only="generated"]')
  );
  const generatedTypes = [
    "random",
    "monochrome",
    "analogous",
    "complementary",
    "split",
    "triadic",
    "ocean",
    "sunset",
    "candy",
    "forest",
    "neon",
    "grayscale"
  ];
  const fixedTypes = new Set([
    "ocean",
    "sunset",
    "candy",
    "forest",
    "neon",
    "grayscale"
  ]);

  assert.equal(paletteSource.value, "manual");
  assert.equal(paletteCount.max, "8");
  assert.equal(manualSwatches.hidden, false);
  assert.equal(manualActions.hidden, false);
  assert.ok(generatedOnlyPanels.every((panel) => panel.hidden));
  assert.deepEqual(
    Array.from(paletteType.options).map((option) => option.value),
    generatedTypes
  );

  change(dom.window, paletteSource, "generated");
  assert.equal(paletteCount.max, "16");
  assert.equal(paletteCount.value, "8");
  assert.equal(manualSwatches.hidden, true);
  assert.equal(manualActions.hidden, true);
  assert.ok(generatedOnlyPanels.every((panel) => !panel.hidden));
  assert.equal(
    generatedSwatches.filter((swatch) => !swatch.hidden).length,
    8
  );

  generatedTypes.forEach((type) => {
    change(dom.window, paletteType, type);
    assert.equal(baseHueControl.hidden, fixedTypes.has(type));
    assert.equal(baseHue.disabled, fixedTypes.has(type));
    assert.equal(
      generatedSwatches.filter((swatch) => !swatch.hidden).length,
      8,
      `${type} must expose all generated swatches`
    );
  });
  assert.ok(
    gradientColors.slice(-1000).some((color) => {
      return typeof color === "string" && /, 0%,/.test(color);
    }),
    "the grayscale generated palette must reach Canvas gradient stops"
  );

  change(dom.window, paletteType, "random");
  input(dom.window, paletteCount, "16");
  assert.equal(
    generatedSwatches.filter((swatch) => !swatch.hidden).length,
    16
  );

  const generatedColors = () => generatedSwatches
    .filter((swatch) => !swatch.hidden)
    .map((swatch) => swatch.style.getPropertyValue("--swatch-color"));
  const stableColors = generatedColors();

  ["columns", "rings", "sectors", "polar"].forEach((geometryFamily) => {
    const drawsBefore = drawCount;

    change(dom.window, family, geometryFamily);
    assert.ok(
      drawCount > drawsBefore,
      `generated palette must render ${geometryFamily}`
    );
    assert.deepEqual(
      generatedColors(),
      stableColors,
      `changing to ${geometryFamily} must not regenerate the palette`
    );
  });

  const paletteSeed = document.querySelector("#palette-seed");
  const previousSeed = paletteSeed.value;
  document.querySelector("#shuffle-generated-palette").click();
  assert.notEqual(paletteSeed.value, previousSeed);
  assert.notDeepEqual(generatedColors(), stableColors);

  change(dom.window, paletteSource, "manual");
  assert.equal(paletteCount.max, "8");
  assert.equal(paletteCount.value, "4");
  assert.equal(manualSwatches.hidden, false);
  assert.equal(manualActions.hidden, false);
  change(dom.window, paletteSource, "generated");
  assert.equal(paletteCount.max, "16");
  assert.equal(paletteCount.value, "16");
  change(dom.window, document.querySelector("#preset"), "saturated");
  assert.equal(paletteSource.value, "manual");
  assert.equal(paletteCount.value, "4");
  assert.equal(family.value, "columns");

  document.querySelector("#ring-count").value = "4";
  document.querySelector("#sector-count").value = "6";

  for (const geometryFamily of ["rings", "sectors", "polar"]) {
    change(dom.window, family, geometryFamily);
    assert.equal(columnControl.hidden, true);
    assert.equal(radialOrigin.hidden, false);
    assert.equal(ringPanel.hidden, geometryFamily === "sectors");
    assert.equal(sectorPanel.hidden, geometryFamily === "rings");
    assert.equal(polarPanel.hidden, geometryFamily !== "polar");

    change(dom.window, flow, "along");
    assert.equal(
      angularWrap.closest(".control").hidden,
      geometryFamily === "sectors"
    );

    change(dom.window, continuity, "phase");
    if (geometryFamily !== "sectors") {
      assert.equal(ringPhase.hidden, false);
    }
    assert.equal(shapePhase.hidden, geometryFamily === "rings");
    assert.equal(mappingSpace.closest(".control").hidden, true);
    if (geometryFamily === "sectors") {
      assert.equal(
        document.querySelector("#phase-step-label").textContent,
        "Per-sector phase"
      );
    }
    change(dom.window, continuity, "continuous");
    assert.equal(mappingSpace.closest(".control").hidden, false);
    change(dom.window, continuity, "reset");

    for (const style of ["palette", "blended", "staggered"]) {
      change(dom.window, aesthetic, style);
      assert.equal(palettePanel.hidden, false);
      assert.equal(blendedPanel.hidden, true);
      assert.equal(staggeredPanel.hidden, true);
      assert.equal(legacyColorPanel.hidden, true);
    }
  }

  change(dom.window, family, "columns");
  change(dom.window, aesthetic, "blended");
  assert.equal(blendedPanel.hidden, false);
  assert.equal(staggeredPanel.hidden, true);
  assert.equal(legacyColorPanel.hidden, false);
  change(dom.window, aesthetic, "staggered");
  assert.equal(blendedPanel.hidden, true);
  assert.equal(staggeredPanel.hidden, false);
  assert.equal(legacyColorPanel.hidden, false);

  assert.equal(document.querySelector("#center-x").min, "-50");
  assert.equal(document.querySelector("#center-x").max, "150");
  assert.equal(document.querySelector("#center-y").min, "-50");
  assert.equal(document.querySelector("#center-y").max, "150");
  assert.ok(document.querySelector("#mirror-symmetry"));

  const preset = document.querySelector("#preset");
  const requiredPresets = [
    ["luminousRings", "rings", "along", "phase"],
    ["graphicRings", "rings", "across", "continuous"],
    ["radialRays", "sectors", "along", "phase"],
    ["mirroredSectors", "sectors", "across", "continuous"],
    ["polarCheckerboard", "polar", "radial-angular", "phase"]
  ];

  requiredPresets.forEach(([name, geometryFamily, expectedFlow, expectedContinuity]) => {
    change(dom.window, preset, name);
    assert.equal(family.value, geometryFamily);
    assert.equal(flow.value, expectedFlow);
    assert.equal(continuity.value, expectedContinuity);
    assert.equal(treatment.value, "continuous");
  });

  const allFlows = [
    "along",
    "across",
    "radial",
    "angular",
    "horizontal",
    "vertical",
    "diagonal",
    "radial-angular"
  ];

  ["columns", "rings", "sectors", "polar"].forEach((geometryFamily) => {
    change(dom.window, family, geometryFamily);
    ["reset", "continuous", "phase"].forEach((continuityMode) => {
      change(dom.window, continuity, continuityMode);
      allFlows.forEach((flowMode) => {
        change(dom.window, flow, flowMode);
      });
    });
  });

  change(dom.window, family, "rings");
  change(dom.window, flow, "along");
  const stopsBeforeContinuousRing = gradientStopCount;
  change(dom.window, treatment, "continuous");
  assert.ok(
    gradientStopCount - stopsBeforeContinuousRing > 100,
    "continuous rings must add many color stops inside each shape"
  );
  const gradientsBeforeSolid = gradientKinds.length;
  change(dom.window, treatment, "solid");
  assert.equal(
    gradientKinds.length,
    gradientsBeforeSolid,
    "solid treatment must remain a deliberate non-gradient option"
  );
  assert.equal(flow.closest(".control").hidden, true);
  assert.equal(continuity.closest(".control").hidden, true);
  assert.equal(ringPhase.hidden, false);
  change(dom.window, treatment, "continuous");
  assert.equal(flow.closest(".control").hidden, false);

  change(dom.window, family, "polar");
  const polarMappingControl = document.querySelector(
    "[data-polar-mapping-control]"
  );
  change(dom.window, flow, "along");
  assert.equal(polarMappingControl.hidden, false);
  change(dom.window, flow, "radial");
  assert.equal(polarMappingControl.hidden, true);
  change(dom.window, treatment, "solid");
  assert.equal(polarMappingControl.hidden, false);
  change(dom.window, treatment, "continuous");

  ["flat", "alternating", "wave", "random"].forEach((mode) => {
    change(dom.window, document.querySelector("#ring-variation"), mode);
  });
  ["flat", "alternating", "mirrored", "spiral", "random"].forEach(
    (mode) => {
      change(dom.window, document.querySelector("#sector-variation"), mode);
    }
  );
  ["radial", "angular", "combined"].forEach((mode) => {
    change(dom.window, document.querySelector("#polar-mapping"), mode);
  });
  ["continuous", "alternating", "checkerboard"].forEach((mode) => {
    change(dom.window, document.querySelector("#polar-assignment"), mode);
  });

  change(dom.window, family, "columns");
  change(dom.window, aesthetic, "palette");
  document.querySelector("#palette-offset").value = "200";
  document.querySelector("#palette-span").value = "25";
  document.querySelector("#palette-overflow").value = "repeat";
  document.querySelector("#palette-offset").dispatchEvent(
    new dom.window.Event("input")
  );

  async function importSettingsFile(contents, filename = "poster.json") {
    Object.defineProperty(loadSettingsFile, "files", {
      configurable: true,
      value: [{
        name: filename,
        size: contents.length,
        text: async () => contents
      }]
    });
    loadSettingsFile.dispatchEvent(new dom.window.Event("change"));
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  }

  const familyBeforeInvalidImport = family.value;

  await importSettingsFile("not json", "broken.json");
  assert.equal(family.value, familyBeforeInvalidImport);
  assert.match(settingsStatus.textContent, /not valid JSON/);

  await importSettingsFile(JSON.stringify({
    format: "canvas-light-geometry-settings",
    version: 1,
    controls: {
      aesthetic: "palette",
      geometryFamily: "rings",
      eventCopyVariant: "renaissance",
      eventTextOpacity: 46,
      lightGeometryEnabled: false,
      imageOverlayEnabled: true,
      imageOverlayColor: "#123abc",
      imageOverlayOpacity: 72,
      imageOverlayBlend: "multiply",
      paletteSource: "manual",
      paletteCount: 3,
      seed: 445566,
      futureControl: "ignored"
    },
    palette: {
      manualColors: ["#123456", "#abcdef", "#fedcba"],
      counts: { manual: 3, generated: 12 }
    },
    image: {
      kind: "default",
      filename: "El_nacimiento_de_Venus,_por_Sandro_Botticelli.jpg"
    }
  }));

  assert.equal(family.value, "rings");
  assert.equal(eventCopyVariant.value, "renaissance");
  assert.equal(eventCopy.dataset.copyVariant, "renaissance");
  assert.equal(lightGeometryEnabled.checked, false);
  assert.equal(imageOverlayEnabled.checked, true);
  assert.equal(imageOverlayColor.value, "#123abc");
  assert.equal(imageOverlayOpacity.value, "72");
  assert.equal(imageOverlayBlend.value, "multiply");
  assert.equal(document.querySelector("#seed").value, "445566");
  assert.equal(document.querySelector("#palette-count").value, "3");
  assert.equal(document.querySelector(".palette-color").value, "#123456");
  assert.equal(eventCopy.style.getPropertyValue("--text-opacity"), "0.46");
  assert.equal(settingsStatus.textContent, "Settings loaded.");

  downloadSettings.click();
  assert.equal(settingsDownloadCount, 1);
  assert.deepEqual(settingsDownloadNames, [
    "canvas-light-geometry-settings.json"
  ]);
  assert.equal(settingsStatus.textContent, "Current settings downloaded.");

  await importSettingsFile(JSON.stringify({
    format: "canvas-light-geometry-settings",
    version: 1,
    controls: { backgroundImageEnabled: true },
    palette: {
      manualColors: [],
      counts: { manual: 3, generated: 12 }
    },
    image: { kind: "local", filename: "custom-poster.jpg" }
  }), "local-image-settings.json");

  assert.equal(imageEnabled.checked, true);
  assert.equal(imageFilename.textContent, "custom-poster.jpg");
  assert.equal(imageStatus.textContent, "Select this local image again");
  assert.match(settingsStatus.textContent, /Select custom-poster.jpg again/);
  imageEnabled.checked = false;
  imageEnabled.dispatchEvent(new dom.window.Event("input"));

  change(dom.window, exportScale, "4");
  assert.match(exportStatus.textContent, /4800 × 3000/);
  exportPng.click();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(exportPng.disabled, false);
  assert.equal(exportStatus.textContent, "Exported 4800 × 3000 px PNG.");
  assert.match(settingsDownloadNames.at(-1), /be-art-rings-palette-445566-4x\.png/);
  assert.equal(document.querySelector("#light-canvas").width, 2400);
  assert.equal(document.querySelector("#light-canvas").height, 1500);

  const movingAnimated = document.querySelector("#moving-animated");
  const movingTime = document.querySelector("#moving-time");
  lightGeometryEnabled.checked = true;
  input(dom.window, lightGeometryEnabled);
  change(dom.window, family, "moving");
  assert.equal(document.querySelector('[data-geometry-only="moving"]').hidden, false);
  assert.equal(columnControl.hidden, true);
  assert.equal(animationCallbacks.size, 1, "moving geometry starts one animation loop");
  function frame(now) {
    const callbacks = [...animationCallbacks.values()];
    animationCallbacks.clear();
    callbacks.forEach(callback => callback(now));
  }
  frame(0);
  frame(50);
  assert.ok(Number(movingTime.value) > 0);
  assert.equal(animationCallbacks.size, 1);
  movingAnimated.checked = false;
  input(dom.window, movingAnimated);
  assert.equal(animationCallbacks.size, 0, "pause cancels the animation loop");
  const pausedTime = movingTime.value;
  for (const style of ["palette", "blended", "staggered"]) {
    change(dom.window, aesthetic, style);
    const drawsBefore = drawCount;
    input(dom.window, document.querySelector("#moving-count"), "60");
    input(dom.window, document.querySelector("#moving-breathing"), "100");
    assert.ok(drawCount > drawsBefore, `${style} renders moving cells`);
    assert.equal(movingTime.value, pausedTime, "controls preserve the paused frame time");
  }
  const serialized = dom.window.LightColumns.settingsIO.serializeControls({
    movingTime, movingAnimated, movingCount: document.querySelector("#moving-count")
  });
  assert.equal(serialized.movingTime, Number(pausedTime));
  assert.equal(serialized.movingAnimated, false);
  assert.equal(serialized.movingCount, 60);
  exportPng.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exportPng.disabled, false);
  assert.match(settingsDownloadNames.at(-1), /be-art-moving-staggered/);
  assert.equal(movingTime.value, pausedTime, "export preserves the current composition");
  document.querySelector("#moving-regenerate").click();
  assert.equal(movingTime.value, "0");
  movingAnimated.checked = true;
  input(dom.window, movingAnimated);
  assert.equal(animationCallbacks.size, 1);
  change(dom.window, family, "columns");
  assert.equal(animationCallbacks.size, 0, "static families stop animation");

  change(dom.window, family, "nested");
  assert.equal(document.querySelector('[data-geometry-only="nested"]').hidden, false);
  document.querySelector('#nested-color-study').click();
  assert.equal(family.value, 'nested');
  assert.equal(aesthetic.value, 'palette');
  assert.equal(treatment.value, 'solid');
  assert.equal(document.querySelector('#column-glow').value, '0');
  assert.equal(document.querySelector('#column-opacity').value, '1');
  const nestedBefore = drawCount;
  for (const [id, value] of [['nested-count', '5'], ['nested-ratio', '70'], ['nested-ratio-change', '5'], ['nested-offset-x', '-30'], ['nested-offset-y', '60']]) {
    input(dom.window, document.getElementById(id), value);
    assert.ok(document.getElementById(`${id}-output`).value.startsWith(value));
  }
  assert.ok(drawCount > nestedBefore);
  change(dom.window, document.querySelector('#nested-shape'), 'rectangle');
  assert.equal(animationCallbacks.size, 0, 'nested geometry is static');
  const nestedControls = Object.fromEntries(['nested-count', 'nested-ratio', 'nested-ratio-change', 'nested-offset-x', 'nested-offset-y', 'nested-shape'].map(id => [id, document.getElementById(id)]));
  const nestedSaved = dom.window.LightColumns.settingsIO.serializeControls(nestedControls);
  input(dom.window, document.querySelector('#nested-ratio'), '30');
  dom.window.LightColumns.settingsIO.applyControlValues(nestedControls, nestedSaved);
  assert.equal(document.querySelector('#nested-ratio').value, '70');
  assert.equal(nestedSaved['nested-ratio-change'], 5);
  exportPng.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exportPng.disabled, false);
  assert.match(settingsDownloadNames.at(-1), /be-art-nested-palette/);

  // Pointer rotation holds the actual rendered angle, including across 0°.
  movingAnimated.checked = true;
  change(dom.window, family, "moving");
  change(dom.window, aesthetic, "split");
  assert.equal(animationCallbacks.size, 0, "split stops the hidden moving geometry");
  assert.equal(document.querySelector('[data-aesthetic-only="split"]').hidden, false);
  assert.equal(columnControl.hidden, true);
  assert.equal(document.querySelector('#background-image-section').hidden, true);
  const splitAngle = document.querySelector('#split-angle');
  const splitHover = document.querySelector('#split-hover');
  const posterElement = document.querySelector('.poster');
  posterElement.getBoundingClientRect = () => ({left: 0, top: 0, width: 1200, height: 750});
  const pointer = (x, y) => posterElement.dispatchEvent(new dom.window.MouseEvent('pointermove', {clientX: x, clientY: y}));
  input(dom.window, splitAngle, '359');
  pointer(1100, 384);
  assert.equal(animationCallbacks.size, 1);
  frame(1000);
  const turned = Number(splitAngle.value);
  assert.ok(turned > 359 || turned < 2, 'rotation crosses the short way through zero');
  posterElement.dispatchEvent(new dom.window.Event('pointerleave'));
  assert.equal(animationCallbacks.size, 0);
  const held = splitAngle.value;
  frame(2000);
  assert.equal(splitAngle.value, held, 'pointer leave freezes the rendered frame');
  const savedSplit = dom.window.LightColumns.settingsIO.serializeControls({splitAngle, splitHover});
  assert.equal(savedSplit.splitAngle, Number(held));
  splitHover.checked = false;
  input(dom.window, splitHover);
  pointer(800, 500);
  assert.equal(animationCallbacks.size, 0, 'hover toggle prevents motion');
  input(dom.window, splitAngle, '90');
  assert.equal(splitAngle.value, '90', 'manual angle works with hover disabled');
  dom.window.LightColumns.settingsIO.applyControlValues({splitAngle, splitHover}, savedSplit);
  assert.equal(Number(splitAngle.value), Number(held));
  pointer(600, 375);
  assert.equal(animationCallbacks.size, 0, 'center dead zone prevents unstable rotation');
  exportPng.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exportPng.disabled, false);
  assert.match(settingsDownloadNames.at(-1), /be-art-two-color-split/);
  assert.equal(splitAngle.value, held, 'export preserves the displayed angle');
  change(dom.window, aesthetic, 'palette');
  assert.equal(document.querySelector('[data-aesthetic-only="split"]').hidden, true);
  assert.equal(animationCallbacks.size, 1, 'returning to moving geometry resumes it');
  movingAnimated.checked = false;
  input(dom.window, movingAnimated);

  change(dom.window, aesthetic, 'triangle');
  assert.equal(document.querySelector('[data-aesthetic-only="triangle"]').hidden, false);
  assert.equal(document.querySelector('[data-aesthetic-only="split"]').hidden, true);
  const triangleAngle = document.querySelector('#triangle-angle');
  const triangleHover = document.querySelector('#triangle-hover');
  input(dom.window, document.querySelector('#triangle-x'), '25');
  input(dom.window, document.querySelector('#triangle-y'), '40');
  input(dom.window, document.querySelector('#triangle-smoothing'), '0');
  pointer(300, 300);
  assert.equal(animationCallbacks.size, 0, 'triangle dead zone follows its offset center');
  pointer(900, 300);
  frame(3000);
  assert.equal(Number(triangleAngle.value), 0, 'triangle points toward the pointer from its own center');
  assert.equal(splitAngle.value, held, 'triangle motion preserves split rotation');
  pointer(300, 600);
  frame(3100);
  assert.equal(Number(triangleAngle.value), 90);
  posterElement.dispatchEvent(new dom.window.Event('pointerleave'));
  assert.equal(animationCallbacks.size, 0);
  triangleHover.checked = false;
  input(dom.window, triangleHover);
  pointer(800, 600);
  assert.equal(animationCallbacks.size, 0);
  await importSettingsFile(JSON.stringify({
    format: 'canvas-light-geometry-settings', version: 1,
    controls: {aesthetic: 'triangle', triangleAngle: 212, triangleX: 70, triangleY: 30,
      triangleSize: 180, triangleColor: '#ff5500', triangleBackground: '#113355',
      triangleHover: true, triangleSmoothing: 85}
  }));
  assert.equal(triangleAngle.value, '212');
  assert.equal(document.querySelector('#triangle-size').value, '180');
  assert.equal(document.querySelector('#triangle-color').value, '#ff5500');
  assert.equal(document.querySelector('#triangle-y-output').value, '30%');
  assert.equal(animationCallbacks.size, 0, 'import preserves rotation until new pointer movement');
  exportPng.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exportPng.disabled, false);
  assert.match(settingsDownloadNames.at(-1), /be-art-two-color-triangle/);
  assert.equal(triangleAngle.value, '212');
  pointer(1000, 600);
  assert.equal(animationCallbacks.size, 1);
  change(dom.window, aesthetic, 'split');
  assert.equal(animationCallbacks.size, 0, 'switching backgrounds cancels in-flight triangle motion');
  assert.equal(splitAngle.value, held);

  change(dom.window, aesthetic, 'palette');
  change(dom.window, family, 'triangle');
  document.querySelector('#triangle-light-study').click();
  assert.equal(aesthetic.value, 'palette');
  assert.equal(family.value, 'triangle');
  assert.equal(document.querySelector('#gradient-treatment').value, 'continuous');
  assert.equal(document.querySelector('#palette-interpolation').value, 'smooth');
  assert.equal(document.querySelector('[data-show-for-triangle]').hidden, false);
  assert.equal(document.querySelector('#triangle-hover').closest('.control').hidden, true);
  assert.equal(document.querySelector('#column-glow').value, '28');
  const staticAngle = triangleAngle.value;
  pointer(1000, 600);
  frame(5000);
  assert.equal(animationCallbacks.size, 0, 'light triangle stays static on pointer movement');
  assert.equal(triangleAngle.value, staticAngle);
  for (const flow of ['along', 'across', 'radial', 'angular', 'diagonal']) {
    const stopsBefore = gradientStopCount;
    change(dom.window, document.querySelector('#gradient-flow'), flow);
    assert.ok(gradientStopCount > stopsBefore, `${flow} creates light gradients for the triangle`);
  }
  exportPng.click();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exportPng.disabled, false);
  assert.match(settingsDownloadNames.at(-1), /be-art-triangle-palette/);

  assert.ok(drawCount > 0);
  assert.ok(gradientKinds.includes("linear"));
  assert.ok(gradientKinds.includes("radial"));
  assert.ok(gradientKinds.includes("angular"));
  assert.equal(runtimeErrors.length, 0, runtimeErrors.map(String).join("\n"));
  console.log("PASS: radial UI controls, presets, styles, and viewport contract");
  dom.window.close();
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
