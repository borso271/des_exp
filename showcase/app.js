import {presets,getPreset} from './presets.js';
import {createController} from './controller.js';
import {createSession} from './config.js';
import {createTextLayer} from './text-layer.js';
import {createEditor} from './editor.js';
const session=createSession();
let current=session.get(getPreset(new URL(location.href).searchParams.get('art')).id),editor;
const textLayer=createTextLayer(document.getElementById('hero-art'),document.querySelector('.page-homeHeroBrand'));

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
    textLayer.update(current.text);
    document.getElementById('direction-number').textContent=`${String(presets.findIndex(p=>p.id===preset.id)+1).padStart(2,'0')} / ${String(presets.length).padStart(2,'0')}`;
    pause.hidden=!preset.motion.enabled||!ready;pause.disabled=reduced;
    pause.textContent=reduced?'Sin movimiento':paused?'Reanudar':'Pausar';
    pause.setAttribute('aria-label',reduced?'Movimiento reducido según la preferencia del dispositivo':paused?'Reanudar animación':'Pausar animación');
    pause.setAttribute('aria-pressed',String(paused||reduced));
  }
});
function select(id,config=null,historyMode='push') {
  current=config?session.put(config):session.get(id);
  const url=new URL(location.href);url.searchParams.set('art',current.id);
  if(historyMode==='push')history.pushState(null,'',url);
  else if(historyMode==='replace')history.replaceState(null,'',url);
  controller.select(current);textLayer.update(current.text);editor?.sync();
  status.textContent=`Dirección seleccionada: ${current.name}.`;
}
function applyURL(){select(getPreset(new URL(location.href).searchParams.get('art')).id,null,'replace');}
selector.addEventListener('change',()=>select(selector.value));
editor=createEditor({root:document.getElementById('banner-editor'),toggle:document.getElementById('edit-banner'),
  getConfig:()=>current,onSelect:select,
  onEdit(config){
    const next=session.put(config),artChanged=JSON.stringify({...current,text:null})!==JSON.stringify({...next,text:null});
    current=next;if(artChanged)controller.update(current);textLayer.update(current.text);return current;
  },
  onReset(){current=session.reset(current.id);controller.select(current);textLayer.update(current.text);}
});
pause.addEventListener('click',()=>controller.togglePause());
window.addEventListener('popstate',applyURL);
window.addEventListener('pagehide',()=>{controller.dispose();textLayer.dispose();editor.dispose();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
document.getElementById('art-selector').hidden=false;
applyURL();

const dialog=document.getElementById('mobile-navigation-dialog');
const trigger=document.querySelector('.menu-trigger');
trigger.addEventListener('click',()=>{dialog.showModal();trigger.setAttribute('aria-expanded','true');});
document.querySelector('.menu-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');trigger.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
