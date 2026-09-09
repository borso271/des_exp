(() => {
  'use strict';
  const canvas = document.getElementById('gl');
  const ui = document.getElementById('ui');
  const status = document.getElementById('status');
  const palette = window.EllipsePalette;
  const clean = new URLSearchParams(location.search).has('clean');
  if (clean) ui.classList.add('hidden');

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    document.body.innerHTML = '<p style="padding:20px">This study requires WebGL 2.</p>';
    return;
  }

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

  function shader(type, src){
    const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,VERT));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());

  const U={};
  for (const name of ['uResolution','uTime','uCenter','uRadius','uRotation','uRings','uEdges','uLight','uBg','uC1','uC2','uC3','uC4','uC5','uCoreGlow','uGrain','uBreathing','uBreathingSpeed']) U[name]=gl.getUniformLocation(program,name);

  const reference={
    centerX:.485, centerY:.495,
    radiusX:.401, radiusY:.463,
    rotation:0,
    ring2:.646, ring3:.485, ring4:.386, core:.164,
    coreRoundness:.90,
    softness:.0075, coreSoftness:.018,
    coreGlow:.11,
    exposure:1.00, bottomFalloff:.105, vignette:.045, halo:.15,
    grain:.018, irregularity:.0025,
    breathing:0, breathingSpeed:.25,
    renderScale:1,
    ...palette.defaults, ...palette.reference
  };
  let p={...reference};

  function hex3(h){
    const n=parseInt(h.slice(1),16);
    return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];
  }
  function set3(loc,h){const c=hex3(h);gl.uniform3f(loc,c[0],c[1],c[2]);}

  function syncUniforms(t){
    gl.useProgram(program);
    gl.uniform2f(U.uResolution,canvas.width,canvas.height);
    gl.uniform1f(U.uTime,t||0);
    gl.uniform2f(U.uCenter,p.centerX,1-p.centerY);
    gl.uniform2f(U.uRadius,p.radiusX,p.radiusY);
    gl.uniform1f(U.uRotation,p.rotation*Math.PI/180);
    gl.uniform4f(U.uRings,p.ring2,p.ring3,p.ring4,p.core);
    gl.uniform4f(U.uEdges,p.softness,p.coreSoftness,p.coreRoundness,p.irregularity);
    gl.uniform4f(U.uLight,p.exposure,p.bottomFalloff,p.vignette,p.halo);
    set3(U.uBg,p.bg); set3(U.uC1,p.c1); set3(U.uC2,p.c2); set3(U.uC3,p.c3); set3(U.uC4,p.c4); set3(U.uC5,p.c5);
    gl.uniform1f(U.uCoreGlow,p.coreGlow);
    gl.uniform1f(U.uGrain,p.grain);
    gl.uniform1f(U.uBreathing,p.breathing);
    gl.uniform1f(U.uBreathingSpeed,p.breathingSpeed);
  }

  function resize(forceW,forceH){
    let w,h;
    if(forceW&&forceH){w=forceW;h=forceH;}
    else {
      const dpr=Math.min(devicePixelRatio||1,2.5)*p.renderScale;
      w=Math.max(2,Math.round(innerWidth*dpr)); h=Math.max(2,Math.round(innerHeight*dpr));
    }
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }

  let needsRender=true, start=performance.now();
  function render(now=performance.now()){
    if(p.breathing>0) needsRender=true;
    if(needsRender){
      resize(); syncUniforms((now-start)/1000);
      gl.drawArrays(gl.TRIANGLES,0,3); needsRender=false;
    }
    requestAnimationFrame(render);
  }

  const sliders=[...document.querySelectorAll('input[type=range][data-k]')];
  const colors=[...document.querySelectorAll('input[type=color][data-k]')];
  const selects=[...document.querySelectorAll('select[data-k]')];
  const checks=[...document.querySelectorAll('input[type=checkbox][data-k]')];
  const colorStudy=document.getElementById('colorStudy');
  const preview=document.getElementById('palettePreview');
  const fieldNames=['Background','Outer ellipse','Ring 2','Ring 3','Ring 4','Core'];
  const swatches=['bg', ...palette.fieldKeys].map((key,index)=>{
    const swatch=document.createElement('span');
    preview.appendChild(swatch);
    return {key, name:fieldNames[index], swatch};
  });
  for(const el of [...sliders,...colors,...selects,...checks]) {
    if(!el.id) el.id=`p-${el.dataset.k}`;
    const label=el.closest('.row')?.querySelector('label');
    if(label) label.htmlFor=el.id;
  }
  function output(el){
    const value=+p[el.dataset.k];
    const precision=+el.step>=1 ? 0 : +el.step<.01 ? 3 : 2;
    el.nextElementSibling.textContent=value.toFixed(precision)+(el.dataset.unit||'');
  }
  function updateControls(){
    sliders.forEach(el=>{el.value=p[el.dataset.k];output(el);});
    colors.forEach(el=>el.value=p[el.dataset.k]);
    selects.forEach(el=>el.value=p[el.dataset.k]);
    checks.forEach(el=>el.checked=p[el.dataset.k]);
    const generated=palette.isGenerated(p.paletteStyle);
    const fixed=window.ColorPalettes.isFixedType(p.paletteStyle);
    document.getElementById('base-hue-row').hidden=!generated||fixed;
    document.getElementById('variation-row').hidden=!generated;
    document.getElementById('newPalette').disabled=!generated||fixed;
    document.getElementById('p-lightStrength').disabled=p.lightProfile==='palette';
    document.getElementById('p-backgroundOffset').disabled=p.backgroundMode==='manual';
    swatches.forEach(({key,name,swatch})=>{swatch.style.backgroundColor=p[key];swatch.title=`${name}: ${p[key]}`;});
    preview.setAttribute('aria-label', swatches.map(({key,name})=>`${name}: ${p[key]}`).join(', '));
  }
  function geometryPatch(input){
    const result={};
    for(const el of sliders){
      const key=el.dataset.k;
      if(Object.hasOwn(palette.defaults,key))continue;
      if(typeof input[key]==='number'&&Number.isFinite(input[key]))result[key]=Math.max(+el.min,Math.min(+el.max,input[key]));
    }
    return result;
  }
  function setParameters(patch){
    if(!patch||typeof patch!=='object'||Array.isArray(patch))return;
    const snapshot=patch.paletteVersion===1&&Array.isArray(patch.customColors)&&
      ['bg',...palette.fieldKeys].every(key=>typeof patch[key]==='string'&&/^#[\da-f]{6}$/i.test(patch[key]));
    p={...p,...(snapshot?palette.restore(patch):palette.applyChange(p,patch)),...geometryPatch(patch)};
    if(Object.keys(patch).some(key=>Object.hasOwn(palette.defaults,key)||Object.hasOwn(palette.reference,key)))colorStudy.value='custom';
    updateControls();needsRender=true;
  }
  sliders.forEach(el=>{
    el.addEventListener('input',()=>setParameters({[el.dataset.k]:+el.value}));
    el.addEventListener('dblclick',()=>setParameters({[el.dataset.k]:reference[el.dataset.k]}));
  });
  colors.forEach(el=>el.addEventListener('input',()=>setParameters({[el.dataset.k]:el.value})));
  selects.forEach(el=>el.addEventListener('change',()=>setParameters({[el.dataset.k]:el.value})));
  checks.forEach(el=>el.addEventListener('change',()=>setParameters({[el.dataset.k]:el.checked})));
  document.getElementById('newPalette').onclick=()=>setParameters({paletteSeed:(p.paletteSeed+1)>>>0});
  function applyStudy(name){
    p={...p,...palette.study(name)};
    colorStudy.value=name;updateControls();needsRender=true;
  }
  colorStudy.onchange=()=>applyStudy(colorStudy.value);
  document.getElementById('resetColors').onclick=()=>applyStudy('reference');
  function reset(){p={...reference};colorStudy.value='reference';updateControls();needsRender=true;}
  updateControls();

  let dragging=false, lastX=0,lastY=0;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;p.centerX=Math.min(1,Math.max(0,p.centerX+(e.clientX-lastX)/innerWidth));p.centerY=Math.min(1,Math.max(0,p.centerY+(e.clientY-lastY)/innerHeight));lastX=e.clientX;lastY=e.clientY;updateControls();needsRender=true;});
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('pointercancel',()=>dragging=false);
  addEventListener('resize',()=>{resize();needsRender=true;});

  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  document.getElementById('resetBtn').onclick=()=>{reset();status.textContent='Reference preset restored.';};
  document.getElementById('saveBtn').onclick=()=>{downloadBlob(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),'ellipse-light-settings.json');};
  document.getElementById('loadBtn').onclick=()=>document.getElementById('fileInput').click();
  document.getElementById('fileInput').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      const obj=JSON.parse(await file.text());
      if(!obj||typeof obj!=='object'||Array.isArray(obj)||!Object.keys(obj).some(key=>Object.hasOwn(reference,key)))throw new Error('Invalid settings');
      p={...reference,...geometryPatch(obj),...palette.restore(obj)};
      colorStudy.value='custom';updateControls();needsRender=true;status.textContent='Settings loaded.';
    }catch(err){status.textContent='Could not load JSON.';}
    e.target.value='';
  };

  document.getElementById('exportBtn').onclick=async()=>{
    const btn=document.getElementById('exportBtn'); btn.disabled=true; status.textContent='Rendering export…';
    const oldW=canvas.width, oldH=canvas.height;
    const width=Math.max(512,Math.min(8192,+document.getElementById('exportWidth').value||2400));
    const aspect=innerWidth/innerHeight; const height=Math.round(width/aspect);
    resize(width,height); syncUniforms((performance.now()-start)/1000); gl.drawArrays(gl.TRIANGLES,0,3);
    canvas.toBlob(blob=>{
      if(blob) downloadBlob(blob,`ellipse-light-${width}x${height}.png`);
      resize(oldW,oldH); needsRender=true; btn.disabled=false; status.textContent=`Exported ${width} × ${height}.`;
    },'image/png');
  };

  addEventListener('keydown',e=>{
    if(e.target.matches('input,select,textarea'))return;
    if(e.key.toLowerCase()==='h')ui.classList.toggle('hidden');
    if(e.key.toLowerCase()==='r')reset();
    if(e.key.toLowerCase()==='f'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();}
  });

  window.ellipseLight={
    getParameters:()=>({...p,customColors:[...p.customColors]}),
    setParameters,
    reset,
    exportPNG:async width=>{document.getElementById('exportWidth').value=width||2400;document.getElementById('exportBtn').click();}
  };

  resize(); needsRender=true; requestAnimationFrame(render);
})();
