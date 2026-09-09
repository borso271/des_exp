import {getPreset} from './presets.js';
import {fallbackSVG} from './fallback.js';

export function createController({stage,host,fallback,load,onChange=()=>{},env=window}) {
  let preset=getPreset('original'), renderer=null, canvas=null, generation=0, frame=0;
  let stopped=false, paused=false, visible=true, lastTime=null, elapsed=0, ready=false;
  const media=env.matchMedia('(prefers-reduced-motion: reduce)');
  const moving=()=>preset.motion.enabled&&!paused&&!media.matches&&visible&&env.document.visibilityState!=='hidden';
  function cancel() {if(frame)env.cancelAnimationFrame(frame);frame=0;lastTime=null;}
  function notify() {
    stage.dataset.motion=moving()&&renderer?'playing':'still';
    onChange({preset,paused,reduced:media.matches,ready});
  }
  function release() {
    cancel();ready=false;
    canvas?.removeEventListener('webglcontextlost',contextLost);
    if(renderer){try{renderer.dispose();}catch{} renderer=null;}
    if(canvas){canvas.remove();canvas=null;}
  }
  function fail() {
    release();refreshFallback();stage.dataset.renderState='fallback';notify();
  }
  function refreshFallback() {
    if(preset.renderer==='original'||preset.renderer==='image')return;
    if(!preset.text)return; // Curated files also support the lightweight read-only controller.
    const rect=stage.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    const width=900,height=width*rect.height/rect.width;
    fallback.style.backgroundImage=`url("data:image/svg+xml,${encodeURIComponent(fallbackSVG(preset,width,height)).replace(/[!'()*]/g,char=>'%'+char.charCodeAt(0).toString(16))}")`;
    fallback.style.backgroundSize='100% 100%';
  }
  function appearance() {
    stage.dataset.artDescription=preset.description;
    stage.style.setProperty('--art-shade',preset.shade);
    fallback.style.backgroundColor=preset.palette[0]||'transparent';
  }
  function contextLost(event) {event.preventDefault();fail();}
  function draw() {
    if(!renderer||!canvas)return;
    const rect=stage.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    // Cap both DPR and the longest edge to keep mobile GPU memory bounded.
    const scale=Math.min(env.devicePixelRatio||1,1.5,1800/Math.max(rect.width,rect.height));
    try {
      renderer.render(Math.max(2,Math.round(rect.width*scale)),Math.max(2,Math.round(rect.height*scale)),elapsed);
      stage.dataset.renderState='ready';
    } catch {fail();}
  }
  function tick(now) {
    frame=0;
    if(!moving()||!renderer||stopped){lastTime=null;return;}
    if(lastTime!==null)elapsed+=Math.min(.05,Math.max(0,(now-lastTime)/1000));
    lastTime=now;draw();schedule();
  }
  function schedule() {if(moving()&&renderer&&!frame&&!stopped)frame=env.requestAnimationFrame(tick);}
  function syncMotion() {cancel();notify();schedule();}
  const observer=new env.ResizeObserver(()=>{if(!renderer)refreshFallback();draw();schedule();});observer.observe(stage);
  const intersection=env.IntersectionObserver?new env.IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;syncMotion();
  },{threshold:0}):null;
  intersection?.observe(stage);
  media.addEventListener('change',syncMotion);
  env.document.addEventListener('visibilitychange',syncMotion);

  async function select(id) {
    const ticket=++generation;
    release();elapsed=0;paused=false;preset=typeof id==='string'?getPreset(id):id;
    stage.dataset.preset=preset.id;stage.dataset.renderState=preset.renderer==='original'?'original':'fallback';
    stage.setAttribute('aria-label',`BE ART. ${preset.description}`);
    appearance();
    fallback.style.backgroundImage=preset.renderer==='original'?'none':`url("${new URL(preset.image||`./assets/fallback-${preset.id}.svg`,import.meta.url).href}")`;
    fallback.style.backgroundSize=preset.renderer==='ellipses'?'contain':'cover';
    fallback.style.backgroundColor=preset.palette[0]||'transparent';
    refreshFallback();
    if(preset.renderer==='image') {ready=true;stage.dataset.renderState='ready';}
    notify();
    if(preset.renderer==='original'||preset.renderer==='image'||stopped)return;
    try {
      const module=await load(preset.renderer);
      if(stopped||ticket!==generation)return;
      canvas=env.document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
      canvas.addEventListener('webglcontextlost',contextLost);host.appendChild(canvas);
      renderer=module.create(canvas,preset);ready=true;draw();notify();schedule();
    } catch {if(ticket===generation&&!stopped)fail();}
  }
  return {
    select,
    update(next){
      if(next.id!==preset.id||next.renderer!==preset.renderer)return select(next);
      preset=next;appearance();
      if(renderer){renderer.update(next);draw();}else refreshFallback();
      syncMotion();
    },
    togglePause(){paused=!paused;syncMotion();},
    dispose(){
      stopped=true;generation++;release();observer.disconnect();intersection?.disconnect();
      media.removeEventListener('change',syncMotion);env.document.removeEventListener('visibilitychange',syncMotion);
    }
  };
}
