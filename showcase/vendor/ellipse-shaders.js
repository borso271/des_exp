// Derived from turrell-ellipse-light/app.js. Refresh with scripts/sync-showcase-renderers.mjs.
// Rendering only; no prototype UI or application bootstrap.
const VERT = `#version 300 es
  precision highp float;
  const vec2 P[3] = vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
  out vec2 vUv;
  void main(){ vec2 p=P[gl_VertexID]; vUv=p*.5+.5; gl_Position=vec4(p,0.,1.); }`;

  const FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uCenter;
  uniform vec2 uRadius;
  uniform float uRotation;
  uniform vec4 uRings;      // ring2, ring3, ring4, core
  uniform vec4 uEdges;      // softness, coreSoftness, coreRoundness, irregularity
  uniform vec4 uLight;      // exposure, bottomFalloff, vignette, halo
  uniform vec3 uBg, uC1, uC2, uC3, uC4, uC5;
  uniform float uCoreGlow;
  uniform float uGrain;
  uniform float uBreathing;
  uniform float uBreathingSpeed;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 srgbToLinear(vec3 c){
    vec3 lo = c / 12.92;
    vec3 hi = pow((c + .055) / 1.055, vec3(2.4));
    return mix(lo, hi, step(vec3(.04045), c));
  }
  vec3 linearToSrgb(vec3 c){
    c=max(c,0.0);
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0/2.4)) - .055;
    return mix(lo, hi, step(vec3(.0031308), c));
  }

  float insideSoft(float r, float radius, float soft){
    return 1.0 - smoothstep(radius-soft, radius+soft, r);
  }

  void main(){
    vec2 uv = vUv;
    float cs=cos(uRotation), sn=sin(uRotation);
    mat2 R=mat2(cs,-sn,sn,cs);
    vec2 q=R*(uv-uCenter);

    // Ellipse-space radius. The radii are expressed directly in viewport fractions,
    // which keeps the geometry visually stable on any screen aspect ratio.
    vec2 ep=q/uRadius;
    float angle=atan(ep.y,ep.x);
    float lowFreq = sin(angle*2.0 + 0.7) * .55 + sin(angle*5.0 - 1.3) * .25 + sin(angle*9.0 + 2.1) * .20;
    float breathe = 1.0 + uBreathing * sin(uTime * uBreathingSpeed * 6.2831853);
    float r=length(ep)/breathe;
    r += lowFreq * uEdges.w;

    float soft=uEdges.x;
    float m1=insideSoft(r, 1.0, soft);
    float m2=insideSoft(r, uRings.x, soft*1.05);
    float m3=insideSoft(r, uRings.y, soft*1.08);
    float m4=insideSoft(r, uRings.z, soft*1.12);

    // Core can be slightly rounder than the other concentric ellipses.
    vec2 cp = ep;
    cp.y *= uEdges.z;
    float rc = length(cp)/breathe + lowFreq*uEdges.w*.45;
    float m5=insideSoft(rc, uRings.w, uEdges.y);

    vec3 bg=srgbToLinear(uBg);
    vec3 c1=srgbToLinear(uC1);
    vec3 c2=srgbToLinear(uC2);
    vec3 c3=srgbToLinear(uC3);
    vec3 c4=srgbToLinear(uC4);
    vec3 c5=srgbToLinear(uC5);

    // Nested luminous fields. Sequential mixing produces flat-ish light planes
    // whose boundaries retain the slight softness visible in projected light.
    vec3 col=bg;
    col=mix(col,c1,m1);
    col=mix(col,c2,m2);
    col=mix(col,c3,m3);
    col=mix(col,c4,m4);
    col=mix(col,c5,m5);

    // Broad reflected aura around the outer oval and a soft core bloom.
    float aura = exp(-max(r-1.0,0.0)*max(r-1.0,0.0)*18.0) * (1.0-m1);
    float glow = exp(-rc*rc/max(uRings.w*uRings.w*2.8, .002));
    col += c1 * aura * uLight.w * .12;
    col += c5 * glow * uCoreGlow * .22;

    // The reference darkens slightly towards its lower edge; this also gives the
    // large ellipse a subtle sense of depth without drawing a literal floor.
    float down = smoothstep(.38,1.08,uv.y);
    col *= 1.0 - uLight.y * down;

    // Gentle optical vignette, centered on the luminous object rather than frame center.
    vec2 vd=(uv-uCenter)*vec2(uResolution.x/uResolution.y,1.0);
    float vig=smoothstep(.2,1.25,length(vd));
    col *= 1.0 - uLight.z * vig;

    // Micro-variation: enough to avoid sterile digital gradients, kept static so
    // the image feels like light in a room rather than animated video noise.
    float n = hash12(gl_FragCoord.xy + floor(uTime*0.0));
    col *= 1.0 + (n-.5)*uGrain;

    col *= uLight.x;
    // Soft highlight shoulder so the pale center remains luminous rather than clipped.
    col = col / (1.0 + max(col-1.0,0.0)*.65);
    outColor=vec4(linearToSrgb(col),1.0);
  }`;


export {VERT, FRAG};
