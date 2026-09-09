'use strict';
/*
 * TRIANGLE / LIGHT
 * --------------------------------------------------------------
 * A self-contained, art-directed 2.5D reconstruction; not a claim
 * of physically measured light transport or an exact 3D model.
 * No libraries, remote assets, image textures or build step.
 *
 * Pipeline:
 *   1. Analytic geometry + linear-light interior / room shading.
 *   2. Six-scale, separable Gaussian bloom from the emitter only.
 *   3. Linear-light composite -> exposure -> soft highlight shoulder
 *      -> sRGB encoding -> sub-LSB dithering / photographic grain.
 *
 * RGBA16F when EXT_color_buffer_float is available. A square-root
 * encoded RGBA8 fallback retains the same renderer at lower precision.
 * Alpha in the scene target is an emitter mask, NOT transparency.
 *
 * Reference geometry was estimated from the supplied screenshot.
 * Width/height/softness are expressed in units of image height;
 * posX is a fraction of image width; posY a fraction of image height.
 * The complete composition maintains its aspect ratio on resize.
 *
 * API (after initialization):
 *   lightStudy.getParameters()
 *   lightStudy.setParameters({ vertexTop: 1.8, seamStrength: 1.1 })
 *   lightStudy.reset()
 *   lightStudy.render()
 *   await lightStudy.exportPNG(2842)
 *   lightStudy.getDiagnostics()
 */

const REFERENCE_ASPECT = 1421 / 931;
const DEFAULTS = Object.freeze({
  aspect: 'reference', quality: 1,
  paletteStyle: 'reference', baseHue: 210, colorVariation: 40,
  posX: 0.497, posY: 0.820, width: 0.444, height: 0.457,
  apexLean: 0.010, roll: -0.12,
  intensity: 1.0, coreColor: '#05a7ff', seamColor: '#03ffff',
  vertexTop: 1.0, vertexLeft: 1.15, vertexRight: 1.65,
  vertexReach: 0.060, vertexFocus: 1.0,
  seamStrength: 0.0, seamWidth: 0.020,
  junctionDepth: 0.870, junctionX: 0.0, facet: 1.0,
  edgeSoftness: 0.0022,
  spillColor: '#021fff', spillStrength: 1.0, spillReach: 1.0,
  ambientColor: '#000637', ambient: 1.0,
  floorEnabled: true, floorSlope: 0.270, floorBounce: 0.255, floorDepth: 0.054,
  bloom: 0.055, bloomRadius: 1.0,
  exposure: 0.0, saturation: 1.0, vignette: 0.12, grain: 0.30
});

