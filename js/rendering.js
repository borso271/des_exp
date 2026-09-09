(function (app) {
  "use strict";

  const namespace = app.constants.svgNamespace;
  let nodes = null;
  let records = [];
  let materialRevision = -1;
  let materialGeneration = 0;
  let settingsSeed = null;
  let activeStyle = null;
  let lastTime = 0;
  let gradientRecords = [];
  let gradientRevision = -1;
  let gradientType = null;

  function element(name, attributes, parent) {
    const node = document.createElementNS(namespace, name);

    Object.entries(attributes || {}).forEach(([key, value]) => {
      node.setAttribute(key, value);
    });

    if (parent) {
      parent.appendChild(node);
    }

    return node;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function wrapHue(value) {
    return ((value % 360) + 360) % 360;
  }

  function hsl(color) {
    return `hsl(${Math.round(wrapHue(color.h))} ${Math.round(
      clamp(color.s, 0, 100)
    )}% ${Math.round(clamp(color.l, 0, 100))}%)`;
  }

  function parseHsl(value) {
    const match = String(value).match(
      /hsl\(\s*(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/i
    );

    if (!match) {
      return { h: 220, s: 78, l: 56 };
    }

    return {
      h: Number(match[1]),
      s: Number(match[2]),
      l: Number(match[3])
    };
  }

  function mixHue(start, end, amount) {
    const distance = ((end - start + 540) % 360) - 180;

    return wrapHue(start + distance * amount);
  }

  function mixColor(start, end, amount) {
    return {
      h: mixHue(start.h, end.h, amount),
      s: start.s + (end.s - start.s) * amount,
      l: start.l + (end.l - start.l) * amount
    };
  }

  function setStop(stop, offset, color, opacity) {
    stop.setAttribute("offset", `${offset}%`);
    stop.setAttribute("stop-color", hsl(color));
    stop.setAttribute("stop-opacity", String(clamp(opacity, 0, 1)));
  }

  function mulberry32(seed) {
    return function random() {
      let value = seed += 0x6D2B79F5;

      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeSettings(random, index) {
    return {
      hotX: 0.18 + random() * 0.64,
      hotY: 0.91 + random() * 0.09,
      coolX: 0.27 + random() * 0.45,
      coolY: 0.38 + random() * 0.17,
      hotRadius: 0.86 + random() * 0.16,
      coolRadius: 0.72 + random() * 0.14,
      hueShift: (random() * 2 - 1) * 36,
      warmHueShift: (random() * 2 - 1) * 14,
      lightShift: (random() * 2 - 1) * 7,
      phaseX: random() * Math.PI * 2,
      phaseY: random() * Math.PI * 2,
      rateX: 0.24 + random() * 0.2 + index * 0.0009,
      rateY: 0.19 + random() * 0.18 + index * 0.0007
    };
  }

  function collectCells() {
    const cells = [];

    app.renderer.forEachCell((path, rowIndex, columnIndex) => {
      cells.push({
        path: path,
        rowIndex: rowIndex,
        columnIndex: columnIndex
      });
    });

    return cells;
  }

  function makeStops(parent, offsets) {
    return offsets.map((offset) => {
      return element("stop", { offset: `${offset}%` }, parent);
    });
  }

  function createRecord(cell, index, random, filterId) {
    const id = `luminous-${materialGeneration}-${index}`;
    const baseGradient = element("linearGradient", {
      id: `${id}-base`,
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    }, nodes.materials);
    const hotGradient = element("radialGradient", {
      id: `${id}-hot`,
      cx: "50%",
      cy: "100%",
      r: "92%",
      fx: "50%",
      fy: "100%"
    }, nodes.materials);
    const coolGradient = element("radialGradient", {
      id: `${id}-cool`,
      cx: "50%",
      cy: "48%",
      r: "78%",
      fx: "50%",
      fy: "48%"
    }, nodes.materials);
    const pattern = element("pattern", {
      id: `${id}-pattern`,
      x: "0",
      y: "0",
      width: "1",
      height: "1",
      patternUnits: "objectBoundingBox",
      patternContentUnits: "objectBoundingBox"
    }, nodes.materials);

    element("rect", {
      x: "0",
      y: "0",
      width: "1",
      height: "1",
      fill: `url(#${id}-base)`
    }, pattern);

    const glowGroup = element("g", {
      filter: `url(#${filterId})`
    }, pattern);

    element("rect", {
      x: "0",
      y: "0",
      width: "1",
      height: "1",
      fill: `url(#${id}-hot)`
    }, glowGroup);
    element("rect", {
      x: "0",
      y: "0",
      width: "1",
      height: "1",
      fill: `url(#${id}-cool)`
    }, glowGroup);

    return {
      path: cell.path,
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      patternId: `${id}-pattern`,
      baseStops: makeStops(baseGradient, [0, 34, 42, 66, 100]),
      hotGradient: hotGradient,
      hotStops: makeStops(hotGradient, [0, 45, 100]),
      coolGradient: coolGradient,
      coolStops: makeStops(coolGradient, [0, 45, 100]),
      glowGroup: glowGroup,
      settings: makeSettings(random, index)
    };
  }

  function rebuildMaterials() {
    const cells = collectCells();
    const random = mulberry32(app.state.rendering.seed);

    materialGeneration += 1;
    nodes.materials.replaceChildren();

    const filterId = `luminous-local-blur-${materialGeneration}`;
    const filter = element("filter", {
      id: filterId,
      x: "-55%",
      y: "-55%",
      width: "210%",
      height: "210%",
      filterUnits: "objectBoundingBox",
      primitiveUnits: "objectBoundingBox",
      "color-interpolation-filters": "sRGB"
    }, nodes.materials);

    nodes.blur = element("feGaussianBlur", {
      stdDeviation: "0.04"
    }, filter);
    records = cells.map((cell, index) => {
      return createRecord(cell, index, random, filterId);
    });
    materialRevision = app.renderer.getRevision();
    settingsSeed = app.state.rendering.seed;
  }

  function ensureMaterials() {
    const revision = app.renderer.getRevision();

    if (
      materialRevision !== revision ||
      settingsSeed !== app.state.rendering.seed
    ) {
      rebuildMaterials();
    }
  }

  function updateColors() {
    const rendering = app.state.rendering;
    const paleEnd = clamp(rendering.paleDepth, 5, 70);
    const blueStart = clamp(rendering.transition - 12, paleEnd + 3, 76);
    const violetStart = clamp(
      rendering.transition + 12,
      blueStart + 3,
      90
    );
    const variability = rendering.variation / 100;
    const warmth = rendering.warmth / 100;
    const bloom = rendering.bloom / 100;
    const bloomOpacity = clamp(bloom, 0, 1);
    const bloomBoost = Math.max(1, bloom);

    nodes.blur.setAttribute(
      "stdDeviation",
      String(Math.max(0.0001, rendering.softness / 700))
    );

    records.forEach((record) => {
      const base = parseHsl(
        record.path.getAttribute("data-palette-color") ||
        record.path.getAttribute("fill")
      );
      const settings = record.settings;
      const localShift = settings.hueShift * variability;
      const localLight = settings.lightShift * variability;
      const coolHue = base.h + localShift;
      const violetHue = coolHue + 28;
      const warmTarget = {
        h: 22 + settings.warmHueShift * variability,
        s: 70 + 18 * warmth,
        l: 72 - 14 * warmth
      };
      const warm = mixColor(base, warmTarget, 0.28 + warmth * 0.72);

      setStop(record.baseStops[0], 0, {
        h: coolHue,
        s: 22,
        l: 95 + localLight * 0.15
      }, 1);
      setStop(record.baseStops[1], paleEnd, {
        h: coolHue,
        s: 48,
        l: 84 + localLight * 0.3
      }, 0.94);
      setStop(record.baseStops[2], blueStart, {
        h: coolHue,
        s: clamp(base.s + 14, 76, 96),
        l: clamp(base.l + 3 + localLight, 48, 66)
      }, 1);
      setStop(record.baseStops[3], violetStart, {
        h: violetHue,
        s: clamp(base.s + 6, 72, 92),
        l: clamp(base.l + 4 + localLight, 50, 68)
      }, 1);
      setStop(record.baseStops[4], 100, warm, 0.98);

      setStop(record.hotStops[0], 0, {
        h: warm.h,
        s: clamp(warm.s + 8, 76, 96),
        l: clamp(warm.l + 7, 60, 76)
      }, clamp(0.92 * bloomBoost, 0, 1));
      setStop(record.hotStops[1], 45, {
        h: 330 + localShift * 0.15,
        s: 80,
        l: 70
      }, clamp(0.48 * bloomBoost, 0, 1));
      setStop(record.hotStops[2], 100, {
        h: violetHue,
        s: 80,
        l: 55
      }, 0);

      setStop(record.coolStops[0], 0, {
        h: 205 + (coolHue - base.h) * 0.35,
        s: 96,
        l: 67
      }, clamp(0.84 * bloomBoost, 0, 1));
      setStop(record.coolStops[1], 45, {
        h: coolHue,
        s: 92,
        l: 59
      }, clamp(0.38 * bloomBoost, 0, 1));
      setStop(record.coolStops[2], 100, {
        h: coolHue,
        s: 95,
        l: 55
      }, 0);

      record.glowGroup.setAttribute(
        "opacity",
        String(bloomOpacity)
      );
    });
  }

  function percent(value) {
    return `${(value * 100).toFixed(2)}%`;
  }

  function updateFields(time) {
    const rendering = app.state.rendering;
    const variability = rendering.variation / 100;
    const motion = rendering.motion / 100;
    const speed = rendering.speed / 100;
    const scale = rendering.fieldScale / 100;

    records.forEach((record) => {
      const settings = record.settings;
      const motionX = Math.sin(
        time * speed * settings.rateX + settings.phaseX
      ) * motion * 0.1;
      const motionY = Math.sin(
        time * speed * settings.rateY + settings.phaseY
      ) * motion * 0.075;
      const hotX = 0.5 + (settings.hotX - 0.5) * variability + motionX;
      const hotY = 0.96 + (settings.hotY - 0.96) * variability + motionY;
      const coolX = 0.5 + (settings.coolX - 0.5) * variability - motionX;
      const coolY = 0.48 + (settings.coolY - 0.48) * variability - motionY;
      const hotRadius = (
        0.92 + (settings.hotRadius - 0.92) * variability
      ) * scale;
      const coolRadius = (
        0.78 + (settings.coolRadius - 0.78) * variability
      ) * scale;

      record.hotGradient.setAttribute("cx", percent(hotX));
      record.hotGradient.setAttribute("cy", percent(hotY));
      record.hotGradient.setAttribute("r", percent(hotRadius));
      record.hotGradient.setAttribute("fx", percent(hotX * 0.92 + 0.04));
      record.hotGradient.setAttribute("fy", percent(hotY));
      record.coolGradient.setAttribute("cx", percent(coolX));
      record.coolGradient.setAttribute("cy", percent(coolY));
      record.coolGradient.setAttribute("r", percent(coolRadius));
      record.coolGradient.setAttribute("fx", percent(coolX));
      record.coolGradient.setAttribute("fy", percent(coolY));
    });
  }

  function restoreSolidFills() {
    app.renderer.forEachCell((path) => {
      const color = path.getAttribute("data-palette-color");

      if (color) {
        path.setAttribute("fill", color);
      }
    });
  }

  function applyLuminousFills() {
    records.forEach((record) => {
      record.path.setAttribute("fill", `url(#${record.patternId})`);
    });
  }

  function refreshGradients() {
    const settings = app.state.rendering;
    const revision = app.renderer.getRevision();
    if (gradientRevision !== revision || gradientType !== settings.gradientType) {
      nodes.gradients.replaceChildren();
      gradientRecords = collectCells().map((cell, index) => {
        const id = `palette-gradient-${revision}-${index}`;
        const gradient = element(settings.gradientType === "radial" ? "radialGradient" : "linearGradient", {
          id, gradientUnits: "objectBoundingBox", "color-interpolation": "sRGB"
        }, nodes.gradients);
        return { path: cell.path, gradient, id };
      });
      gradientRevision = revision;
      gradientType = settings.gradientType;
    }
    const colors = app.state.palette.colors;
    const angle = settings.gradientAngle * Math.PI / 180;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const extent = Math.abs(dx) + Math.abs(dy);
    gradientRecords.forEach(({ path, gradient, id }) => {
      if (settings.gradientType === "radial") {
        gradient.setAttribute("cx", "0.5");
        gradient.setAttribute("cy", "0.5");
        gradient.setAttribute("r", String(Math.SQRT1_2));
      } else {
        gradient.setAttribute("x1", String(0.5 - dx * extent / 2));
        gradient.setAttribute("y1", String(0.5 - dy * extent / 2));
        gradient.setAttribute("x2", String(0.5 + dx * extent / 2));
        gradient.setAttribute("y2", String(0.5 + dy * extent / 2));
      }
      const start = Math.max(0, colors.indexOf(path.getAttribute("data-palette-color")));
      const ordered = colors.map((_, index) => colors[(start + index) % colors.length]);
      if (settings.gradientReverse) ordered.reverse();
      gradient.replaceChildren();
      ordered.forEach((color, index) => {
        element("stop", { offset: String(index / Math.max(1, ordered.length - 1)), "stop-color": color }, gradient);
      });
      path.setAttribute("fill", `url(#${id})`);
    });
  }

  function refresh() {
    if (!nodes) {
      return;
    }

    activeStyle = app.state.rendering.style;

    if (activeStyle === "gradient") {
      refreshGradients();
      return;
    }

    if (activeStyle !== "luminous") {
      restoreSolidFills();
      return;
    }

    ensureMaterials();
    updateColors();
    updateFields(lastTime);
    applyLuminousFills();
  }

  function render(time) {
    if (!nodes) {
      return;
    }

    lastTime = Number.isFinite(time) ? time : lastTime;

    if (activeStyle !== app.state.rendering.style) {
      refresh();
    }

    if (app.state.rendering.style === "gradient") {
      if (gradientRevision !== app.renderer.getRevision()) refreshGradients();
      return;
    }

    if (app.state.rendering.style !== "luminous") {
      return;
    }

    ensureMaterials();
    applyLuminousFills();
    updateFields(lastTime);
  }

  function randomize() {
    app.state.rendering.seed = Math.floor(Math.random() * 1000000000);
    materialRevision = -1;
    refresh();
  }

  function initialize(context) {
    const defs = context.svg.querySelector("defs");
    const materials = element("g", {
      id: "luminous-materials",
      "aria-hidden": "true"
    }, defs);

    nodes = {
      materials: materials,
      gradients: element("g", { id: "palette-gradients", "aria-hidden": "true" }, defs),
      blur: null
    };
    refresh();
  }

  app.rendering = {
    initialize: initialize,
    render: render,
    refresh: refresh,
    randomize: randomize
  };
})(window.CircleApp = window.CircleApp || {});
