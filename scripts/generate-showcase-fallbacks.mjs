import fs from 'node:fs';
import {presets} from '../showcase/presets.js';
import {fallbackSVG} from '../showcase/fallback.js';
for(const p of presets.filter(p=>p.renderer!=='original'&&p.renderer!=='image')){
  const w=1200,h=p.renderer==='ellipses'?w/(p.geometry.radiusX*p.geometry.referenceAspect/p.geometry.radiusY):578;
  const svg=fallbackSVG(p,w,h),file=new URL(`../showcase/assets/fallback-${p.id}.svg`,import.meta.url);
  if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==svg)throw Error(`Stale fallback: ${p.id}`);}
  else fs.writeFileSync(file,svg);
}
console.log('Static artwork fallbacks '+(process.argv.includes('--check')?'verified.':'generated.'));