// key, label, minimum, maximum, step. Changes are sanitized by the same
// schema for UI edits, loaded JSON and the public JavaScript API.
const GROUPS = [
  { title: 'Composition', open: true, items: [
    ['aspect','Frame','select', [ ['reference','Reference · 1.526:1'], ['16:9','16:9'], ['4:3','4:3'], ['1:1','Square'], ['viewport','Fill available space'] ]],
    ['posX','Position X',0.05,0.95,0.001], ['posY','Base height',0.20,1.05,0.001],
    ['width','Triangle width',0.10,1.15,0.001], ['height','Triangle height',0.12,0.95,0.001],
    ['apexLean','Apex offset',-0.45,0.45,0.001], ['roll','Roll (degrees)',-30,30,0.1]
  ]},
  { title: 'Light / three vertices', open: true, items: [
    ['intensity','Light intensity',0,3,0.01],
    ['vertexTop','Top vertex',0,3,0.01], ['vertexLeft','Left vertex',0,3,0.01], ['vertexRight','Right vertex',0,3,0.01],
    ['vertexReach','Vertex reach',0.008,0.16,0.001], ['vertexFocus','Vertex focus',0.25,3,0.01],
    ['seamStrength','Y-seam light',0,2.5,0.01], ['seamWidth','Y-seam width',0.002,0.06,0.001]
  ]},
  { title: 'Interior / optical edge', open: false, items: [
    ['junctionDepth','Junction depth',0.45,0.97,0.001], ['junctionX','Junction offset',-0.55,0.55,0.001],
    ['facet','Lower plane',0,2,0.01], ['edgeSoftness','Edge softness',0.0002,0.008,0.0001]
  ]},
  { title: 'Color / palette', open: true, note: 'Palette controls coordinate all four colors. Edit a color below to customize it. Base hue also rotates named palettes.', items: [
    ['paletteStyle','Palette style','select', [
      ['reference','Original blue'], ['monochrome','Near monochrome'],
      ['analogous','Analogous'], ['complementary','Complementary'],
      ['split','Split complementary'], ['triadic','Triadic'],
      ['sunset','Sunset'], ['forest','Forest'], ['neon','Neon'],
      ['ocean','Ocean'], ['candy','Candy'], ['grayscale','Grayscale'],
      ['random','Random harmony'], ['custom','Custom']
    ]],
    ['baseHue','Base hue',0,360,1],
    ['colorVariation','Color variation',0,100,1],
    ['coreColor','Triangle color','color'], ['seamColor','Vertex / seam','color'],
    ['spillColor','Wall spill','color'], ['ambientColor','Unlit wall','color'],
    ['saturation','Saturation',0,1.5,0.01]
  ]},
  { title: 'Room / spill / floor', open: false, items: [
    ['floorEnabled','Show floor','checkbox'],
    ['spillStrength','Wall spill',0,2.5,0.01], ['spillReach','Spill reach',0.35,2.5,0.01],
    ['ambient','Wall ambient',0,2.5,0.01], ['floorSlope','Floor perspective',0,0.65,0.005],
    ['floorBounce','Floor bounce',0,0.6,0.005], ['floorDepth','Bounce depth',0.012,0.20,0.001]
  ]},
  { title: 'Camera / rendering', open: false, items: [
    ['bloom','Optical bloom',0,0.5,0.005], ['bloomRadius','Bloom radius',0.35,3,0.01],
    ['exposure','Exposure (EV)',-3,2,0.01], ['vignette','Vignette',0,0.6,0.01],
    ['grain','Photo grain',0,2,0.01],
    ['quality','Render scale','select', [['0.75','0.75×'], ['1','1× / device pixels'], ['1.5','1.5×'], ['2','2× supersampling']]]
  ]}
];
const SCHEMA = new Map(GROUPS.flatMap(g => g.items.map(item => [item[0], item])));
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function sanitize(patch, previous = DEFAULTS) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Settings must be an object.');
  const result = { ...previous };
  for (const [key, value] of Object.entries(patch)) {
    const spec = SCHEMA.get(key);
    if (!spec) continue;
    if (spec[2] === 'checkbox') {
      if (typeof value === 'boolean') result[key] = value;
    } else if (spec[2] === 'color') {
      if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) result[key] = value.toLowerCase();
    } else if (spec[2] === 'select') {
      if (spec[3].some(([v]) => v === String(value))) result[key] = key === 'quality' ? Number(value) : String(value);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = clamp(value, spec[2], spec[3]);
    }
  }
  return result;
}
function linearColor(hex) {
  return [1,3,5].map(i => {
    const s = parseInt(hex.slice(i, i + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
out vec2 vUV;
void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const SHARED_SHADER = `
precision highp float;
precision highp int;
in vec2 vUV;
out vec4 fragColor;
uniform bool uHDR;
const float ENCODE_RANGE = 8.0;
float sq(float x) { return x*x; }
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 decodeLight(vec3 value) {
  return uHDR ? value : value * value * ENCODE_RANGE;
}
vec3 encodeLight(vec3 value) {
  if (uHDR) return max(value, vec3(0));
  // Stochastic rounding combats posterization in the RGBA8 fallback.
  float dither = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  return clamp(sqrt(max(value, vec3(0)) / ENCODE_RANGE) + dither, 0.0, 1.0);
}
vec3 readLight(sampler2D tex, vec2 uv) { return decodeLight(texture(tex, uv).rgb); }
`;

const SCENE_SHADER = `#version 300 es
${SHARED_SHADER}
uniform vec2 uResolution;
uniform vec2 uPosition;
uniform vec2 uSize;
uniform float uApexLean, uRoll;
uniform float uIntensity;
uniform vec3 uCoreColor, uSeamColor, uSpillColor, uAmbientColor;
uniform vec3 uFloorTint;
uniform vec3 uVertexGain;
uniform float uVertexReach, uVertexFocus;
uniform float uSeamStrength, uSeamWidth;
uniform float uJunctionDepth, uJunctionX, uFacet;
uniform float uEdgeSoftness;
uniform float uSpillStrength, uSpillReach, uAmbient;
uniform float uFloorSlope, uFloorBounce, uFloorDepth;
uniform bool uFloorEnabled;

float cross2(vec2 a, vec2 b) { return a.x*b.y - a.y*b.x; }
vec2 segmentInfo(vec2 p, vec2 a, vec2 b) {
  vec2 e = b-a;
  float t = clamp(dot(p-a, e) / max(dot(e,e), 1e-9), 0.0, 1.0);
  return vec2(length(p - a - t*e), t);
}
// Euclidean outside distance, with a negative sign inside the triangle.
// Unlike a half-plane-only distance, this stays correct near the vertices.
float triangleDistance(vec2 p, vec2 a, vec2 b, vec2 c) {
  float side = sign(cross2(b-a,c-a));
  float w = min(min(side*cross2(b-a,p-a), side*cross2(c-b,p-b)), side*cross2(a-c,p-c));
  float d = min(min(segmentInfo(p,a,b).x, segmentInfo(p,b,c).x), segmentInfo(p,c,a).x);
  return w >= 0.0 ? -d : d;
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),
             mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y);
}
float seamField(vec2 p, vec2 a, vec2 b, float width) {
  vec2 s = segmentInfo(p,a,b);
  float w = width * mix(0.36, 1.18, s.y);
  return exp(-0.5*sq(s.x / max(w, 0.0002)));
}
// Anisotropic, inward-facing light concentration. This is deliberately
// NOT an isotropic point glow sitting on top of each corner.
float vertexField(vec2 p, vec2 vertex, vec2 junction) {
  vec2 axis = normalize(junction - vertex);
  vec2 d = p - vertex;
  float along = dot(d,axis);
  float across = abs(cross2(axis,d));
  float spread = (0.0035 + max(along,0.0)*0.24) / uVertexFocus;
  float longitudinal = exp(-max(along,0.0)/uVertexReach);
  float forward = 1.0 - smoothstep(0.0,0.008,-along);
  return longitudinal * exp(-0.5*sq(across/spread)) * forward;
}
void main() {
  float aspect = uResolution.x/uResolution.y;
  // Design coordinates: image-height units, y down. No aspect distortion.
  vec2 p = vec2(vUV.x*aspect, 1.0-vUV.y);
  vec2 origin = vec2(uPosition.x*aspect, uPosition.y);
  float cs = cos(uRoll), sn = sin(uRoll);
  vec2 q = mat2(cs,-sn,sn,cs) * (p-origin);
  float w = uSize.x, h = uSize.y;
  vec2 A = vec2(uApexLean*w, -h);
  vec2 B = vec2(-0.5*w, 0.0);
  vec2 C = vec2( 0.5*w, 0.0);
  vec2 J = vec2(uJunctionX*w*0.5, -h*(1.0-uJunctionDepth));
  float t = (q.y+h)/h;
  float sdf = triangleDistance(q,A,B,C);
  float aa = max(0.65*fwidth(sdf), uEdgeSoftness);
  float inside = 1.0-smoothstep(-aa,aa,sdf);

  // Deep blue wall spill. Two falloff scales keep the immediate spill
  // luminous while allowing a large, very dark outer field.
  float outside = max(sdf,0.0);
  float spread = uSpillReach;
  float visibility = 0.20 + 0.90*exp(-sq((t-0.37)/0.45));
  float spill = (0.42*exp(-outside/(0.050*spread))
              + 0.19*exp(-outside/(0.132*spread))) * visibility;
  float broad = exp(-0.5*(sq(q.x/(w*0.68+0.08)) + sq((q.y+h*0.46)/(h*0.75+0.04))));
  vec3 wall = uAmbientColor*uAmbient;
  wall += uSpillColor * uSpillStrength * uIntensity * (spill + 0.010*broad);
  wall *= 0.97 + 0.03*smoothstep(-0.15,0.25,q.x);

  // The floor is a clipped architectural plane, NOT a horizontal strip.
  // Its two perspective edges originate at the bottom triangle vertices.
  float floorLine = max(abs(q.x)-w*0.5,0.0)*uFloorSlope;
  float floorAA = max(0.0015,0.7*fwidth(q.y-floorLine));
  float floorMask = smoothstep(-floorAA,floorAA,q.y-floorLine);
  float dy = max(q.y,0.0);
  float reflected = exp(-dy/uFloorDepth)
                  * exp(-sq(q.x/(w*0.60 + dy*0.45)));
  vec3 floorLight = uFloorTint + uAmbientColor*uAmbient*0.025;
  floorLight += uSpillColor*uFloorBounce*uIntensity*reflected;
  vec3 room = uFloorEnabled ? mix(wall,floorLight,floorMask) : wall;

  // Interior: three softly meeting planes. The lower face is deliberately
  // shallow, so the Y-junction sits close to the base, as in the reference.
  float lowerSDF = triangleDistance(q,J,B,C);
  float lowerFace = 1.0-smoothstep(-0.010,0.010,lowerSDF);
  float faceVariation = 0.016*smoothstep(-0.09,0.09,q.x-J.x);
  float body = 1.0 + 0.018*t + faceVariation;
  vec3 core = uCoreColor*body;
  core += uSeamColor*lowerFace*0.18*uFacet;

  // The vertical seam fans out into the room corner. Its width is
  // strongly non-linear; a constant-width line misses the reference.
  vec2 topInfo = segmentInfo(q,A,J);
  float st = topInfo.y;
  float topWidth = uSeamWidth*(0.20 + 3.30*pow(st,1.6) + 0.55*pow(st,8.0));
  // Attenuation follows the two lower Y-branches, not a horizontal
  // cutoff at J; otherwise a false crossbar appears inside the triangle.
  float belowJunction = max(-lowerSDF,0.0);
  float topSeam = exp(-0.5*sq(topInfo.x/topWidth)) * exp(-belowJunction/0.018);
  float topAmplitude = 0.225 + 0.105*smoothstep(0.45,1.0,st) + 0.065*pow(st,8.0);
  float leftSeam = seamField(q,B,J,uSeamWidth*0.85);
  float rightSeam = seamField(q,C,J,uSeamWidth*0.90);
  float junctionPool = exp(-0.5*dot(q-J,q-J)/sq(uSeamWidth*1.8));
  float leftFade = mix(1.0,0.30,segmentInfo(q,B,J).y);
  float rightFade = mix(1.0,0.30,segmentInfo(q,C,J).y);
  float seams = topAmplitude*topSeam + 0.165*leftSeam*leftFade
              + 0.170*rightSeam*rightFade + 0.020*junctionPool;
  core += uSeamColor*seams*uSeamStrength;

  float vertices = vertexField(q,A,J)*uVertexGain.x*0.22
                 + vertexField(q,B,J)*uVertexGain.y
                 + vertexField(q,C,J)*uVertexGain.z;
  core += uSeamColor*vertices*0.235;
  // The narrow apex bathes the entire upper wedge, rather than only
  // adding a circular hotspot at its tip.
  core += uSeamColor*(0.40*exp(-max(t,0.0)/0.16))*uVertexGain.x;

  // An extremely slight edge concentration; no bright neon outline.
  float edgeBand = exp(-max(-sdf,0.0)/0.0018);
  core += uSeamColor*0.014*edgeBand;

  // Fixed spatial texture: no crawling noise, particles or animated fog.
  float textureFine = noise2(p*520.0)-0.5;
  float textureWide = noise2(p*85.0)-0.5;
  core *= 1.0 + textureFine*0.012 + textureWide*0.006;
  core *= uIntensity;

  vec3 radiance = mix(room,core,inside);
  fragColor = vec4(encodeLight(radiance),inside);
}`;

const DOWNSAMPLE_SHADER = `#version 300 es
${SHARED_SHADER}
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform bool uExtract;
vec3 tap(vec2 uv) {
  vec4 s = texture(uSource,uv);
  return decodeLight(s.rgb) * (uExtract ? s.a : 1.0);
}
void main() {
  // A normalized 3x3 tent, applied in LINEAR light.
  vec2 d = uTexel;
  vec3 c = tap(vUV)*4.0;
  c += (tap(vUV+vec2(d.x,0)) + tap(vUV-vec2(d.x,0))
      + tap(vUV+vec2(0,d.y)) + tap(vUV-vec2(0,d.y)))*2.0;
  c += tap(vUV+d) + tap(vUV-d) + tap(vUV+vec2(d.x,-d.y)) + tap(vUV+vec2(-d.x,d.y));
  fragColor = vec4(encodeLight(c/16.0),1.0);
}`;

const BLUR_SHADER = `#version 300 es
${SHARED_SHADER}
uniform sampler2D uSource;
uniform vec2 uDirection;
void main() {
  // Symmetric nine-tap Gaussian, reduced to five bilinear reads.
  vec3 c = readLight(uSource,vUV)*0.2270270270;
  c += (readLight(uSource,vUV+uDirection*1.3846153846)
      + readLight(uSource,vUV-uDirection*1.3846153846))*0.3162162162;
  c += (readLight(uSource,vUV+uDirection*3.2307692308)
      + readLight(uSource,vUV-uDirection*3.2307692308))*0.0702702703;
  fragColor = vec4(encodeLight(c),1.0);
}`;

const COMPOSITE_SHADER = `#version 300 es
${SHARED_SHADER}
uniform sampler2D uScene, uBloom0, uBloom1, uBloom2, uBloom3, uBloom4, uBloom5;
uniform vec2 uResolution;
uniform float uBloom, uExposure, uSaturation, uVignette, uGrain;
uniform vec3 uBloomTint;
vec3 linearToSRGB(vec3 x) {
  return mix(12.92*x,1.055*pow(max(x,vec3(0.0)),vec3(1.0/2.4))-0.055,
             step(vec3(0.0031308),x));
}
vec3 highlightShoulder(vec3 x) {
  // Leave shadows/midtones unchanged. Compress only the final highlights.
  // This avoids lifting the navy blacks or desaturating cyan to white.
  const float start = 0.92;
  vec3 shoulder = start + (1.0-start)*(1.0-exp(-max(x-start,vec3(0.0))/(1.0-start)));
  return mix(x,shoulder,step(vec3(start),x));
}
void main() {
  vec4 source = texture(uScene,vUV);
  vec3 c = decodeLight(source.rgb);
  // Redistribute a fraction of the emitter into the optical blur rather
  // than merely adding energy and bleaching the whole triangle.
  c *= 1.0 - uBloom*source.a;
  vec3 narrow = readLight(uBloom0,vUV)*0.42 + readLight(uBloom1,vUV)*0.30;
  vec3 wide = readLight(uBloom2,vUV)*0.16 + readLight(uBloom3,vUV)*0.08
            + readLight(uBloom4,vUV)*0.03 + readLight(uBloom5,vUV)*0.01;
  c += uBloom*(narrow + wide*uBloomTint);
  vec2 centered = (vUV-0.5)*2.0;
  float vignette = 1.0-uVignette*0.35*dot(centered,centered);
  c *= vignette*exp2(uExposure);
  float luminance = dot(c,vec3(0.2126,0.7152,0.0722));
  c = max(mix(vec3(luminance),c,uSaturation),vec3(0.0));
  c = linearToSRGB(highlightShoulder(c));

  // Output-space dithering breaks up 8-bit gradient steps. Triangular
  // noise is zero-mean and remains fixed when the scene is stationary.
  float n = hash12(gl_FragCoord.xy+vec2(17,93))-hash12(gl_FragCoord.yx+vec2(71,29));
  c += n*(0.58 + uGrain*1.7)/255.0;
  fragColor = vec4(clamp(c,0.0,1.0),1.0);
}`;

class GLProgram {
  constructor(gl, fragmentSource, name) {
    this.gl = gl;
    this.name = name;
    const shaders = [];
    let program = null;
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX_SHADER], [gl.FRAGMENT_SHADER, fragmentSource]]) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error(`${name}: could not allocate shader.`);
        shaders.push(shader);
        gl.shaderSource(shader,source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
          throw new Error(`${name}: shader compilation failed.\n${gl.getShaderInfoLog(shader)}`);
        }
      }
      program = gl.createProgram();
      if (!program) throw new Error(`${name}: could not allocate program.`);
      shaders.forEach(s => gl.attachShader(program,s));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(`${name}: ${gl.getProgramInfoLog(program)}`);
      this.handle = program;
      this.uniforms = new Map();
      const count = gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);
      for (let i=0; i<count; i++) {
        const info = gl.getActiveUniform(program,i);
        this.uniforms.set(info.name,{ location: gl.getUniformLocation(program,info.name), type: info.type });
      }
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally { shaders.forEach(s => gl.deleteShader(s)); }
  }
  use(values) {
    const gl = this.gl;
    gl.useProgram(this.handle);
    for (const [key,value] of Object.entries(values)) {
      const u = this.uniforms.get(key);
      if (!u) continue; // Optimized-out uniforms are legitimate.
      switch (u.type) {
        case gl.FLOAT: gl.uniform1f(u.location,value); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(u.location,value); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(u.location,value); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(u.location,value); break;
        case gl.BOOL: case gl.INT: case gl.SAMPLER_2D: gl.uniform1i(u.location,Number(value)); break;
        default: throw new Error(`Unsupported uniform type: ${key}`);
      }
    }
  }
  dispose() { this.gl.deleteProgram(this.handle); }
}

class LightRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    if (!this.gl) throw new Error('WebGL 2 is unavailable. Enable hardware acceleration or open this file in a WebGL 2-capable browser.');
    this.width = this.height = 0;
    this.targets = [];
    this.programs = [];
    this.initGPU();
  }
  initGPU() {
    const gl = this.gl;
    if ('drawingBufferColorSpace' in gl) gl.drawingBufferColorSpace = 'srgb';
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DITHER); // Explicit, controlled output dithering instead.
    const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    this.maxSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),viewport[0],viewport[1]);
    this.hdr = Boolean(gl.getExtension('EXT_color_buffer_float'));
    this.targets = [];
    this.programs = [];
    try {
      this.sceneProgram = new GLProgram(gl,SCENE_SHADER,'Scene'); this.programs.push(this.sceneProgram);
      this.downProgram = new GLProgram(gl,DOWNSAMPLE_SHADER,'Downsample'); this.programs.push(this.downProgram);
      this.blurProgram = new GLProgram(gl,BLUR_SHADER,'Gaussian blur'); this.programs.push(this.blurProgram);
      this.compositeProgram = new GLProgram(gl,COMPOSITE_SHADER,'Composite'); this.programs.push(this.compositeProgram);
      this.vao = gl.createVertexArray();
      this.vbo = gl.createBuffer();
      if (!this.vao || !this.vbo) throw new Error('Unable to allocate vertex buffer.');
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);
      // An oversized single triangle covers the viewport without a seam.
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 3,-1, -1,3]),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
      this.width = this.height = 0;
    } catch (error) { this.dispose(); throw error; }
  }
  createTarget(width,height) {
    const gl = this.gl;
    const texture = gl.createTexture(), framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) {
      if (texture) gl.deleteTexture(texture);
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      throw new Error('Could not allocate render target. Lower the render scale.');
    }
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D,1,this.hdr ? gl.RGBA16F : gl.RGBA8,width,height);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer);
      throw new Error(`Incomplete framebuffer: 0x${status.toString(16)}`);
    }
    const result = {texture,framebuffer,width,height};
    this.targets.push(result);
    return result;
  }
  deleteTargets() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    for (const target of this.targets) {
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    }
    this.targets = [];
    this.scene = null;
    this.levels = [];
  }
  resize(width,height) {
    width = Math.max(2,Math.round(width)); height = Math.max(2,Math.round(height));
    if (width > this.maxSize || height > this.maxSize) throw new Error(`Requested resolution exceeds this GPU's ${this.maxSize}px limit.`);
    if (width === this.width && height === this.height && this.scene) return;
    this.deleteTargets();
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;
    const allocate = () => {
      this.scene = this.createTarget(width,height);
      this.levels = [];
      let w=width, h=height;
      for (let i=0;i<6;i++) {
        w=Math.max(2,Math.ceil(w/2)); h=Math.max(2,Math.ceil(h/2));
        this.levels.push({ a:this.createTarget(w,h), b:this.createTarget(w,h) });
      }
    };
    try { allocate(); }
    catch (error) {
      this.deleteTargets();
      if (!this.hdr) throw error;
      // Some drivers advertise float support but reject actual targets.
      this.hdr = false;
      try { allocate(); } catch (fallbackError) { this.deleteTargets(); throw fallbackError; }
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null);
  }
  bindTexture(unit,target) {
    const gl=this.gl;
    gl.activeTexture(gl.TEXTURE0+unit);
    gl.bindTexture(gl.TEXTURE_2D,target.texture);
  }
  pass(program,target,uniforms) {
    const gl=this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER,target ? target.framebuffer : null);
    gl.viewport(0,0,target ? target.width : this.width,target ? target.height : this.height);
    program.use({ uHDR:this.hdr, ...uniforms });
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  render(p) {
    const gl=this.gl;
    if (gl.isContextLost() || !this.scene) return;
    const tints=window.TrianglePalette.lightTints(p,linearColor);
    gl.bindVertexArray(this.vao);
    this.pass(this.sceneProgram,this.scene,{
      uResolution:[this.width,this.height], uPosition:[p.posX,p.posY], uSize:[p.width,p.height],
      uApexLean:p.apexLean, uRoll:p.roll*Math.PI/180, uIntensity:p.intensity,
      uCoreColor:linearColor(p.coreColor), uSeamColor:linearColor(p.seamColor),
      uSpillColor:linearColor(p.spillColor), uAmbientColor:linearColor(p.ambientColor),
      uFloorTint:tints.floor,
      uVertexGain:[p.vertexTop,p.vertexLeft,p.vertexRight], uVertexReach:p.vertexReach, uVertexFocus:p.vertexFocus,
      uSeamStrength:p.seamStrength, uSeamWidth:p.seamWidth, uJunctionDepth:p.junctionDepth,
      uJunctionX:p.junctionX, uFacet:p.facet, uEdgeSoftness:p.edgeSoftness,
      uSpillStrength:p.spillStrength, uSpillReach:p.spillReach, uAmbient:p.ambient,
      uFloorEnabled:p.floorEnabled,
      uFloorSlope:p.floorSlope, uFloorBounce:p.floorBounce, uFloorDepth:p.floorDepth
    });
    let source=this.scene;
    // Radius is tied to composition height, not device pixels. A high-
    // resolution export therefore keeps the same apparent bloom width.
    const bloomPixels=p.bloomRadius*this.height/931;
    for (let i=0;i<this.levels.length;i++) {
      const {a,b}=this.levels[i];
      this.bindTexture(0,source);
      this.pass(this.downProgram,a,{uSource:0,uTexel:[1/source.width,1/source.height],uExtract:i===0});
      this.bindTexture(0,a);
      this.pass(this.blurProgram,b,{uSource:0,uDirection:[bloomPixels/a.width,0]});
      this.bindTexture(0,b);
      this.pass(this.blurProgram,a,{uSource:0,uDirection:[0,bloomPixels/a.height]});
      source=a;
    }
    this.bindTexture(0,this.scene);
    this.levels.forEach((level,i)=>this.bindTexture(i+1,level.a));
    this.pass(this.compositeProgram,null,{
      uScene:0,uBloom0:1,uBloom1:2,uBloom2:3,uBloom3:4,uBloom4:5,uBloom5:6,
      uResolution:[this.width,this.height], uBloom:p.bloom,uExposure:p.exposure,
      uBloomTint:tints.bloom,
      uSaturation:p.saturation,uVignette:p.vignette,uGrain:p.grain
    });
    // Used outside rAF as well, e.g. during a PNG export.
    gl.flush();
  }
  dispose() {
    this.deleteTargets();
    this.programs.forEach(p=>p.dispose());
    this.programs=[];
    if (this.vao) this.gl.deleteVertexArray(this.vao);
    if (this.vbo) this.gl.deleteBuffer(this.vbo);
  }
}

