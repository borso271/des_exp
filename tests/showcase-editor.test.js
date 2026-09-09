const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
(async()=>{
 const {makeConfig,parseConfig,serializeConfig,clone}=await import('../showcase/config.js');
 const {createLabHost}=await import('../showcase/lab-host.js');
 const dom=new JSDOM(fs.readFileSync('canvas_light_columns_demo.html','utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 const script=d.createElement('script');script.src='http://localhost/js/shared/poster-text.js';Object.defineProperty(d,'currentScript',{get:()=>script});
 w.eval(fs.readFileSync('js/shared/poster-text.js','utf8'));
 const text=w.PosterText.create({poster:d.querySelector('.poster'),wordmark:d.querySelector('#wordmark'),eventCopy:d.querySelector('#event-copy'),root:d.querySelector('#text-controls')});
 const original=clone(text.getState());
 for(const effect of ['solid-white','solid-black','invert','difference','accent']){
  text.setState({...original,eventCopyVariant:'custom',customCopy:'<img src=x>\nBE ART',eventTextEffect:effect,textLayout:'positioned',textFontFamily:'Poppins',textFontWeight:'200',customTracking:.03});
  assert.equal(d.querySelector('.event-venue').textContent,'<img src=x>\nBE ART');assert.equal(d.querySelector('.event-venue img'),null);
  assert.equal(d.querySelector('#event-copy').dataset.textEffect,effect);
  const saved=clone(text.getState());text.setState(original);text.setState(saved);assert.deepEqual(clone(text.getState()),saved);
 }
 for(const effect of [...d.querySelector('#logo-effect').options].map(o=>o.value)){
  text.setState({...original,eventCopyVariant:'logo',logoEffect:effect,logoEffectStrength:72,logoEffectHue:130,logoEffectOpacity:80});
  assert.equal(d.querySelector('#wordmark').dataset.logoEffect,effect);
  assert.equal(d.querySelector('#wordmark').style.getPropertyValue('--effect-alpha'),String(.72*.8));
 }
 text.setState({...original,eventCopyVariant:'manifesto-title'});
 assert.equal(d.querySelector('.manifesto-title-top').textContent,'NO SOMOS');assert.equal(d.querySelector('.manifesto-title-bottom').textContent,'ESPECTADORES');
 const before=clone(text.getState());
 for(const patch of [{logoEffect:'unsupported'},{customFontSize:999},{eventTextOpacity:'50'},{extra:1}]){assert.throws(()=>text.setState({...before,...patch}));assert.deepEqual(clone(text.getState()),before);}
 const state={native:{complete:{geometry:'all',progression:[1,2,3]},seed:271},text:before};
 const config=makeConfig('moving',state,true);assert.deepEqual(parseConfig(serializeConfig(config)),config);
 for(const edit of [c=>c.version=1,c=>c.lab='ellipse',c=>c.extra=1,c=>delete c.state.text]){const invalid=clone(config);edit(invalid);assert.throws(()=>parseConfig(JSON.stringify(invalid)));}
 const container=d.createElement('div');d.body.append(container);const events=[];
 const host=createLabHost({container,env:w,onState:event=>events.push(event)});
 const loading=host.load({lab:'moving',url:'about:blank',state});const frame=host.frame;
 const emit=data=>w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,source:frame.contentWindow,data:{channel:'be-art-lab',lab:'moving',...data}}));
 const requests=[];
 frame.contentWindow.postMessage=(message,origin)=>{
  assert.equal(origin,w.location.origin);requests.push(message);
  if(message.requestId)queueMicrotask(()=>emit({type:'response',requestId:message.requestId,result:message.type==='restore'?message.payload:state,animated:true}));
 };
 host.layout({editing:true,art:{x:24,y:20,width:880,height:424}});host.setHost({paused:true,reduced:true});
 emit({type:'ready',state,animated:true});await loading;
 assert.deepEqual(requests.find(r=>r.type==='restore').payload,state,'complete native state passes through unchanged');
 assert.deepEqual(await host.snapshot(),state);
 const prior=events.length;
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://unrelated.example',source:frame.contentWindow,data:{channel:'be-art-lab',lab:'moving',type:'state',state:{bad:true}}}));assert.equal(events.length,prior,'foreign messages ignored');
 await host.dispose();assert.ok(requests.some(r=>r.type==='dispose'),'dispose is acknowledged before iframe removal');assert.equal(container.children.length,0);
 text.dispose();dom.window.close();
 console.log('PASS: shared native text treatments, complete JSON envelope, atomic text rejection, host transport and acknowledged cleanup');
})().catch(error=>{console.error(error);process.exitCode=1;});
