(() => {
  "use strict";


  // ============================================================
  // CONFIG
  // ============================================================

  const CONFIG = {
    regions: 18,

    speed: 0.23,

    // Site movement.
    minAmplitude: 0.025,
    maxAmplitude: 0.10,

    // Region size breathing.
    weightMotion: 0.65,

    // Strength of weighted Voronoi effect.
    weightStrength: 0.025
  };


  // ============================================================
  // SVG
  // ============================================================

  const svg =
    document.querySelector("#world");

  const NS =
    "http://www.w3.org/2000/svg";


  let W = innerWidth;
  let H = innerHeight;

  let sites = [];
  let polygons = [];

  let paused = false;
  let time = 0;
  let frameId = 0, disposed = false;

  let previous =
    performance.now();


  // ============================================================
  // COLOR
  // ============================================================

  const paletteSettings = {
    type: "random",
    baseHue: 220,
    colorCount: 8,
    variability: 40,
    arrangement: "random",
    noise: MovingShapesPalette.makeNoise(),
    offset: 0
  };
  let palette = MovingShapesPalette.generate(paletteSettings);

  function paletteIndex(site) {
    const count = palette.length;
    // Use movement centers so colors don't jump between bands while animating.
    const dx = site.cx - 0.5;
    const dy = site.cy - 0.5;
    const radius = Math.min(1, Math.hypot(dx, dy) / Math.SQRT1_2);
    const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
    let index;
    switch (paletteSettings.arrangement) {
      case "rings": index = Math.floor(radius * 8); break;
      case "sectors": index = Math.floor(angle / (Math.PI * 2) * count); break;
      case "checker": index = Math.floor(site.cx * 8) + Math.floor(site.cy * 8); break;
      case "radial": index = Math.round(radius * (count - 1)); break;
      default: return Math.min(count - 1, Math.floor(site.colorNoise * count));
    }
    return (index + paletteSettings.offset) % count;
  }

  function updateColors() {
    palette = MovingShapesPalette.generate(paletteSettings);
    polygons.forEach((polygon, i) => {
      const color = palette[paletteIndex(sites[i])];
      polygon.setAttribute("fill", color);
      polygon.setAttribute("stroke", color);
    });
    const preview = document.querySelector("#palette-preview");
    preview.replaceChildren(...palette.map(color => {
      const swatch = document.createElement("span");
      swatch.style.backgroundColor = color;
      return swatch;
    }));
  }


  // ============================================================
  // CREATE SITES
  // ============================================================

  function regenerate() {
    sites = [];

    svg.replaceChildren();

    polygons = [];


    for (
      let i = 0;
      i < CONFIG.regions;
      i++
    ) {
      const amplitudeX =
        CONFIG.minAmplitude +
        Math.random() *
        (
          CONFIG.maxAmplitude -
          CONFIG.minAmplitude
        );

      const amplitudeY =
        CONFIG.minAmplitude +
        Math.random() *
        (
          CONFIG.maxAmplitude -
          CONFIG.minAmplitude
        );


      const site = {
        // Movement center in normalized coordinates.
        cx:
          0.12 +
          Math.random() * 0.76,

        cy:
          0.12 +
          Math.random() * 0.76,

        ax: amplitudeX,
        ay: amplitudeY,

        // Independent frequencies.
        fx:
          0.35 +
          Math.random() * 0.6,

        fy:
          0.35 +
          Math.random() * 0.6,

        phaseX:
          Math.random() *
          Math.PI * 2,

        phaseY:
          Math.random() *
          Math.PI * 2,

        phaseX2:
          Math.random() *
          Math.PI * 2,

        phaseY2:
          Math.random() *
          Math.PI * 2,

        // Territory weighting.
        baseWeight:
          0.55 +
          Math.pow(
            Math.random(),
            1.5
          ) * 1.3,

        weightPhase:
          Math.random() *
          Math.PI * 2,

        weightSpeed:
          0.25 +
          Math.random() * 0.55,

        x: 0,
        y: 0,
        weight: 0,

        colorNoise: Math.random()
      };


      sites.push(site);


      const polygon =
        document.createElementNS(
          NS,
          "polygon"
        );

      const color =
        palette[paletteIndex(site)];

      polygon.setAttribute(
        "fill",
        color
      );

      // Same color stroke hides hairline SVG seams.
      polygon.setAttribute(
        "stroke",
        color
      );

      svg.appendChild(
        polygon
      );

      polygons.push(
        polygon
      );
    }
    updateColors();
    updateSites(time);
    render();
    window.LabEmbed?.changed();
  }


  // ============================================================
  // SITE MOTION
  // ============================================================

  function updateSites(t) {
    const scale =
      Math.max(W, H);

    const weightScale =
      scale *
      scale *
      CONFIG.weightStrength;


    for (
      let i = 0;
      i < sites.length;
      i++
    ) {
      const s =
        sites[i];


      // Two waves per axis make the trajectories less obviously
      // circular / mechanical.

      const nx =
        s.cx +

        Math.sin(
          t * s.fx +
          s.phaseX
        ) *
        s.ax +

        Math.sin(
          t * s.fx * 0.37 +
          s.phaseX2
        ) *
        s.ax *
        0.38;


      const ny =
        s.cy +

        Math.cos(
          t * s.fy +
          s.phaseY
        ) *
        s.ay +

        Math.sin(
          t * s.fy * 0.43 +
          s.phaseY2
        ) *
        s.ay *
        0.38;


      s.x =
        Math.max(
          0,
          Math.min(
            1,
            nx
          )
        ) * W;


      s.y =
        Math.max(
          0,
          Math.min(
            1,
            ny
          )
        ) * H;


      // Territory expands / contracts independently
      // of site movement.

      const breathing =
        1 +
        Math.sin(
          t *
          s.weightSpeed +
          s.weightPhase
        ) *
        CONFIG.weightMotion;


      s.weight =
        s.baseWeight *
        breathing *
        weightScale;
    }
  }


  // ============================================================
  // POLYGON CLIPPING
  // ============================================================
  //
  // Weighted Voronoi / power diagram:
  //
  //   |p - A|² - weightA
  //       <=
  //   |p - B|² - weightB
  //
  // Expanding this produces a linear half-plane.
  //
  // Therefore each territory is an exact polygon.
  //
  // ============================================================

  function clipPolygon(
    polygon,
    A,
    B,
    C
  ) {
    if (!polygon.length) {
      return polygon;
    }


    const output = [];

    const inside = p =>
      A * p[0] +
      B * p[1]
      <= C + 0.00001;


    function intersection(
      p1,
      p2
    ) {
      const dx =
        p2[0] - p1[0];

      const dy =
        p2[1] - p1[1];


      const denominator =
        A * dx +
        B * dy;


      if (
        Math.abs(denominator)
        < 1e-12
      ) {
        return [
          p1[0],
          p1[1]
        ];
      }


      const t =
        (
          C -
          A * p1[0] -
          B * p1[1]
        ) /
        denominator;


      return [
        p1[0] +
          dx * t,

        p1[1] +
          dy * t
      ];
    }


    let previous =
      polygon[
        polygon.length - 1
      ];

    let previousInside =
      inside(previous);


    for (
      let i = 0;
      i < polygon.length;
      i++
    ) {
      const current =
        polygon[i];

      const currentInside =
        inside(current);


      if (
        currentInside
      ) {
        if (
          !previousInside
        ) {
          output.push(
            intersection(
              previous,
              current
            )
          );
        }

        output.push(
          current
        );
      }

      else if (
        previousInside
      ) {
        output.push(
          intersection(
            previous,
            current
          )
        );
      }


      previous =
        current;

      previousInside =
        currentInside;
    }


    return output;
  }


  // ============================================================
  // POWER CELL
  // ============================================================

  function calculateCell(index) {
    const s =
      sites[index];


    // Begin with the entire screen.
    let polygon = [
      [0, 0],
      [W, 0],
      [W, H],
      [0, H]
    ];


    for (
      let j = 0;
      j < sites.length;
      j++
    ) {
      if (
        j === index
      ) {
        continue;
      }


      const other =
        sites[j];


      // From:
      //
      // |p-s|² - ws <= |p-o|² - wo
      //
      // derive:
      //
      // A*x + B*y <= C

      const A =
        2 *
        (
          other.x -
          s.x
        );


      const B =
        2 *
        (
          other.y -
          s.y
        );


      const C =
        other.x * other.x +
        other.y * other.y -

        s.x * s.x -
        s.y * s.y +

        s.weight -
        other.weight;


      polygon =
        clipPolygon(
          polygon,
          A,
          B,
          C
        );


      if (
        polygon.length === 0
      ) {
        break;
      }
    }


    return polygon;
  }


  // ============================================================
  // SVG UPDATE
  // ============================================================

  function render() {
    for (
      let i = 0;
      i < sites.length;
      i++
    ) {
      const polygon =
        calculateCell(i);


      if (
        polygon.length < 3
      ) {
        polygons[i].setAttribute(
          "points",
          ""
        );

        continue;
      }


      let points = "";


      for (
        let p = 0;
        p < polygon.length;
        p++
      ) {
        points +=
          polygon[p][0].toFixed(2) +
          "," +
          polygon[p][1].toFixed(2) +
          " ";
      }


      polygons[i].setAttribute(
        "points",
        points
      );
    }
  }


  // ============================================================
  // LOOP
  // ============================================================

  function frame(now) {
    frameId = 0;
    const dt =
      Math.max(0, Math.min(
        0.05,
        (
          now -
          previous
        ) / 1000
      ));

    previous = now;


    if (canAnimate()) {
      time +=
        dt *
        CONFIG.speed;
    }


    updateSites(
      time
    );

    render();


    if (canAnimate()) frameId=requestAnimationFrame(frame);
  }

  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  function canAnimate() {
    return !disposed && !paused && !document.hidden &&
      (window.LabEmbed ? window.LabEmbed.motionAllowed : !reducedMotion.matches);
  }
  function syncMotion() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId=0; previous=performance.now();
    if (canAnimate()) frameId=requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',syncMotion);
  reducedMotion.addEventListener('change',syncMotion);


  // ============================================================
  // RESIZE
  // ============================================================

  function resize() {
    W =
      Math.max(
        1,
        window.LabEmbed?.size.width || innerWidth
      );

    H =
      Math.max(
        1,
        window.LabEmbed?.size.height || innerHeight
      );


    svg.setAttribute(
      "viewBox",
      `0 0 ${W} ${H}`
    );
    updateSites(time); render();
  }


  // ============================================================
  // INPUT
  // ============================================================

  const sidebarToggle = document.querySelector("#sidebar-toggle");
  const sidebarContent = document.querySelector("#sidebar-content");
  sidebarToggle.addEventListener("click", () => {
    const expanded = sidebarToggle.getAttribute("aria-expanded") === "true";
    sidebarToggle.setAttribute("aria-expanded", String(!expanded));
    sidebarToggle.setAttribute("aria-label", expanded ? "Expand controls" : "Collapse controls");
    sidebarToggle.querySelector(".toggle-icon").textContent = expanded ? "+" : "−";
    sidebarContent.hidden = expanded;
  });

  const typeSelect = document.querySelector("#palette-type");
  const hueInput = document.querySelector("#base-hue");
  function syncPaletteControls() {
    const fixed = MovingShapesPalette.isFixedType(paletteSettings.type);
    hueInput.disabled = fixed;
    document.querySelector("#base-hue-hint").hidden = !fixed;
  }
  typeSelect.addEventListener("change", () => {
    paletteSettings.type = typeSelect.value;
    syncPaletteControls();
    updateColors();
  });
  [
    ["base-hue", "baseHue", "°"],
    ["color-count", "colorCount", ""],
    ["color-variability", "variability", "%"]
  ].forEach(([id, key, suffix]) => {
    document.querySelector(`#${id}`).addEventListener("input", event => {
      paletteSettings[key] = Number(event.target.value);
      document.querySelector(`#${id}-value`).value = `${event.target.value}${suffix}`;
      updateColors();
    });
  });
  document.querySelector("#color-arrangement").addEventListener("change", event => {
    paletteSettings.arrangement = event.target.value;
    updateColors();
  });
  document.querySelector("#shuffle-palette").addEventListener("click", () => {
    paletteSettings.noise = MovingShapesPalette.makeNoise();
    paletteSettings.offset = Math.floor(Math.random() * 16);
    sites.forEach(site => { site.colorNoise = Math.random(); });
    updateColors();
  });
  syncPaletteControls();

  document.querySelector("#shape-count").addEventListener("input", event => {
    CONFIG.regions = Number(event.target.value);
    document.querySelector("#shape-count-value").value = CONFIG.regions;
    regenerate();
  });
  const baseSpeed = CONFIG.speed;
  document.querySelector("#motion-speed").addEventListener("input", event => {
    const multiplier = Number(event.target.value);
    CONFIG.speed = baseSpeed * multiplier;
    document.querySelector("#motion-speed-value").value = `${multiplier.toFixed(1)}×`;
    event.target.setAttribute("aria-valuetext", `${multiplier.toFixed(1)} times`);
  });
  document.querySelector("#breathing").addEventListener("input", event => {
    CONFIG.weightMotion = Number(event.target.value) / 100;
    document.querySelector("#breathing-value").value = `${event.target.value}%`;
    event.target.setAttribute("aria-valuetext", `${event.target.value} percent`);
    updateSites(time); render();
  });

  const pauseButton = document.querySelector("#pause");
  function togglePaused() {
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    pauseButton.setAttribute("aria-pressed", String(paused));
    syncMotion();
    window.LabEmbed?.changed();
  }
  pauseButton.addEventListener("click", togglePaused);
  document.querySelector("#regenerate").addEventListener("click", regenerate);

  addEventListener(
    "keydown",
    event => {
      // Keep native keyboard behavior while operating sidebar controls.
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
          event.target.closest("input, select, textarea, button, [contenteditable]")) {
        return;
      }
      if (
        event.code === "Space"
      ) {
        event.preventDefault();

        togglePaused();
      }


      if (
        event.key.toLowerCase()
        === "r"
      ) {
        regenerate();
      }
    }
  );


  addEventListener(
    "resize",
    resize
  );


  // ============================================================
  // START
  // ============================================================

  resize();
  regenerate();

  // A complete native snapshot includes the generated definitions and palette
  // noise. Derived pixel coordinates are recomputed at the destination size.
  const copy=value=>JSON.parse(JSON.stringify(value));
  function getState() {
    return copy({config:CONFIG,palette:paletteSettings,
      sites:sites.map(({x,y,weight,...definition})=>definition),paused,time});
  }
  const initialState=getState();
  function exactKeys(value,reference,label) {
    if (!value || typeof value!=='object' || Array.isArray(value) ||
        Object.keys(value).length!==Object.keys(reference).length ||
        Object.keys(reference).some(key=>!Object.hasOwn(value,key))) {
      throw new TypeError(`Incomplete or unsupported ${label}.`);
    }
  }
  function number(value,min,max,label) {
    if (typeof value!=='number' || !Number.isFinite(value) || value<min || value>max)
      throw new TypeError(`Invalid ${label}.`);
  }
  function control(id,value,scale=1) {
    const input=document.getElementById(id);
    if (input.tagName==='SELECT') {
      if (![...input.options].some(option=>option.value===value)) throw new TypeError(`Invalid ${id}.`);
    } else number(value,Number(input.min)*scale,Number(input.max)*scale,id);
  }
  function validateState(input) {
    exactKeys(input,initialState,'moving composition');
    exactKeys(input.config,initialState.config,'motion settings');
    exactKeys(input.palette,initialState.palette,'palette settings');
    const c=input.config,p=input.palette;
    control('shape-count',c.regions); control('motion-speed',c.speed,baseSpeed);
    control('breathing',c.weightMotion,.01);
    for (const key of ['minAmplitude','maxAmplitude','weightStrength']) number(c[key],0,1,key);
    if (c.minAmplitude>c.maxAmplitude || !Number.isInteger(c.regions)) throw new TypeError('Invalid site configuration.');
    control('palette-type',p.type); control('base-hue',p.baseHue);
    control('color-count',p.colorCount); control('color-variability',p.variability);
    control('color-arrangement',p.arrangement);
    number(p.offset,0,15,'palette offset');
    if (!Number.isInteger(p.colorCount) || !Number.isInteger(p.offset)) throw new TypeError('Invalid palette count or offset.');
    if (!Array.isArray(p.noise) || p.noise.length!==initialState.palette.noise.length) throw new TypeError('Incomplete palette noise.');
    for (const entry of p.noise) {
      exactKeys(entry,initialState.palette.noise[0],'palette noise');
      for (const value of Object.values(entry)) number(value,0,1,'palette noise');
    }
    if (!Array.isArray(input.sites) || input.sites.length!==c.regions) throw new TypeError('Incomplete generated sites.');
    for (const site of input.sites) {
      exactKeys(site,initialState.sites[0],'site definition');
      for (const [key,value] of Object.entries(site)) {
        const max=key.startsWith('phase')||key==='weightPhase'?Math.PI*2:key==='baseWeight'?1.85:1;
        number(value,0,max,`site ${key}`);
      }
    }
    number(input.time,0,1e12,'animation time');
    if (typeof input.paused!=='boolean') throw new TypeError('Invalid pause setting.');
    return copy(input);
  }
  function syncUI() {
    const entries=[['palette-type',paletteSettings.type],['base-hue',paletteSettings.baseHue,'°'],
      ['color-count',paletteSettings.colorCount,''],['color-variability',paletteSettings.variability,'%'],
      ['color-arrangement',paletteSettings.arrangement],['shape-count',CONFIG.regions,''],
      ['motion-speed',CONFIG.speed/baseSpeed,'×'],['breathing',CONFIG.weightMotion*100,'%']];
    for (const [id,value,suffix] of entries) {
      document.getElementById(id).value=value;
      const output=document.getElementById(`${id}-value`);
      if (output) output.value=`${id==='motion-speed'?Number(value).toFixed(1):value}${suffix}`;
    }
    pauseButton.textContent=paused?'Resume':'Pause';
    pauseButton.setAttribute('aria-pressed',String(paused));
    syncPaletteControls();
  }
  function setState(input) {
    const next=validateState(input);
    Object.assign(CONFIG,next.config); Object.assign(paletteSettings,next.palette);
    sites=next.sites.map(site=>({...site,x:0,y:0,weight:0}));
    time=next.time; paused=next.paused;
    polygons=sites.map(()=>document.createElementNS(NS,'polygon'));
    svg.replaceChildren(...polygons);
    syncUI(); updateColors(); resize(); syncMotion();
    window.LabEmbed?.changed(); return getState();
  }
  function renderAt(nextTime) {
    number(nextTime,0,1e12,'animation time'); time=nextTime;
    updateSites(time); render(); previous=performance.now();
  }
  function reset(){ return setState(initialState); }
  window.movingShapes=Object.freeze({getState,validateState,setState,reset,renderAt,regenerate});
  window.LabEmbed?.register({getState,validateState,setState,reset,
    applyPreset:setState,resize,syncMotion,renderAt,isAnimated:()=>!paused,
    dispose(){disposed=true;cancelAnimationFrame(frameId);reducedMotion.removeEventListener('change',syncMotion);}
  });
  syncMotion();

})();
