(function (app) {
  "use strict";

  const logoAlignmentClassNames = [
    "logo-align-top",
    "logo-align-center",
    "logo-align-bottom"
  ];
  const eventTextEffectClassNames = [
    "text-effect-solid-black",
    "text-effect-solid-white",
    "text-effect-invert",
    "text-effect-difference",
    "text-effect-accent"
  ];
  const logoEffectClassNames = [
    "effect-solid",
    "effect-accent",
    "effect-invert",
    "effect-difference",
    "effect-glass",
    "effect-hypercolor",
    "effect-hue"
  ];

  let overlayElements = null;
  let logoSvgTemplate = null;
  const coloredLogoSources = new Map();

  function readEmbeddedLogoTemplate() {
    const logoMask = window
      .getComputedStyle(overlayElements.beArtsLogo)
      .getPropertyValue("--logo-mask");
    const embeddedLogoMatch = logoMask.match(
      /data:image\/svg\+xml;base64,([^"'\)]+)/
    );

    return embeddedLogoMatch
      ? window.atob(embeddedLogoMatch[1])
      : null;
  }

  function getColoredLogoSource(color) {
    const normalizedColor = color.toLowerCase();

    if (!logoSvgTemplate) {
      return "logo_be_arts.svg";
    }

    if (!coloredLogoSources.has(normalizedColor)) {
      const coloredSvg = logoSvgTemplate.replace(
        /#000000/gi,
        normalizedColor
      );

      coloredLogoSources.set(
        normalizedColor,
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coloredSvg)}`
      );
    }

    return coloredLogoSources.get(normalizedColor);
  }

  function renderVisibility() {
    const overlayState = app.state.overlays;
    const manifesto = overlayState.textContent === "manifesto";

    overlayElements.eventCopy.dataset.content = overlayState.textContent;
    overlayElements.eventCopy.setAttribute("aria-label", manifesto ? "Manifesto title" : "Event details");

    overlayElements.logoGraphic.classList.toggle(
      "is-hidden",
      !overlayState.showLogo || manifesto
    );
    overlayElements.eventCopy.classList.toggle(
      "is-hidden",
      !overlayState.showEventCopy
    );
  }

  function fitManifestoTitle() {
    if (app.state.overlays.textContent !== "manifesto" || !app.state.overlays.showEventCopy) return;
    const title = overlayElements.eventCopy.querySelector(".manifesto-title");
    const bottom = title.querySelector(".manifesto-bottom");
    const width = overlayElements.eventCopy.getBoundingClientRect().width;
    if (width <= 0) return;
    // Measure the actual loaded font, then use the same size on both rows.
    // The top row's space expands between NO and SOMOS to match the bottom.
    title.style.fontSize = "100px";
    const naturalWidth = bottom.getBoundingClientRect().width;
    if (naturalWidth > 0) title.style.fontSize = `${100 * width / naturalWidth}px`;
  }

  function renderAlignment() {
    overlayElements.beArtsLogo.classList.remove(
      ...logoAlignmentClassNames
    );
    overlayElements.beArtsLogo.classList.add(
      `logo-align-${app.state.overlays.alignment}`
    );
  }

  function renderPadding() {
    overlayElements.animationBox.style.setProperty(
      "--logo-padding",
      `${app.state.overlays.padding}px`
    );
  }

  function renderEventTextEffect() {
    const overlayState = app.state.overlays;

    overlayElements.eventCopy.classList.remove(
      ...eventTextEffectClassNames
    );
    overlayElements.eventCopy.classList.add(
      `text-effect-${overlayState.eventTextEffect}`
    );
    overlayElements.eventCopy.style.setProperty(
      "--text-accent",
      overlayState.eventTextAccent
    );
  }

  function renderLogoEffect() {
    const overlayState = app.state.overlays;
    const effect = overlayState.logoEffect;
    const strength = overlayState.effectStrength / 100;
    const blur = overlayState.effectBlur;
    const hue = overlayState.effectHue;
    const opacity = overlayState.effectOpacity / 100;
    const accent = overlayState.matchTextAccent
      ? overlayState.eventTextAccent
      : overlayState.logoAccent;
    const saturation = effect === "hypercolor"
      ? 100 + strength * 260
      : 100 + strength * 80;
    const contrast = effect === "hypercolor"
      ? 100 + strength * 45
      : 100 + strength * 20;
    const sourceColor = effect === "solid"
      ? "#000000"
      : ["invert", "glass"].includes(effect)
        ? "#ffffff"
        : accent;

    if (overlayState.matchTextAccent) {
      overlayState.logoAccent = accent;
    }

    overlayElements.beArtsLogo.classList.remove(...logoEffectClassNames);
    overlayElements.beArtsLogo.classList.add(`effect-${effect}`);
    overlayElements.beArtsLogo.style.setProperty("--logo-accent", accent);
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-invert",
      `${strength * 100}%`
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-blur",
      `${blur}px`
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-saturation",
      `${saturation}%`
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-contrast",
      `${contrast}%`
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-brightness",
      `${100 + strength * 10}%`
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-hue",
      `${hue * strength}deg`
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--glass-alpha",
      (0.04 + strength * 0.22).toFixed(2)
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--difference-color",
      accent
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-strength-alpha",
      strength * opacity
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--effect-fallback-alpha",
      ((0.18 + strength * 0.42) * opacity).toFixed(2)
    );
    overlayElements.beArtsLogo.style.setProperty(
      "--logo-opacity",
      opacity
    );
    overlayElements.logoSolid.src = getColoredLogoSource(sourceColor);
  }

  function renderAll() {
    renderVisibility();
    renderAlignment();
    renderPadding();
    renderEventTextEffect();
    renderLogoEffect();
    fitManifestoTitle();
  }

  function initialize(elements) {
    overlayElements = elements;
    logoSvgTemplate = readEmbeddedLogoTemplate();
    renderAll();
    if (window.ResizeObserver) {
      new ResizeObserver(fitManifestoTitle).observe(overlayElements.animationBox);
    }
    window.addEventListener("resize", fitManifestoTitle);
    if (document.fonts) {
      document.fonts.ready.then(fitManifestoTitle);
      document.fonts.addEventListener("loadingdone", fitManifestoTitle);
    }
  }

  app.overlays = {
    initialize: initialize,
    renderAll: renderAll,
    renderVisibility: renderVisibility,
    renderAlignment: renderAlignment,
    renderPadding: renderPadding,
    renderEventTextEffect: renderEventTextEffect,
    renderLogoEffect: renderLogoEffect,
    logoUsesAccent(effect) {
      return [
        "accent",
        "difference",
        "hypercolor",
        "hue"
      ].includes(effect);
    },
    textUsesAccent(effect) {
      return ["difference", "accent"].includes(effect);
    }
  };
})(window.CircleApp = window.CircleApp || {});
