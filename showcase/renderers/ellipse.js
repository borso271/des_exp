import {VERT, FRAG} from '../vendor/ellipse-shaders.js';

export function fitEllipse(geometry,width,height,breathing=0) {
  const aspect=geometry.radiusX*geometry.referenceAspect/geometry.radiusY;
  const availableX=(Math.min(geometry.centerX,1-geometry.centerX)-geometry.margin)*width;
  const availableY=(Math.min(geometry.centerY,1-geometry.centerY)-geometry.margin)*height;
  const angle=geometry.rotation*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle);
  const extent=(1+geometry.softness+geometry.irregularity)*(1+breathing);
  const horizontal=Math.hypot(aspect*cs,sn),vertical=Math.hypot(aspect*sn,cs);
  const radiusY=Math.max(0,Math.min(availableY/vertical,availableX/horizontal))/extent*(geometry.scale??1);
  return {...geometry,radiusX:radiusY*aspect/width,radiusY:radiusY/height};
}

export function create(canvas, preset) {
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
  if(!gl)throw new Error('WebGL unavailable');
  // Rotate in physical screen coordinates, preserving ellipse proportions on resize.
  const fragment=FRAG.replace('vec2 q=R*(uv-uCenter);',
    'vec2 aspect=vec2(uResolution.x/uResolution.y,1.0); vec2 q=(R*((uv-uCenter)*aspect))/aspect;');
  const shaders=[], program=gl.createProgram(), vao=gl.createVertexArray();
  function dispose() {
    shaders.forEach(shader=>gl.deleteShader(shader));
    gl.deleteProgram(program);gl.deleteVertexArray(vao);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
  try {
    for(const [type,source] of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,fragment]]) {
      const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  } catch(error) { dispose();throw error; }
  const uniforms=new Map();
  const u=name=>{if(!uniforms.has(name))uniforms.set(name,gl.getUniformLocation(program,name));return uniforms.get(name);};
  const hex=color=>[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)/255);
  return {
    update(next){preset=next;},
    render(width,height,time) {
      if(gl.isContextLost())throw new Error('Context lost');
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.useProgram(program);gl.bindVertexArray(vao);
      const p=fitEllipse(preset.geometry,width,height,preset.motion.enabled?preset.motion.breathing:0),l=preset.light;
      gl.uniform2f(u('uResolution'),width,height);gl.uniform1f(u('uTime'),time);
      gl.uniform2f(u('uCenter'),p.centerX,1-p.centerY);gl.uniform2f(u('uRadius'),p.radiusX,p.radiusY);
      gl.uniform1f(u('uRotation'),p.rotation*Math.PI/180);
      gl.uniform4f(u('uRings'),p.ring2,p.ring3,p.ring4,p.core);
      gl.uniform4f(u('uEdges'),p.softness,p.coreSoftness,p.coreRoundness,p.irregularity);
      gl.uniform4f(u('uLight'),l.exposure,l.bottomFalloff,l.vignette,l.halo);
      ['uBg','uC1','uC2','uC3','uC4','uC5'].forEach((name,i)=>gl.uniform3fv(u(name),hex(preset.palette[i])));
      gl.uniform1f(u('uCoreGlow'),l.coreGlow);gl.uniform1f(u('uGrain'),l.grain);
      gl.uniform1f(u('uBreathing'),preset.motion.enabled?preset.motion.breathing:0);gl.uniform1f(u('uBreathingSpeed'),preset.motion.speed);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }, dispose
  };
}