const canvas=document.getElementById('art');
const stage=document.getElementById('stage');
const message=document.getElementById('message');
const status=document.getElementById('status');
const uiInputs=new Map();
let params={...DEFAULTS};
let renderer=null, scheduled=0, exporting=false, contextLost=false, disposed=false;

function showMessage(text) { message.textContent=text; }
function fail(error) {
  console.error(error);
  window.LabEmbed?.fail(error.message || error);
  const box=document.getElementById('error');
  box.hidden=false;
  box.textContent=error instanceof Error ? error.message : String(error);
}
function formatValue(value,step) {
  const decimals=(String(step).split('.')[1]||'').length;
  return Number(value).toFixed(decimals);
}
function updateUI() {
  for (const [key,objects] of uiInputs) {
    for (const input of objects) {
      if (input.tagName === 'OUTPUT') input.textContent=params[key];
      else if (input.type === 'checkbox') input.checked=params[key];
      else if (input.type === 'number') input.value=formatValue(params[key],SCHEMA.get(key)[4]);
      else input.value=String(params[key]);
      if (['floorSlope','floorBounce','floorDepth'].includes(key)) input.disabled=!params.floorEnabled;
    }
  }
}
function setParameters(patch) {
  params=window.TrianglePalette.applyChange(sanitize(patch,params),params,patch);
  updateUI();
  requestRender();
  window.LabEmbed?.changed();
  return {...params};
}
// Validate complete snapshots against the very same schema as the native UI.
// Unlike the legacy partial-import API, host imports must never silently clamp
// values, fill missing fields or discard unsupported settings.
function validateState(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).length !== Object.keys(DEFAULTS).length ||
      Object.keys(DEFAULTS).some(key => !Object.hasOwn(input,key))) {
    throw new TypeError('Expected complete Triangle / Light settings.');
  }
  const result=sanitize(input);
  for (const key of Object.keys(result)) {
    if (result[key] !== input[key]) throw new TypeError(`Invalid triangle setting: ${key}.`);
  }
  return result;
}
function setState(input) {
  params=validateState(input);
  updateUI(); requestRender();
  window.LabEmbed?.changed();
  return {...params};
}
function buildControls() {
  const root=document.getElementById('controls');
  for (const group of GROUPS) {
    const details=document.createElement('details'); details.open=group.open;
    const summary=document.createElement('summary'); summary.textContent=group.title;
    details.append(summary);
    if (group.note) {
      const note=document.createElement('p'); note.textContent=group.note; details.append(note);
    }
    for (const item of group.items) {
      const [key,label,min,max,step]=item;
      const row=document.createElement('div'); row.className='control';
      const text=document.createElement('label'); text.htmlFor=`p-${key}`; text.textContent=label;
      row.append(text);
      const inputs=[];
      if (min === 'select') {
        const select=document.createElement('select'); select.id=`p-${key}`;
        for (const [value,title] of max) {
          const option=document.createElement('option'); option.value=value; option.textContent=title; select.append(option);
        }
        select.addEventListener('change',()=>setParameters({[key]:key==='quality'?Number(select.value):select.value}));
        row.append(select); inputs.push(select);
      } else if (min === 'checkbox') {
        const input=document.createElement('input'); input.type='checkbox'; input.id=`p-${key}`;
        input.addEventListener('change',()=>setParameters({[key]:input.checked}));
        row.append(input); inputs.push(input);
      } else if (min === 'color') {
        const input=document.createElement('input'); input.type='color'; input.id=`p-${key}`;
        const output=document.createElement('output'); output.className='hex'; output.htmlFor=input.id;
        input.addEventListener('input',()=>setParameters({[key]:input.value}));
        row.append(input,output); inputs.push(input,output);
      } else {
        const range=document.createElement('input'); range.type='range'; range.id=`p-${key}`;
        const number=document.createElement('input'); number.type='number'; number.setAttribute('aria-label',label);
        for (const input of [range,number]) { input.min=min; input.max=max; input.step=step; }
        range.addEventListener('input',()=>setParameters({[key]:Number(range.value)}));
        range.addEventListener('dblclick',()=>setParameters({[key]:DEFAULTS[key]}));
        // Commit numeric fields on change so decimals can be typed naturally.
        number.addEventListener('change',()=>{
          if (number.value.trim() !== '' && Number.isFinite(number.valueAsNumber)) setParameters({[key]:number.valueAsNumber});
          else updateUI();
        });
        row.append(range,number); inputs.push(range,number);
      }
      uiInputs.set(key,inputs); details.append(row);
    }
    root.append(details);
  }
  updateUI();
}
function aspectRatio() {
  if (params.aspect==='reference') return REFERENCE_ASPECT;
  if (params.aspect==='viewport') return Math.max(0.1,stage.clientWidth/Math.max(1,stage.clientHeight));
  const [w,h]=params.aspect.split(':').map(Number); return w/h;
}
function layout() {
  const ratio=aspectRatio();
  let w=stage.clientWidth, h=w/ratio;
  if (h>stage.clientHeight) { h=stage.clientHeight; w=h*ratio; }
  w=Math.max(2,w); h=Math.max(2,h);
  canvas.style.width=`${w}px`; canvas.style.height=`${h}px`;
  const dpr=Math.min(window.devicePixelRatio||1,2.5)*params.quality;
  // Bound interactive memory, regardless of a giant desktop / retina DPR.
  const scale=Math.min(dpr,Math.sqrt(6000000/(w*h)),renderer.maxSize/w,renderer.maxSize/h);
  renderer.resize(Math.max(2,Math.round(w*scale)),Math.max(2,Math.round(h*scale)));
}
function drawNow() {
  if (!renderer || exporting || contextLost || disposed) return;
  layout(); renderer.render(params);
  status.textContent=`${renderer.width} × ${renderer.height} · ${renderer.hdr?'RGBA16F / linear HDR':'RGBA8 / encoded fallback'}\n20 passes · 6 bloom scales · renders only on change`;
}
function requestRender() {
  if (scheduled || exporting || contextLost || disposed) return;
  scheduled=requestAnimationFrame(()=>{
    scheduled=0;
    try { drawNow(); } catch(error) { fail(error); }
  });
}
function reset() { params={...DEFAULTS}; updateUI(); showMessage(''); requestRender(); }
function toggleUI() {
  if (window.LabEmbed) { window.LabEmbed.close(); return; }
  const hidden=document.body.classList.toggle('hidden-ui');
  document.getElementById('restore').hidden=!hidden;
  requestRender();
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else showMessage('Fullscreen is unavailable in this browser. Hide the controls with H instead.');
  } catch (error) { showMessage(error.message); }
}
function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a'); link.href=url; link.download=name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function exportPNG(width=2842) {
  if (!renderer || contextLost) throw new Error('The renderer is not ready.');
  if (exporting) throw new Error('An export is already running.');
  if (!Number.isFinite(width)) throw new TypeError('PNG width must be a finite number.');
  const ratio=aspectRatio();
  width=clamp(Math.round(width),320,4096);
  let height=Math.round(width/ratio);
  const scale=Math.min(1,renderer.maxSize/width,renderer.maxSize/height,Math.sqrt(12000000/(width*height)));
  width=Math.floor(width*scale); height=Math.floor(height*scale);
  const button=document.getElementById('export'); button.disabled=true;
  exporting=true;
  try {
    renderer.resize(width,height);
    renderer.render({...params});
    // Invoke toBlob directly after rendering; preserveDrawingBuffer is
    // unnecessary because the snapshot is taken before the buffer clears.
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed.')),'image/png'));
    downloadBlob(blob,`triangle-light-${width}x${height}.png`);
    showMessage(`Exported ${width} × ${height} pixels.`);
    return blob;
  } finally { exporting=false; button.disabled=false; requestRender(); }
}

