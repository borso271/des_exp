(() => {
  'use strict';
  const field = window.TriangleColorField;
  const palettes = window.ColorPalettes;
  const $ = id => document.getElementById(id);
  const composition = $('composition');
  let manualColors = ['#ff7a72', '#6857ff'];
  let generatedColors = [];
  let generatedCount = 4;
  let paletteSeed = 2107;
  let scatterSeed = 7043;
  let shuffleSeed = 101;
  const progressionDefaults = {pattern:'sequence', transition:'continuous', 'color-space':'oklab', curve:'linear', reverse:false, span:100, offset:0, overflow:'extend', 'pair-shift':0};
  const notes = {
    sequence:'Each triangle takes the next color along the palette.',
    columns:'Both triangles share a color. Add a second triangle shift to separate them.',
    opposing:'The two triangles travel through the palette in opposite directions.',
    center:'The palette begins in the center and moves toward both edges.',
    scatter:'Each triangle has a fixed random palette position. Reshuffle to change the arrangement.'
  };
  const activeColors = () => $('palette-source').value === 'manual' ? manualColors : generatedColors;
  const custom = () => {$('study').value = 'custom';};

  function progression() {
    return {
      pattern:$('pattern').value, transition:$('transition').value,
      space:$('color-space').value, curve:$('curve').value, reverse:$('reverse').checked,
      span:Number($('span').value) / 100, offset:Number($('offset').value) / 100,
      overflow:$('overflow').value, pairShift:Number($('pair-shift').value) / 100,
      seed:scatterSeed
    };
  }

  function regenerate() {
    generatedColors = field.generate({type:$('palette-type').value, count:generatedCount,
      baseHue:Number($('base-hue').value), variability:Number($('color-variation').value),
      rotation:Number($('hue-rotation').value), seed:paletteSeed});
  }

  function swatch(index) {
    const label = document.createElement('label'); label.className = 'swatch';
    const name = document.createElement('span'); name.textContent = String(index + 1);
    const input = document.createElement('input'); input.type = 'color'; input.setAttribute('aria-label', `Palette color ${index + 1}`);
    const output = document.createElement('output');
    input.addEventListener('input', () => {
      manualColors = [...activeColors()];
      manualColors[index] = input.value;
      $('palette-source').value = 'manual';
      custom(); sync(); render();
    });
    label.append(name, input, output);
    return label;
  }

  function sync() {
    const generated = $('palette-source').value === 'generated';
    const type = $('palette-type').value;
    const fixed = palettes.isFixedType(type);
    $('generated-controls').hidden = !generated;
    $('base-hue').parentElement.hidden = fixed;
    $('rotation-control').hidden = !fixed || type === 'grayscale';
    $('new-palette').disabled = fixed;
    $('palette-count').value = activeColors().length;
    const swatches = $('palette-swatches');
    while (swatches.children.length > activeColors().length) swatches.lastElementChild.remove();
    while (swatches.children.length < activeColors().length) swatches.append(swatch(swatches.children.length));
    activeColors().forEach((color, index) => {
      swatches.children[index].querySelector('input').value = color;
      swatches.children[index].querySelector('output').value = color;
    });
    const suffix = {'base-hue':'°', 'hue-rotation':'°', 'color-variation':'%', span:'%', offset:'%', 'pair-shift':'%'};
    for (const id of ['palette-count', ...Object.keys(suffix)]) $(id + '-out').value = $(id).value + (suffix[id] || '');
    $('columnsOut').value = $('columns').value;
    $('ratioOut').value = Number($('ratio').value).toFixed(2);
    $('color-space').disabled = $('transition').value === 'steps';
    $('reshuffle').hidden = $('pattern').value !== 'scatter';
    $('pattern-note').textContent = notes[$('pattern').value];

    const strip = $('palette-preview');
    if (!strip.children.length) {
      for (let i = 0; i < 80; i++) {
        const segment = document.createElement('span'); segment.setAttribute('aria-hidden', 'true'); strip.append(segment);
      }
    }
    // Show the palette's blending independently of its placement in the field.
    const preview = {...progression(), overflow:'extend'};
    [...strip.children].forEach((segment, index) => segment.style.backgroundColor = field.sample(activeColors(), index / 79, preview));
  }

  function render() {
    const count = Number($('columns').value);
    const settings = progression();
    composition.style.setProperty('--ratio', $('ratio').value);
    composition.setAttribute('aria-label', `Field of ${count * 2} colored triangles; ${notes[settings.pattern]}`);
    while (composition.children.length > count) composition.lastElementChild.remove();
    while (composition.children.length < count) {
      const column = document.createElement('div'); column.className = 'column'; composition.append(column);
    }
    [...composition.children].forEach((column, index) => {
      column.classList.toggle('flip', $('flip').checked && index % 2 === 1);
      for (let side = 0; side < 2; side++) {
        const position = field.coordinate(index, side, count, settings);
        column.style.setProperty(`--c${side + 1}`, field.sample(activeColors(), position, settings));
      }
    });
  }

  function resetProgression() {
    for (const [id, value] of Object.entries(progressionDefaults)) {
      if (typeof value === 'boolean') $(id).checked = value;
      else $(id).value = value;
    }
  }

  function applyStudy(name) {
    resetProgression();
    paletteSeed = 2107; scatterSeed = 7043;
    $('hue-rotation').value = 0;
    if (name === 'original') {
      manualColors = ['#ff7a72', '#6857ff'];
      $('palette-source').value = 'manual';
    } else {
      $('palette-source').value = 'generated';
      const studies = {
        amber:{type:'monochrome', hue:35, variation:85, count:4, pattern:'sequence', shift:12},
        opposing:{type:'complementary', hue:210, variation:100, count:2, pattern:'opposing', shift:0},
        sunset:{type:'sunset', hue:0, variation:100, count:5, pattern:'sequence', shift:25, span:50, overflow:'mirror'},
        neon:{type:'neon', hue:0, variation:100, count:4, pattern:'sequence', shift:12, span:25, overflow:'repeat', transition:'steps'},
        forest:{type:'forest', hue:0, variation:100, count:6, pattern:'scatter', shift:0}
      };
      const study = studies[name];
      $('palette-type').value = study.type;
      $('base-hue').value = study.hue;
      $('color-variation').value = study.variation;
      generatedCount = study.count;
      $('pattern').value = study.pattern;
      $('pair-shift').value = study.shift;
      $('span').value = study.span || 100;
      $('overflow').value = study.overflow || 'extend';
      $('transition').value = study.transition || 'continuous';
      regenerate();
    }
    sync(); render();
  }

  $('study').addEventListener('change', () => applyStudy($('study').value));
  ['ratio','columns'].forEach(id => $(id).addEventListener('input', () => {sync(); render();}));
  $('flip').addEventListener('change', render);
  $('palette-source').addEventListener('change', () => {custom(); sync(); render();});
  ['palette-type','base-hue','hue-rotation','color-variation'].forEach(id => {
    $(id).addEventListener($(id).tagName === 'SELECT' ? 'change' : 'input', () => {
      if (id === 'palette-type') $('hue-rotation').value = 0;
      custom(); regenerate(); sync(); render();
    });
  });
  $('palette-count').addEventListener('input', () => {
    const count = Number($('palette-count').value);
    if ($('palette-source').value === 'manual') manualColors = field.resizePalette(manualColors, count);
    else {generatedCount = count; regenerate();}
    custom(); sync(); render();
  });
  $('new-palette').addEventListener('click', () => {paletteSeed++; custom(); regenerate(); sync(); render();});
  ['swap','rotate','shuffle'].forEach(id => $(id).addEventListener('click', () => {
    let palette = [...activeColors()];
    if (id === 'swap') palette.reverse();
    if (id === 'rotate') palette.push(palette.shift());
    if (id === 'shuffle') palette = field.shuffle(palette, ++shuffleSeed);
    if ($('palette-source').value === 'manual') manualColors = palette;
    else generatedColors = palette;
    custom(); sync(); render();
  }));
  Object.keys(progressionDefaults).forEach(id => $(id).addEventListener($(id).tagName === 'SELECT' || $(id).type === 'checkbox' ? 'change' : 'input', () => {custom(); sync(); render();}));
  $('reshuffle').addEventListener('click', () => {scatterSeed++; custom(); render();});
  $('reset-progression').addEventListener('click', () => {custom(); resetProgression(); sync(); render();});
  regenerate(); sync(); render();
})();
