import fs from 'node:fs';
import {presets} from '../showcase/presets.js';
import * as nested from '../showcase/vendor/nested.js';
import * as moving from '../showcase/vendor/moving.js';
const w=1200,h=578;
for(const p of presets.filter(p=>p.renderer!=='original'&&p.renderer!=='image')){
 let body=`<rect width="${w}" height="${h}" fill="${p.palette[0]}"/>`;
 if(p.id==='squares'||p.id==='moving'){
  const engine=p.id==='squares'?nested:moving;
  const data=engine.build({...p.geometry,seed:p.seed,time:p.motion.initialTime||0},w,h);
  for(const shape of data.shapes){
   const color=p.palette[(shape.index+(p.id==='squares'?1:0))%p.palette.length];
   if(p.id==='squares'){
    const b=shape.bounds;body+=`<rect x="${b.left}" y="${b.top}" width="${b.right-b.left}" height="${b.bottom-b.top}" fill="${color}"/>`;
   }else body+=`<polygon points="${shape.points.map(v=>`${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ')}" fill="${color}" stroke="${color}" stroke-width=".7"/>`;
  }
 }else if(p.id==='ellipses'){
  const g=p.geometry;
  body+='<defs><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter></defs><g filter="url(#soft)">';
  [1,g.ring2,g.ring3,g.ring4,g.core].forEach((r,i)=>body+=`<ellipse cx="${g.centerX*w}" cy="${g.centerY*h}" rx="${g.radiusX*w*r}" ry="${g.radiusY*h*r}" fill="${p.palette[i+1]}"/>`);
  body+='</g>';
 }else{
  body=`<defs><radialGradient id="aura"><stop stop-color="#143a8c"/><stop offset="1" stop-color="#020616"/></radialGradient><linearGradient id="light" x2="0" y2="1"><stop stop-color="#26c9f0"/><stop offset="1" stop-color="#026cbb"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="1200" height="578" fill="url(#aura)"/><path d="M600 35 325 530 875 530Z" fill="#1e85ed" filter="url(#glow)"/><path d="M600 35 325 530 875 530Z" fill="url(#light)"/><path d="M600 35 600 445 325 530M600 445 875 530" fill="none" stroke="#63dce8" stroke-width="9" opacity=".55"/>`;
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="578" viewBox="0 0 1200 578"><title>${p.name}</title>${body}</svg>\n`;
 const file=new URL(`../showcase/assets/fallback-${p.id}.svg`,import.meta.url);
 if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==svg)throw Error(`Stale fallback: ${p.id}`);}
 else fs.writeFileSync(file,svg);
}
console.log('Static artwork fallbacks '+(process.argv.includes('--check')?'verified.':'generated.'));