buildControls();
document.getElementById('reset').addEventListener('click',reset);
document.getElementById('hide').addEventListener('click',toggleUI);
document.getElementById('restore').addEventListener('click',toggleUI);
document.getElementById('fullscreen').addEventListener('click',fullscreen);
document.getElementById('export').addEventListener('click',()=>exportPNG(Number(document.getElementById('exportWidth').value)).catch(e=>showMessage(e.message)));
document.getElementById('save').addEventListener('click',()=>{
  const payload={format:'triangle-light',version:1,parameters:{...params}};
  downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'triangle-light-settings.json');
});
document.getElementById('load').addEventListener('click',()=>document.getElementById('file').click());
document.getElementById('file').addEventListener('change',async event=>{
  const input=event.target, file=input.files?.[0];
  if (!file) return;
  try {
    if (file.size>100000) throw new Error('Settings file is too large.');
    const data=JSON.parse(await file.text());
    if (data.format!=='triangle-light' || data.version!==1 || !data.parameters) throw new Error('Not a version 1 Triangle / Light settings file.');
    params=sanitize(data.parameters,DEFAULTS);
    if (!Object.hasOwn(data.parameters,'paletteStyle') &&
        Object.entries(window.TrianglePalette.reference).some(([key,color])=>params[key]!==color)) {
      params.paletteStyle='custom';
    }
    updateUI(); requestRender(); showMessage('Settings loaded.'); window.LabEmbed?.changed();
  } catch(error) { showMessage(`Could not load settings: ${error.message}`); }
  finally { input.value=''; }
});
window.addEventListener('keydown',event=>{
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || event.target.isContentEditable) return;
  const key=event.key.toLowerCase();
  if (key==='h') toggleUI();
  else if (key==='f') fullscreen();
  else if (key==='r') reset();
  else return;
  event.preventDefault();
});

