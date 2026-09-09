const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
(async()=>{
  const {createConfig,validateConfig,createSession,serializeConfig,parseConfig,clone}=await import('../showcase/config.js');
  const {presets}=await import('../showcase/presets.js');
  const {engineControls,setPath}=await import('../showcase/schema.js');
  const {createEditor}=await import('../showcase/editor.js');
  const {createTextLayer}=await import('../showcase/text-layer.js');
  const {createController}=await import('../showcase/controller.js');
  const {fitEllipse}=await import('../showcase/renderers/ellipse.js');
  const {fallbackSVG}=await import('../showcase/fallback.js');
  const immutable=JSON.stringify(presets),session=createSession();
  for(const p of presets){
    const config=createConfig(p.id);
    assert.deepEqual(parseConfig(serializeConfig(config)),config);
    config.text.mode='custom';config.text.content='A NEW\nRENAISSANCE';config.text.font='Poppins';config.text.weight='200';
    if(config.palette.length)config.palette[0]='#fefefe';
    session.put(config);assert.deepEqual(session.get(p.id),config);
    session.get(p.id).text.content='accidental mutation';assert.equal(session.get(p.id).text.content,'A NEW\nRENAISSANCE');
  }
  session.reset('ellipses');assert.equal(session.get('ellipses').text.mode,'logo');assert.equal(session.get('triangle').text.mode,'custom');
  assert.equal(JSON.stringify(presets),immutable);
  for(const mutate of [
    c=>c.renderer='moving',c=>c.geometry.radiusX=Infinity,c=>c.geometry.ring3=.9,c=>c.palette[0]='url(https://example.com)',
    c=>c.palette.push('#fff000'),c=>c.seed=-1,c=>c.motion.enabled='yes',c=>c.text.font='Remote Font',c=>c.text.weight='200',
    c=>c.text.size=100000,c=>c.text.content='x'.repeat(501),c=>c.geometry.referenceAspect=0,c=>c.motion.speed=100,
    c=>delete c.text.color,c=>c.extra=true,c=>Object.defineProperty(c,'__proto__',{value:{polluted:true},enumerable:true})
  ]){const c=createConfig('ellipses');mutate(c);assert.throws(()=>validateConfig(c));}
  assert.throws(()=>parseConfig('{broken'),/JSON válido/);
  assert.throws(()=>parseConfig(JSON.stringify({format:'be-art-banner',version:100,config:createConfig('moving')})),/Versión/);
  assert.throws(()=>parseConfig('x'.repeat(100001)),/grande/);
  const roundTrip=createConfig('moving');roundTrip.geometry.count=37;roundTrip.seed=54321;roundTrip.motion.enabled=false;
  roundTrip.text.mode='custom';roundTrip.text.content='<img src=x onerror=alert(1)>\n& "ART"';
  assert.deepEqual(parseConfig(serializeConfig(roundTrip)),roundTrip);
  for(const [width,height] of [[1200,578],[358,409],[1800,300],[300,900]])for(const rotation of [-90,-43,0,27,90]){
    const c=createConfig('ellipses'),g=c.geometry;g.rotation=rotation;g.centerX=.25;g.scale=.9;
    const fitted=fitEllipse(g,width,height,.08),angle=rotation*Math.PI/180,rx=fitted.radiusX*width,ry=fitted.radiusY*height;
    const extent=(1+g.softness+g.irregularity)*1.08;
    assert.ok(Math.hypot(rx*Math.cos(angle),ry*Math.sin(angle))*extent<=(.25-g.margin)*width+1e-8);
    assert.ok(Math.hypot(rx*Math.sin(angle),ry*Math.cos(angle))*extent<=(.5-g.margin)*height+1e-8);
  }
  for(const p of presets.filter(p=>p.renderer!=='original')){
    const c=createConfig(p.id),before=fallbackSVG(c,390,440);c.palette[0]='#abcdef';
    assert.notEqual(fallbackSVG(c,390,440),before,'fallback responds to edited palettes');
    assert.match(fallbackSVG(c,390,440),/#abcdef/);
  }
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'http://localhost/?art=ellipses',pretendToBeVisual:true});
  const w=dom.window,d=w.document,stage=d.getElementById('hero-art');
  stage.getBoundingClientRect=()=>({width:1000,height:500});w.matchMedia=()=>({matches:false});
  const observers=[];const Observer=class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.dead=true;}};
  const textLayer=createTextLayer(stage,d.querySelector('.page-homeHeroBrand'),{ResizeObserver:Observer});
  let current=createConfig('ellipses'),saved='',savedName='';const editing=createSession();
  const editor=createEditor({root:d.getElementById('banner-editor'),toggle:d.getElementById('edit-banner'),getConfig:()=>current,
    onEdit(c){current=editing.put(c);textLayer.update(current.text);return current;},
    onSelect(id,config){current=config?editing.put(config):editing.get(id);textLayer.update(current.text);editor.sync();},
    onReset(){current=editing.reset(current.id);textLayer.update(current.text);},
    download(source,name){saved=source;savedName=name;}
  });
  function input(id,value){const node=d.getElementById(id);if(node.type==='checkbox')node.checked=value;else node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));}
  function choose(id,value){const node=d.getElementById(id);node.value=value;node.dispatchEvent(new w.Event('change',{bubbles:true}));}
  try{
    assert.equal(d.getElementById('banner-editor').hidden,true);d.getElementById('edit-banner').click();assert.equal(d.body.classList.contains('editor-open'),true);
    assert.equal(d.getElementById('text-font').closest('label').hidden,true,'logo has no font controls');
    d.getElementById('tab-text').click();input('text-mode','manifesto');
    assert.equal(d.querySelector('.banner-manifesto-top').textContent,'NOSOMOS');
    assert.equal(d.querySelector('.banner-manifesto-bottom').textContent,'ESPECTADORES');
    assert.equal(d.getElementById('text-weight').closest('label').hidden,true,'only bundled Solea regular is available');
    input('text-font','Poppins');assert.equal(d.getElementById('text-weight').closest('label').hidden,false);
    input('text-weight','200');input('text-color','#332211');input('text-mode','custom');input('text-content','<script>danger()</script>\nART');
    assert.equal(d.querySelector('.banner-copy').textContent,'<script>danger()</script>\nART');assert.equal(d.querySelector('.banner-copy script'),null);
    input('text-vertical','center');assert.equal(d.querySelector('.banner-text').style.top,'250px');
    const kept=clone(current);d.getElementById('close-editor').click();assert.deepEqual(current,kept);assert.equal(d.activeElement.id,'edit-banner');
    editor.setOpen(true);d.getElementById('tab-parameters').click();input('param-geometry-scale',.63);assert.equal(current.geometry.scale,.63);
    const invalidBefore=clone(current);input('param-geometry-ring3',.9);assert.deepEqual(current,invalidBefore);assert.equal(d.getElementById('editor-message').dataset.error,'true');
    choose('editor-direction','moving');assert.ok(d.getElementById('param-seed'));assert.equal(d.getElementById('param-geometry-ring2'),null);
    input('param-seed',9876);input('param-geometry-count',24);input('param-motion-enabled',false);assert.equal(current.motion.enabled,false);
    choose('editor-direction','ellipses');assert.equal(current.geometry.scale,.63);assert.equal(current.text.content,kept.text.content);
    choose('editor-direction','moving');assert.equal(current.seed,9876);assert.equal(current.geometry.count,24);
    d.getElementById('download-banner').click();assert.deepEqual(parseConfig(saved),current);assert.equal(savedName,'be-art-moving.json');
    d.getElementById('reset-banner').click();assert.equal(current.geometry.count,12);assert.equal(current.text.mode,'logo');
    const file=d.getElementById('import-banner');Object.defineProperty(file,'files',{configurable:true,value:[{size:saved.length,text:async()=>saved}]});
    file.dispatchEvent(new w.Event('change'));await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(current,parseConfig(saved));
    const beforeBad=clone(current);Object.defineProperty(file,'files',{configurable:true,value:[{size:8,text:async()=>'{broken'}]});
    file.dispatchEvent(new w.Event('change'));await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(current,beforeBad);assert.equal(d.getElementById('editor-message').dataset.error,'true');
    choose('editor-direction','original');assert.equal(d.getElementById('editor-palette').closest('label').hidden,true);
    input('text-mode','none');assert.equal(d.querySelector('.banner-text').hidden,true);
    d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(d.getElementById('banner-editor').hidden,true);

    let allocations=0,disposals=0,updates=0,lastDraw,nextFrame=1;
    const frames=new Map(),media=new w.EventTarget();media.matches=false;
    const env={document:d,devicePixelRatio:1,ResizeObserver:Observer,matchMedia:()=>media,
      requestAnimationFrame:f=>{const id=nextFrame++;frames.set(id,f);return id;},cancelAnimationFrame:id=>frames.delete(id)};
    const module={create(canvas,preset){allocations++;let settings=preset;return {
      update(next){updates++;settings=next;},render(width,height,time){lastDraw={width,height,time,settings};},dispose(){disposals++;}
    };}};
    const controller=createController({stage,host:d.getElementById('art-canvas'),fallback:d.getElementById('art-fallback'),env,load:async()=>module});
    await controller.select(createConfig('ellipses'));
    const edited=createConfig('ellipses');edited.geometry.scale=.5;controller.update(edited);
    assert.equal(allocations,1);assert.equal(updates,1);assert.equal(lastDraw.settings.geometry.scale,.5);assert.equal(frames.size,0);
    await controller.select(createConfig('moving'));const advance=now=>{const jobs=[...frames.values()];frames.clear();jobs.forEach(f=>f(now));};
    advance(10);advance(40);const time=lastDraw.time;assert.ok(time>0);
    const next=createConfig('moving');next.geometry.count=30;controller.update(next);assert.equal(lastDraw.time,time);assert.equal(frames.size,1);
    controller.togglePause();assert.equal(frames.size,0);next.palette[0]='#aabbcc';controller.update(next);assert.equal(lastDraw.time,time);assert.equal(frames.size,0);
    media.matches=true;media.dispatchEvent(new w.Event('change'));await controller.select(createConfig('ellipses'));edited.motion.enabled=true;controller.update(edited);assert.equal(frames.size,0);
    media.matches=false;media.dispatchEvent(new w.Event('change'));assert.equal(frames.size,1);
    d.querySelector('#art-canvas canvas').dispatchEvent(new w.Event('webglcontextlost',{cancelable:true}));assert.equal(frames.size,0);
    const fallbackBefore=d.getElementById('art-fallback').style.backgroundImage;edited.palette[0]='#abcdef';controller.update(edited);
    assert.notEqual(d.getElementById('art-fallback').style.backgroundImage,fallbackBefore,'edits also work after WebGL failure');
    controller.dispose();assert.equal(allocations,disposals);assert.equal(frames.size,0);
    let resolve;const pendingController=createController({stage,host:d.getElementById('art-canvas'),fallback:d.getElementById('art-fallback'),env,load:()=>new Promise(r=>resolve=r)});
    const pending=pendingController.select(createConfig('squares'));const early=createConfig('squares');early.geometry.count=7;pendingController.update(early);resolve(module);await pending;
    assert.equal(lastDraw.settings.geometry.count,7,'edits during module loading reach the new renderer');pendingController.dispose();
    assert.equal(allocations,disposals);
  }finally{editor.dispose();textLayer.dispose();dom.window.close();}
  console.log('PASS: banner editor, safe versioned JSON, per-direction drafts, shared text, live updates, motion cleanup and responsive fallback geometry');
})().catch(error=>{console.error(error);process.exitCode=1;});
