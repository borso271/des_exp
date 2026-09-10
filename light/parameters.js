(() => {
  'use strict';

  // Reference values and the control schema share one source of truth.
  const defaults = {
    "apexX": 0.5009770395701026,
    "apexY": 0.4749568221070812,
    "zoom": 1,
    "rotation": 0,
    "beamAngle": 45.19438875098365,
    "falloffDistance": 1,
    "beamIntensity": 1,
    "sourceIntensity": 1,
    "tipRadius": 0.021914500848144804,
    "edgeSoftness": 1,
    "lowerDiffusion": 1,
    "axialSpread": 1,
    "chromaticSpread": 1,
    "hazeStructure": 1,
    "hazeVariation": 0.65,
    "beamTint": "#ffffff",
    "haloIntensity": 1,
    "haloScale": 1,
    "haloBlue": 1,
    "haloWarm": 1,
    "haloViolet": 1,
    "corona": 1,
    "ambient": 1,
    "haloTint": "#ffffff",
    "flareIntensity": 1,
    "flareSize": 1,
    "flareX": 0,
    "flareY": 0,
    "flareSoftness": 1,
    "flareRim": 1,
    "warmGhost": 1,
    "flareTint": "#ffffff",
    "exposure": 0,
    "saturation": 1,
    "bloom": 0,
    "bloomRadius": 1,
    "blackLevel": 0,
    "whiteLevel": 1,
    "grain": 0.6,
    "frame": "reference",
    "quality": 1,
    "animate": false
  };

  const groups = [
    {
      title: "Composition",
      items: [
        ["apexX", "Source X", 0.05, 0.95, 0.001],
        ["apexY", "Source Y", 0.08, 0.93, 0.001],
        ["zoom", "Scale", 0.4, 2, 0.01],
        ["rotation", "Rotation", -60, 60, 0.1],
        ["beamAngle", "Half-angle °", 20, 67, 0.1],
        ["falloffDistance", "Falloff length", 0.4, 2, 0.01]
      ]
    },
    {
      title: "Beam / rounded source",
      items: [
        ["beamIntensity", "Beam energy", 0.1, 2.5, 0.01],
        ["sourceIntensity", "Source energy", 0.4, 3, 0.01],
        ["tipRadius", "Tip rounding", 0.003, 0.05, 0.001],
        ["edgeSoftness", "Upper softness", 0.2, 3, 0.01],
        ["lowerDiffusion", "Lower diffusion", 0.15, 2.5, 0.01],
        ["axialSpread", "Axial spread", 0.5, 1.7, 0.01],
        ["chromaticSpread", "Blue spread", 0, 2, 0.01],
        ["hazeStructure", "Haze shaping", 0, 1.8, 0.01],
        ["hazeVariation", "Haze texture", 0, 3, 0.01],
        ["beamTint", "Beam tint"]
      ]
    },
    {
      title: "Optical arch / darkness",
      items: [
        ["haloIntensity", "Arch intensity", 0, 2.5, 0.01],
        ["haloScale", "Arch size", 0.5, 1.7, 0.01],
        ["haloBlue", "Outer blue", 0, 2.5, 0.01],
        ["haloWarm", "Inner warm", 0, 2.5, 0.01],
        ["haloViolet", "Violet stain", 0, 2.5, 0.01],
        ["corona", "Source corona", 0, 2.5, 0.01],
        ["ambient", "Room floor", 0, 3, 0.01],
        ["haloTint", "Arch tint"]
      ]
    },
    {
      title: "Lens ghosts",
      items: [
        ["flareIntensity", "Pupil ghost", 0, 2, 0.01],
        ["flareSize", "Ghost size", 0.3, 1.7, 0.01],
        ["flareX", "Ghost X offset", -0.2, 0.2, 0.001],
        ["flareY", "Ghost Y offset", -0.2, 0.1, 0.001],
        ["flareSoftness", "Ghost softness", 0.4, 3, 0.01],
        ["flareRim", "Lower rim", 0, 2, 0.01],
        ["warmGhost", "Warm ghost", 0, 2, 0.01],
        ["flareTint", "Ghost tint"]
      ]
    },
    {
      title: "Camera / finishing",
      items: [
        ["exposure", "Exposure EV", -3, 2, 0.01],
        ["saturation", "Saturation", 0, 2, 0.01],
        ["bloom", "Extra bloom", 0, 2, 0.01],
        ["bloomRadius", "Bloom radius", 0.3, 3, 0.01],
        ["blackLevel", "Black offset", -4, 8, 0.1],
        ["whiteLevel", "White level", 0.8, 1, 0.001],
        ["grain", "Grain", 0, 3, 0.05]
      ]
    },
  ];

  const specMap = new Map(groups.flatMap(group => group.items).map(spec => [spec[0], spec]));

  function validate(update) {
    if (!update || typeof update !== 'object' || Array.isArray(update)) {
      throw new TypeError('Parameters must be an object.');
    }
    const result = {};
    for (const [key, value] of Object.entries(update)) {
      if (!Object.prototype.hasOwnProperty.call(defaults, key)) {
        throw new TypeError(`Unknown parameter: ${key}`);
      }
      if (key === 'frame') {
        if (!['reference', 'clean', 'viewport'].includes(value)) throw new TypeError('Invalid frame.');
        result[key] = value;
      } else if (key === 'quality') {
        if (![0.75, 1, 1.5, 2].includes(value)) throw new TypeError('Quality must be 0.75, 1, 1.5, or 2.');
        result[key] = value;
      } else if (key === 'animate') {
        if (typeof value !== 'boolean') throw new TypeError('animate must be boolean.');
        result[key] = value;
      } else if (typeof defaults[key] === 'string') {
        if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
          throw new TypeError(`Invalid color for ${key}.`);
        }
        result[key] = value.toLowerCase();
      } else {
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be finite.`);
        const spec = specMap.get(key);
        result[key] = Math.min(spec[3], Math.max(spec[2], value));
      }
    }
    return result;
  }

  window.LightStudyModules = {defaults, groups, validate};
})();