let drag=null;
canvas.addEventListener('pointerdown',event=>{
  if (event.button!==0 || !renderer || contextLost || exporting) return;
  canvas.setPointerCapture(event.pointerId);
  const rect=canvas.getBoundingClientRect();
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,px:params.posX,py:params.posY,w:rect.width,h:rect.height};
});
canvas.addEventListener('pointermove',event=>{
  if (!drag || event.pointerId!==drag.id) return;
  setParameters({posX:drag.px+(event.clientX-drag.x)/drag.w,posY:drag.py+(event.clientY-drag.y)/drag.h});
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type,()=>{drag=null;});

canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault(); contextLost=true;
  showMessage('Graphics context lost. Waiting for the browser to restore it…');
});
canvas.addEventListener('webglcontextrestored',()=>{
  try {
    renderer.initGPU(); contextLost=false; showMessage('Graphics context restored.');
    document.getElementById('error').hidden=true; requestRender();
  } catch(error) { fail(error); }
});

try {
  renderer=new LightRenderer(canvas);
  const observer=new ResizeObserver(requestRender); observer.observe(stage);
  window.addEventListener('resize',requestRender);
  document.addEventListener('fullscreenchange',requestRender);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) requestRender();});
  // Re-register when DPR changes (e.g. moving the window between monitors).
  let dprQuery;
  function watchDPR() {
    if (dprQuery) dprQuery.removeEventListener('change',onDPRChange);
    dprQuery=matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);
    dprQuery.addEventListener('change',onDPRChange,{once:true});
  }
  function onDPRChange() { watchDPR(); requestRender(); }
  watchDPR();
  window.lightStudy=Object.freeze({
    getParameters:()=>({...params}), setParameters, validateState, setState, reset,
    render:()=>{ if (!exporting) { drawNow(); } }, exportPNG,
    getDiagnostics:()=>({width:renderer.width,height:renderer.height,hdr:renderer.hdr,contextLost,passes:20,bloomLevels:6})
  });
  window.LabEmbed?.register({
    getState:window.lightStudy.getParameters, validateState, setState, reset,
    applyPreset:setParameters, resize:requestRender, syncMotion:requestRender,
    isAnimated:()=>false, renderAt:drawNow,
    dispose(){
      disposed=true; cancelAnimationFrame(scheduled); observer.disconnect();
      dprQuery?.removeEventListener('change',onDPRChange);
      renderer.dispose(); renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
  requestRender();
} catch(error) { fail(error); }
