// Derived from triangle-light/app.js and triangle-light/palette.js. Refresh with scripts/sync-showcase-renderers.mjs.
// Rendering only; no prototype UI or application bootstrap.
const DEFAULTS = Object.freeze({
  aspect: 'reference', quality: 1,
  paletteStyle: 'reference', baseHue: 210, colorVariation: 40,
  posX: 0.497, posY: 0.820, width: 0.444, height: 0.457,
  apexLean: 0.010, roll: -0.12,
  intensity: 1.0, coreColor: '#05a7ff', seamColor: '#03ffff',
  vertexTop: 1.0, vertexLeft: 1.15, vertexRight: 1.65,
  vertexReach: 0.060, vertexFocus: 1.0,
  seamStrength: 1.0, seamWidth: 0.020,
  junctionDepth: 0.870, junctionX: 0.0, facet: 1.0,
  edgeSoftness: 0.0022,
  spillColor: '#021fff', spillStrength: 1.0, spillReach: 1.0,
  ambientColor: '#000637', ambient: 1.0,
  floorEnabled: true, floorSlope: 0.270, floorBounce: 0.255, floorDepth: 0.054,
  bloom: 0.055, bloomRadius: 1.0,
  exposure: 0.0, saturation: 1.0, vignette: 0.12, grain: 0.30
});


function linearColor(hex) {
  return [1,3,5].map(i => {
    const s = parseInt(hex.slice(i, i + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
}


  const reference = Object.freeze({
    coreColor: '#05a7ff', seamColor: '#03ffff',
    spillColor: '#021fff', ambientColor: '#000637'
  });
  const colorKeys = Object.keys(reference);

  function lightTints(parameters, toLinear) {
    // Preserve the original reference image and legacy blue settings.
    if (colorKeys.every(key => parameters[key] === reference[key])) {
      return {bloom: [0.38, 0.45, 1], floor: [0.0004, 0.0006, 0.0011]};
    }
    const normalized = hex => {
      const rgb = toLinear(hex);
      const maximum = Math.max(...rgb);
      return maximum > 0 ? rgb.map(channel => channel / maximum) : [0, 0, 0];
    };
    return {
      bloom: normalized(parameters.spillColor).map(channel => 0.38 + channel * 0.62),
      floor: normalized(parameters.ambientColor).map(channel => channel * 0.0011)
    };
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
    const tints=lightTints(p,linearColor);
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


export {DEFAULTS, LightRenderer};
