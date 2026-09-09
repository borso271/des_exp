// Mounts an actual lab document; never interprets its art parameters.
export function createLabHost({container,onState=()=>{},onError=()=>{},env=window}){
  let iframe=null,descriptor=null,active=0,ready=false,layout=null,host={paused:false,reduced:false,visible:true};
  let nextId=1,lastAnimated=false;const pending=new Map();
  const send=(type,payload)=>iframe?.contentWindow?.postMessage({channel:'be-art-host',type,payload},env.location.origin);
  function request(type,payload){
    return new Promise((resolve,reject)=>{
      const requestId=nextId++,timeout=env.setTimeout(()=>{pending.delete(requestId);reject(new Error(`The lab did not respond to ${type}.`));},15000);
      pending.set(requestId,{resolve,reject,timeout});
      iframe.contentWindow.postMessage({channel:'be-art-host',type,payload,requestId},env.location.origin);
    });
  }
  function release(){
    active++;ready=false;
    for(const item of pending.values()){env.clearTimeout(item.timeout);item.reject(new Error('Lab switched.'));}pending.clear();
    send('dispose');iframe?.remove();iframe=null;
  }
  let resolveLoad,rejectLoad,loadTimeout;
  async function message(event){
    if(event.source!==iframe?.contentWindow||event.origin!==env.location.origin||event.data?.channel!=='be-art-lab'||event.data.lab!==descriptor?.lab)return;
    const data=event.data;
    if(typeof data.animated==='boolean')lastAnimated=data.animated;
    if(data.type==='response'){
      const item=pending.get(data.requestId);if(!item)return;
      pending.delete(data.requestId);env.clearTimeout(item.timeout);data.error?item.reject(new Error(data.error)):item.resolve(data.result);return;
    }
    if(data.type==='error'){env.clearTimeout(loadTimeout);onError(data.message);rejectLoad?.(new Error(data.message));return;}
    if(data.type==='close'){onState({close:true});return;}
    if(data.type==='state'&&ready)onState(data);
    if(data.type==='ready'){
      const ticket=active;
      try{
        if(layout)send('layout',layout);send('host',host);
        let state=descriptor.state?await request('restore',descriptor.state):descriptor.nativeState?await request('restore',{native:descriptor.nativeState,text:data.state.text}):descriptor.preset?await request('preset',descriptor.preset):data.state;
        if(!descriptor.state&&descriptor.text)state=await request('textPreset',descriptor.text);
        if(ticket!==active)return;
        ready=true;env.clearTimeout(loadTimeout);onState({state,animated:lastAnimated,ready:true});resolveLoad?.(state);resolveLoad=null;rejectLoad=null;
      }catch(error){if(ticket===active){rejectLoad?.(error);onError(error.message);}}
    }
  }
  env.addEventListener('message',message);
  return {
    load(next){env.clearTimeout(loadTimeout);rejectLoad?.(new Error('Lab switched.'));release();descriptor=next;iframe=container.ownerDocument.createElement('iframe');iframe.className='lab-frame';iframe.title=next.name||'Art lab';
      iframe.allow='fullscreen';iframe.src=next.url;container.append(iframe);
      return new Promise((resolve,reject)=>{resolveLoad=resolve;rejectLoad=reject;loadTimeout=env.setTimeout(()=>{reject(new Error('El laboratorio no ha podido iniciarse.'));release();},20000);});
    },
    layout(next){layout=next;send('layout',next);},
    setHost(next){host={...host,...next};send('host',host);},
    snapshot:()=>request('snapshot'),restore:state=>request('restore',state),reset:()=>request('reset'),
    renderAt:time=>request('renderAt',{time}),
    get frame(){return iframe;},
    async dispose(){
      env.clearTimeout(loadTimeout);rejectLoad?.(new Error('Lab closed.'));rejectLoad=null;resolveLoad=null;
      if(ready){try{await request('dispose');}catch{}}
      release();env.removeEventListener('message',message);
    }
  };
}
