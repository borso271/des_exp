import * as nested from './vendor/nested.js';
import * as moving from './vendor/moving.js';
import {fitEllipse} from './renderers/ellipse.js';
// Parameter-aware still approximations for unavailable Canvas/WebGL.
export function fallbackSVG(p,w=1200,h=578){
  let body=`<rect width="${w}" height="${h}" fill="${p.palette[0]}"/>`;
  if(p.renderer==='squares'||p.renderer==='moving'){
    const engine=p.renderer==='squares'?nested:moving;
    const data=engine.build({...p.geometry,seed:p.seed,time:p.motion.initialTime||0},w,h);
    for(const shape of data.shapes){
      const color=p.palette[(shape.index+(p.renderer==='squares'?1:0))%p.palette.length];
      if(p.renderer==='squares'){
        const b=shape.bounds;body+=`<rect x="${b.left}" y="${b.top}" width="${b.right-b.left}" height="${b.bottom-b.top}" fill="${color}"/>`;
      }else body+=`<polygon points="${shape.points.map(v=>`${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ')}" fill="${color}" stroke="${color}" stroke-width=".7"/>`;
    }
  }else if(p.renderer==='ellipses'){
    const g=fitEllipse(p.geometry,w,h,p.motion.enabled?p.motion.breathing:0),l=p.light;
    body+=`<defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${g.softness*Math.min(w,h)}"/></filter></defs><g opacity="${Math.min(1,l.exposure)}" filter="url(#soft)" transform="rotate(${g.rotation} ${g.centerX*w} ${g.centerY*h})">`;
    [1,g.ring2,g.ring3,g.ring4,g.core].forEach((r,i)=>body+=`<ellipse cx="${g.centerX*w}" cy="${g.centerY*h}" rx="${g.radiusX*w*r}" ry="${g.radiusY*h*r}" fill="${p.palette[i+1]}"/>`);
    body+='</g>';
  }else if(p.renderer==='triangle'){
    const g=p.geometry,l=p.light,fit=Math.min(1,w/h/.98),x=g.posX*w,y=(.5+(g.posY-.5)*fit)*h;
    const width=g.width*fit*h,height=g.height*fit*h;
    const points=`${x+g.apexLean*width},${y-height} ${x-width/2},${y} ${x+width/2},${y}`;
    body=`<defs><radialGradient id="aura"><stop stop-color="${p.palette[2]}"/><stop offset="1" stop-color="${p.palette[3]}"/></radialGradient><linearGradient id="light" x2="0" y2="1"><stop stop-color="${p.palette[1]}"/><stop offset="1" stop-color="${p.palette[0]}"/></linearGradient><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${l.bloomRadius*10}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#aura)"/>`;
    if(g.floorEnabled)body+=`<rect y="${y}" width="${w}" height="${h-y}" fill="${p.palette[2]}" opacity=".25"/>`;
    body+=`<g transform="rotate(${g.roll} ${x} ${y-height/2})"><polygon points="${points}" fill="${p.palette[1]}" filter="url(#glow)" opacity="${Math.min(1,l.bloom*3)}"/><polygon points="${points}" fill="url(#light)" opacity="${Math.min(1,l.intensity)}"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>${p.name}</title>${body}</svg>\n`;
}
