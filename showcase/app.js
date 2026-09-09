import {presets,getPreset} from './presets.js';
import {createController} from './controller.js';

const selector=document.getElementById('art-direction');
const pause=document.getElementById('pause-art');
const status=document.getElementById('art-status');
const modules={
  ellipses:()=>import('./renderers/ellipse.js'),
  squares:()=>import('./renderers/fields.js'),
  triangle:()=>import('./renderers/triangle.js'),
  moving:()=>import('./renderers/fields.js')
};
const controller=createController({
  stage:document.getElementById('hero-art'),host:document.getElementById('art-canvas'),
  fallback:document.getElementById('art-fallback'),load:id=>modules[id](),
  onChange({preset,paused,reduced,ready}) {
    selector.value=preset.id;
    document.getElementById('direction-number').textContent=`${String(presets.indexOf(preset)+1).padStart(2,'0')} / 05`;
    pause.hidden=!preset.motion.enabled||!ready;pause.disabled=reduced;
    pause.textContent=reduced?'Sin movimiento':paused?'Reanudar':'Pausar';
    pause.setAttribute('aria-label',reduced?'Movimiento reducido según la preferencia del dispositivo':paused?'Reanudar animación':'Pausar animación');
    pause.setAttribute('aria-pressed',String(paused||reduced));
  }
});
function applyURL() {
  const url=new URL(location.href),preset=getPreset(url.searchParams.get('art'));
  if(url.searchParams.has('art')&&url.searchParams.get('art')!==preset.id){url.searchParams.set('art',preset.id);history.replaceState(null,'',url);}
  controller.select(preset.id);
}
selector.addEventListener('change',()=>{
  const preset=getPreset(selector.value),url=new URL(location.href);
  url.searchParams.set('art',preset.id);history.pushState(null,'',url);
  controller.select(preset.id);status.textContent=`Dirección seleccionada: ${preset.name}.`;
});
pause.addEventListener('click',()=>controller.togglePause());
window.addEventListener('popstate',applyURL);
window.addEventListener('pagehide',()=>controller.dispose(),{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
document.getElementById('art-selector').hidden=false;
applyURL();

const dialog=document.getElementById('mobile-navigation-dialog');
const trigger=document.querySelector('.menu-trigger');
trigger.addEventListener('click',()=>{dialog.showModal();trigger.setAttribute('aria-expanded','true');});
document.querySelector('.menu-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');trigger.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
