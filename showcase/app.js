import {presets,getPreset} from './presets.js?v=native-2';
import {createLabHost} from './lab-host.js?v=native-1';
import {clone,makeConfig,parseConfig,serializeConfig,MAX_CONFIG_BYTES} from './config.js?v=native-1';
const stage=document.getElementById('hero-art'),selector=document.getElementById('art-direction');
const pause=document.getElementById('pause-art'),toggle=document.getElementById('edit-banner');
const editor=document.getElementById('banner-editor'),message=document.getElementById('editor-message');
const status=document.getElementById('art-status'),media=matchMedia('(prefers-reduced-motion: reduce)');
const sessions=new Map(),curated=new Map();
const renderMessage=document.createElement('p');renderMessage.className='banner-render-message';renderMessage.hidden=true;renderMessage.setAttribute('role','status');stage.append(renderMessage);
let current=null,direction=getPreset(new URL(location.href).searchParams.get('art')).id;
let editing=false,paused=false,animated=false,visible=true,operation=0,disposed=false;
const hint='La URL comparte la dirección inicial. Descarga JSON para guardar todos los ajustes.';
function notice(text,error=false){message.textContent=text;message.dataset.error=String(error);status.textContent=text;}
function syncMotion(){
 current?.host.setHost({paused,reduced:media.matches,visible:editing||visible});
 pause.hidden=!animated;pause.disabled=media.matches;
 pause.textContent=media.matches?'Sin movimiento':paused?'Reanudar':'Pausar';pause.setAttribute('aria-pressed',String(paused||media.matches));
}
function layout(instance=current){
 if(!instance)return;
 const bounds=stage.getBoundingClientRect(),ratio=bounds.width/Math.max(1,bounds.height);
 if(editing){
  const top=144,bottom=104,fullHeight=Math.max(160,innerHeight-top-bottom),mobile=innerWidth<768;
  Object.assign(instance.node.style,{position:'fixed',left:'0px',top:`${top}px`,width:`${innerWidth}px`,height:`${fullHeight}px`});
  const availableW=mobile?innerWidth-24:Math.max(120,innerWidth-408),availableH=mobile?fullHeight*.5-20:fullHeight-32;
  const width=Math.min(availableW,Math.max(60,availableH)*ratio),height=width/ratio;
  instance.host.layout({editing:true,art:{x:(availableW-width)/2+(mobile?12:24),y:(Math.max(60,availableH)-height)/2+10,width,height}});
 }else{
  Object.assign(instance.node.style,{position:'absolute',left:`${bounds.left+scrollX}px`,top:`${bounds.top+scrollY}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});
  instance.host.layout({editing:false,art:{x:0,y:0,width:bounds.width,height:bounds.height}});
 }
}
function makeInstance(){
 const node=document.createElement('div');node.className='native-banner-host';node.dataset.pending='true';document.body.append(node);
 const instance={node,host:null};
 instance.host=createLabHost({container:node,onState(data){
  if(typeof data.animated==='boolean')instance.animated=data.animated;
  if(instance!==current)return;
  if(data.close){setEditing(false);return;}
  if(data.state)sessions.set(direction,makeConfig(direction,data.state,paused));
  if(typeof data.animated==='boolean')animated=data.animated;
  syncMotion();
 },onError(error){if(instance===current)notice(error,true);}});
 layout(instance);instance.host.setHost({paused:true,reduced:media.matches,visible:false});return instance;
}
async function release(instance){if(!instance)return;await instance.host.dispose();instance.node.remove();}
async function snapshot(){
 if(!current)return null;
 const config=makeConfig(direction,await current.host.snapshot(),paused);sessions.set(direction,config);return config;
}
async function select(id,imported=null,historyMode='push',reset=false){
 const ticket=++operation,descriptor=getPreset(id);
 let candidate;
 selector.disabled=true;toggle.disabled=true;
 if(!current){stage.dataset.renderState='loading';renderMessage.hidden=false;renderMessage.textContent='Cargando el laboratorio…';}
 try{
  await snapshot();if(ticket!==operation||disposed)return;
  const saved=imported||(!reset?sessions.get(descriptor.id):curated.get(descriptor.id));
  let nativeState;
  if(!saved&&descriptor.stateURL){const response=await fetch(descriptor.stateURL);if(!response.ok)throw new Error('No se ha podido cargar la composición.');nativeState=await response.json();}
  if(ticket!==operation||disposed)return;
  candidate=makeInstance();
  const state=await candidate.host.load({...descriptor,nativeState,state:saved?.state});
  if(ticket!==operation||disposed){await release(candidate);return;}
  const old=current;current=candidate;direction=descriptor.id;paused=saved?.paused||false;
  current.node.dataset.pending='false';
  sessions.set(direction,makeConfig(direction,state,paused));
  if(!curated.has(direction)&&!imported)curated.set(direction,clone(sessions.get(direction)));
  animated=!!candidate.animated;
  selector.value=direction;stage.dataset.renderState='ready';stage.dataset.preset=direction;
  renderMessage.hidden=true;
  document.getElementById('editor-current').textContent=descriptor.name;
  document.getElementById('direction-number').textContent=`${String(presets.indexOf(descriptor)+1).padStart(2,'0')} / ${String(presets.length).padStart(2,'0')}`;
  const url=new URL(location.href);url.searchParams.set('art',direction);
  if(historyMode==='push')history.pushState(null,'',url);else if(historyMode==='replace')history.replaceState(null,'',url);
  layout();syncMotion();notice(imported?'Configuración completa cargada.':hint);
  await release(old);
 }catch(error){if(candidate&&candidate!==current)await release(candidate);if(ticket===operation){selector.value=direction;notice(error.message,true);if(!current){stage.dataset.renderState='error';renderMessage.hidden=false;renderMessage.textContent=`${error.message} Puedes elegir otra dirección.`;}}}
 finally{if(ticket===operation){selector.disabled=false;toggle.disabled=false;}}
}
function setEditing(value){
 editing=value;document.body.classList.toggle('editor-open',editing);editor.hidden=!editing;
 toggle.textContent=editing?'Ocultar parámetros':'Mostrar parámetros';toggle.setAttribute('aria-expanded',String(editing));
 layout();syncMotion();if(!editing)toggle.focus();
}
selector.addEventListener('change',()=>select(selector.value));toggle.addEventListener('click',()=>setEditing(!editing));
document.getElementById('close-editor').addEventListener('click',()=>setEditing(false));
document.addEventListener('keydown',event=>{if(editing&&event.key==='Escape')setEditing(false);});
pause.addEventListener('click',()=>{paused=!paused;syncMotion();});
document.getElementById('reset-banner').addEventListener('click',()=>select(direction,null,'replace',true));
document.getElementById('download-banner').addEventListener('click',async()=>{try{
 const config=await snapshot();if(!config)throw new Error('El laboratorio aún no está listo.');
 const blob=new Blob([serializeConfig(config)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`be-art-${direction}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Configuración completa descargada.');
}catch(error){notice(error.message,true);}});
const input=document.getElementById('import-banner');
document.getElementById('load-banner').addEventListener('click',()=>input.click());
input.addEventListener('change',async()=>{try{const file=input.files?.[0];if(!file)return;if(file.size>MAX_CONFIG_BYTES)throw new Error('El archivo supera 32 MB.');const config=parseConfig(await file.text());await select(config.direction,config);}catch(error){notice(error.message,true);}finally{input.value='';}});
window.addEventListener('popstate',()=>select(getPreset(new URL(location.href).searchParams.get('art')).id,null,'replace'));
window.addEventListener('resize',()=>layout());
const resizeObserver=new ResizeObserver(()=>layout());resizeObserver.observe(stage);
const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();});intersection.observe(stage);
media.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);
window.addEventListener('pagehide',()=>{disposed=true;operation++;release(current);resizeObserver.disconnect();intersection.disconnect();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
document.getElementById('art-selector').hidden=false;select(direction,null,'replace');
const dialog=document.getElementById('mobile-navigation-dialog'),trigger=document.querySelector('.menu-trigger');
trigger.addEventListener('click',()=>{dialog.showModal();trigger.setAttribute('aria-expanded','true');});
document.querySelector('.menu-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');trigger.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
