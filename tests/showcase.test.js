const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');

(async()=>{
  const {presets,getPreset}=await import('../showcase/presets.js');
  const {createController}=await import('../showcase/controller.js');
  const {fitEllipse}=await import('../showcase/renderers/ellipse.js');
  assert.equal(presets.length,6);
  assert.equal(getPreset('missing').id,'original');
  assert.equal(getPreset(null).id,'original');
  assert.equal(new Set(presets.map(p=>p.id)).size,presets.length);
  assert.ok(presets.every(p=>Object.isFrozen(p)&&Object.isFrozen(p.geometry)&&Object.isFrozen(p.motion)));
  for(const preset of presets.filter(p=>p.renderer==='ellipses')) {
    const g=preset.geometry,aspect=g.radiusX*g.referenceAspect/g.radiusY;
    for(const [width,height] of [[2400,1156],[1200,578],[358,409],[320,800],[2000,300],[600,600]]) {
      const fitted=fitEllipse(g,width,height),extent=1+g.softness+g.irregularity;
      assert.ok(Math.abs(fitted.radiusX*width/(fitted.radiusY*height)-aspect)<1e-10,'ellipse proportions survive resizing');
      assert.ok(fitted.radiusX*extent<=Math.min(g.centerX,1-g.centerX)-g.margin+1e-10,'soft outer boundary fits horizontally');
      assert.ok(fitted.radiusY*extent<=Math.min(g.centerY,1-g.centerY)-g.margin+1e-10,'soft outer boundary fits vertically');
    }
  }
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
    await controller.select('moving');assert.equal(frames.size,0,'initial reduced-motion frame schedules no animation');
    assert.equal(draws.at(-1).time,0);
    media.matches=false;media.dispatchEvent(new w.Event('change'));assert.equal(frames.size,1);
    intersections[0].callback([{isIntersecting:false}]);assert.equal(frames.size,0);
    intersections[0].callback([{isIntersecting:true}]);assert.equal(frames.size,1);
    Object.defineProperty(doc,'visibilityState',{configurable:true,value:'hidden'});
    doc.dispatchEvent(new w.Event('visibilitychange'));assert.equal(frames.size,0);
    Object.defineProperty(doc,'visibilityState',{configurable:true,value:'visible'});
    doc.dispatchEvent(new w.Event('visibilitychange'));assert.equal(frames.size,1);
    await controller.select('ellipses');
    assert.equal(stage.dataset.renderState,'ready');assert.equal(active,1);assert.equal(frames.size,0);
    assert.equal(host.querySelectorAll('canvas').length,1,'static ellipse draws once in its own canvas');
    assert.match(fallback.style.backgroundImage,/fallback-ellipses\.svg/);
    assert.equal(fallback.style.backgroundSize,'contain');
    assert.equal(stage.style.getPropertyValue('--art-shade'),'0');
    for(let i=0;i<5;i++)for(const preset of presets){
      await controller.select(preset.id);
      const needsCanvas=!['original','image'].includes(preset.renderer);
      assert.equal(host.querySelectorAll('canvas').length,needsCanvas?1:0);
      assert.equal(active,needsCanvas?1:0);
      assert.equal(frames.size,preset.motion.enabled?1:0);
    }
    failure=true;await controller.select('triangle');
    assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);assert.equal(frames.size,0);
    assert.match(fallback.style.backgroundImage,/fallback-triangle\.svg/);
    failure=false;await controller.select('triangle');
    host.querySelector('canvas').dispatchEvent(new w.Event('webglcontextlost',{cancelable:true}));
    assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);assert.equal(frames.size,0);
    controller.dispose();assert.ok(disposed>0);assert.ok(observers[0].disconnected&&intersections[0].disconnected);
    assert.equal(active,0);assert.equal(frames.size,0);

    let complete;
    const raced=createController({stage,host,fallback,env,load:()=>new Promise(resolve=>complete=resolve)});
    const pending=raced.select('moving');await raced.select('original');complete(module);await pending;
    assert.equal(active,0,'stale imports never allocate a renderer');assert.equal(stage.dataset.renderState,'original');
    raced.dispose();
    const unavailable=createController({stage,host,fallback,env,load:async()=>{throw Error('Unavailable module');}});
    await unavailable.select('ellipses-gold');assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);
    assert.match(fallback.style.backgroundImage,/fallback-ellipses-gold\.svg/);
    assert.equal(fallback.style.backgroundSize,'contain');
    await unavailable.select('squares');assert.equal(stage.dataset.renderState,'fallback');assert.equal(active,0);
    assert.equal(fallback.style.backgroundSize,'cover','switching resets the fallback fit');
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
    console.log('PASS: curated Pages artifact, six presets, ellipse fit, renderer races/cleanup, fallback, banner sizing, pause, reduced motion, visibility and static page structure');
  } finally {controller.dispose();dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
