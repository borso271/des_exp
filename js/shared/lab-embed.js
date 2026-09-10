// Hosting only. Art generation and controls remain in each original lab.
(() => {
  if(!new URLSearchParams(location.search).has('embed'))return;
  const script=document.currentScript,lab=script.dataset.lab;
  const definitions={original:{art:'#original-art',panel:'#original-controls'},ellipse:{art:'#gl',panel:'#ui'},triangle:{art:'#stage',panel:'#panel'},canvas:{art:'.poster',panel:'.controls'},moving:{art:'#world',panel:'.sidebar'},light:{art:'#stage',panel:'#panel'}};
  const definition=definitions[lab];
  const art=document.querySelector(definition.art),panel=document.querySelector(definition.panel);
  if(!art||!panel)throw new Error(`Missing native ${lab} art or panel`);
  document.documentElement.classList.add('lab-embedded');
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./lab-embed.css?v=native-5',script.src).href;document.head.append(style);
  const surface=document.createElement('div');surface.id='lab-art';surface.append(art);
  const controls=document.createElement('aside');controls.id='lab-native-panel';controls.setAttribute('aria-label','Native lab controls');controls.append(panel);
  const status=document.createElement('p');status.id='lab-embed-status';status.role='status';
  document.body.append(surface,controls,status);
  let api=null,editing=false,host={paused:false,reduced:false,visible:true},layout={x:0,y:0,width:innerWidth,height:innerHeight};
  let disposed=false,revision=0;
  const send=(type,payload={})=>{if(parent!==window)parent.postMessage({channel:'be-art-lab',lab,type,...payload},location.origin);};
  function applyLayout(next){
    layout=next||layout;
    for(const [key,value] of Object.entries(layout))surface.style.setProperty(`--art-${key}`,`${value}px`);
    document.documentElement.dataset.labEditing=String(editing);
    api?.resize?.();
  }
  function state(){return api?{native:api.getState(),text:window.PosterTextHost?.getState?.()||null}:null;}
  function changed(){if(api&&!disposed){revision++;send('state',{state:state(),revision,animated:!!api.isAnimated?.()});}}
  const bridge={
    lab,surface,controls,get editing(){return editing;},
    get motionAllowed(){return !host.paused&&!host.reduced&&host.visible&&!document.hidden;},
    get size(){return {width:layout.width,height:layout.height};},
    changed,
    async register(next){api=next;applyLayout();try{await textReady;if(!disposed)send('ready',{state:state(),revision,animated:!!api.isAnimated?.()});}catch(error){bridge.fail(error.message);}},
    close(){send('close');},
    fail(message){send('error',{message:String(message)});},
    async restore(value){
      if(!value||typeof value!=='object')throw new Error('Invalid lab configuration.');
      const native=api.validateState(value.native);
      const text=window.PosterTextHost?.validateState?.(value.text);
      api.validateTextState?.(native,text);
      await api.setState(native);
      if(text)window.PosterTextHost.setState(text);
      changed();
    }
  };
  window.LabEmbed=bridge;
  const textReady=lab==='canvas'?Promise.resolve():new Promise((resolve,reject)=>{
    const textScript=document.createElement('script');
    textScript.src=new URL('./poster-text.js?v=native-5',script.src).href;
    textScript.onload=()=>window.PosterText.mountEmbedded(bridge).then(resolve,reject);
    textScript.onerror=()=>reject(new Error('Could not load the shared text effects.'));
    document.head.append(textScript);
  });
  textReady.catch(error=>bridge.fail(error.message));
  document.addEventListener('input',()=>queueMicrotask(changed));
  document.addEventListener('change',()=>queueMicrotask(changed));
  document.addEventListener('click',()=>queueMicrotask(changed));
  document.addEventListener('visibilitychange',()=>api?.syncMotion?.());
  document.addEventListener('keydown',event=>{if(editing&&event.key==='Escape'&&!document.fullscreenElement){event.preventDefault();bridge.close();}});
  const observer=new ResizeObserver(()=>api?.resize?.());observer.observe(surface);
  window.addEventListener('message',async event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.channel!=='be-art-host')return;
    const {type,payload,requestId}=event.data;
    try{
      if(type==='layout'){editing=!!payload.editing;applyLayout(payload.art);}
      else if(type==='restore')await bridge.restore(payload);
      else if(type==='preset'){await api.applyPreset(payload);changed();}
      else if(type==='textPreset'){window.PosterTextHost.setState({...window.PosterTextHost.getState(),...payload});changed();}
      else if(type==='renderAt'){api.renderAt?.(payload.time);}
      else if(type==='snapshot'){send('response',{requestId,result:state()});return;}
      else if(type==='host'){host={...host,...payload};api?.syncMotion?.();}
      else if(type==='reset'){await api.reset();changed();}
      else if(type==='dispose'){disposed=true;observer.disconnect();window.PosterTextHost?.dispose();api?.dispose?.();}
      if(requestId)send('response',{requestId,result:state(),animated:!!api.isAnimated?.()});
    }catch(error){if(requestId)send('response',{requestId,error:error.message});else bridge.fail(error.message);}
  });
  applyLayout();
})();
