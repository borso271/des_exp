const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');

(async()=>{
  const {presets,getPreset}=await import('../showcase/presets.js');
  const {createController}=await import('../showcase/controller.js');
  assert.equal(presets.length,5);
  assert.equal(getPreset('missing').id,'original');
  assert.equal(getPreset(null).id,'original');
  assert.equal(new Set(presets.map(p=>p.id)).size,5);
  assert.ok(presets.every(p=>Object.isFrozen(p)&&Object.isFrozen(p.geometry)&&Object.isFrozen(p.motion)));
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://borso271.github.io/des_exp/',pretendToBeVisual:true});
  const w=dom.window,doc=w.document;
  const stage=doc.getElementById('hero-art'),host=doc.getElementById('art-canvas'),fallback=doc.getElementById('art-fallback');
  stage.getBoundingClientRect=()=>({width:358,height:409});
  let nextFrame=1,active=0,disposed=0,draws=[],failure=false;
  const frames=new Map(),observers=[],intersections=[];
  const media=new w.EventTarget();media.matches=false;
  const env={
    document:doc,devicePixelRatio:2,matchMedia:()=>media,
    requestAnimationFrame:callback=>{const id=nextFrame++;frames.set(id,callback);return id;},
    cancelAnimationFrame:id=>frames.delete(id),
    ResizeObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},
    IntersectionObserver:class{constructor(callback){this.callback=callback;intersections.push(this);}observe(){}disconnect(){this.disconnected=true;}}
  };
  const module={create(canvas,preset){
    active++;let dead=false;
    return {render(width,height,time){assert.equal(dead,false);if(failure)throw Error('GPU failure');draws.push({preset:preset.id,width,height,time});},
      dispose(){assert.equal(dead,false,'dispose exactly once');dead=true;active--;disposed++;}};
  }};
  const controller=createController({stage,host,fallback,env,load:async()=>module});
  const advance=time=>{const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(time));};
  try {
    await controller.select('moving');
    assert.equal(stage.dataset.renderState,'ready');assert.equal(active,1);assert.equal(frames.size,1);
    assert.deepEqual(draws[0],{preset:'moving',width:537,height:614,time:0},'renderer is sized to banner, with capped DPR');
    advance(100);advance(130);assert.ok(draws.at(-1).time>0);
    const pausedAt=draws.at(-1).time;controller.togglePause();assert.equal(frames.size,0);
    observers[0].callback();assert.equal(draws.at(-1).time,pausedAt,'resize while paused preserves frame');
    controller.togglePause();assert.equal(frames.size,1);
    media.matches=true;media.dispatchEvent(new w.Event('change'));assert.equal(frames.size,0);
    assert.equal(stage.dataset.motion,'still');
    await controller.select('ellipses');assert.equal(frames.size,0,'initial reduced-motion frame schedules no animation');
    assert.equal(draws.at(-1).time,0);
    media.matches=false;media.dispatchEvent(new w.Event('change'));assert.equal(frames.size,1);
    intersections[0].callback([{isIntersecting:false}]);assert.equal(frames.size,0);
    intersections[0].callback([{isIntersecting:true}]);assert.equal(frames.size,1);
    Object.defineProperty(doc,'visibilityState',{configurable:true,value:'hidden'});
    doc.dispatchEvent(new w.Event('visibilitychange'));assert.equal(frames.size,0);
    Object.defineProperty(doc,'visibilityState',{configurable:true,value:'visible'});
    doc.dispatchEvent(new w.Event('visibilitychange'));assert.equal(frames.size,1);
    for(let i=0;i<5;i++)for(const preset of presets){
      await controller.select(preset.id);
      assert.equal(host.querySelectorAll('canvas').length,preset.id==='original'?0:1);
      assert.equal(active,preset.id==='original'?0:1);
      assert.equal(frames.size,preset.motion.enabled?1:0);
    }
    failure=true;await controller.select('triangle');
    assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);assert.equal(frames.size,0);
    assert.match(fallback.style.backgroundImage,/fallback-triangle\.svg/);
    failure=false;await controller.select('ellipses');
    host.querySelector('canvas').dispatchEvent(new w.Event('webglcontextlost',{cancelable:true}));
    assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);assert.equal(frames.size,0);
    controller.dispose();assert.ok(disposed>20);assert.ok(observers[0].disconnected&&intersections[0].disconnected);
    assert.equal(active,0);assert.equal(frames.size,0);

    let complete;
    const raced=createController({stage,host,fallback,env,load:()=>new Promise(resolve=>complete=resolve)});
    const pending=raced.select('moving');await raced.select('original');complete(module);await pending;
    assert.equal(active,0,'stale imports never allocate a renderer');assert.equal(stage.dataset.renderState,'original');
    raced.dispose();
    const unavailable=createController({stage,host,fallback,env,load:async()=>{throw Error('Unavailable module');}});
    await unavailable.select('squares');assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);
    unavailable.dispose();

    const choices=[...doc.querySelectorAll('#art-direction option')];
    assert.deepEqual(choices.map(e=>e.value),presets.map(p=>p.id));
    assert.deepEqual(choices.map(e=>e.textContent),presets.map(p=>p.name));
    assert.equal(doc.querySelectorAll('main').length,1);assert.equal(doc.querySelectorAll('main section').length,3);
    assert.equal(doc.querySelector('.page-homeHeroTagline').hidden,true);
    assert.equal(doc.querySelectorAll('input[type=range],input[type=color],iframe,form').length,0);
    assert.match(doc.querySelector('meta[name=robots]').content,/noindex/);
    assert.equal(doc.querySelectorAll('script').length,1);
    assert.ok([...doc.querySelectorAll('a[href]')].every(a=>a.getAttribute('href').startsWith('#')||a.href.startsWith('https://')));
    execFileSync(process.execPath,['scripts/sync-showcase-renderers.mjs','--check']);
    execFileSync(process.execPath,['scripts/generate-showcase-fallbacks.mjs','--check']);
    execFileSync(process.execPath,['scripts/build-showcase.mjs']);
    assert.deepEqual(fs.readdirSync('_site').sort(),['.nojekyll','index.html','showcase']);
    assert.ok(!fs.existsSync('_site/showcase/package.json'));
    assert.ok(!fs.existsSync('_site/triangle-light')&&!fs.existsSync('_site/_qa'));
    console.log('PASS: curated Pages artifact, five presets, renderer races/cleanup, fallback, banner sizing, pause, reduced motion, visibility and static page structure');
  } finally {controller.dispose();dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
