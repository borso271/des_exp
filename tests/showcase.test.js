const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
(async()=>{
 const {presets,getPreset}=await import('../showcase/presets.js');
 assert.deepEqual(presets.map(p=>p.id),['original','ellipses','ellipses-gold','squares','triangle','moving','light']);
 assert.equal(getPreset('missing').id,'original');
 const inventory=JSON.parse(fs.readFileSync('docs/lab-control-inventory.json','utf8'));
 for(const [lab,baseline] of Object.entries(inventory)){
  const dom=new JSDOM(fs.readFileSync(baseline.source,'utf8'),{runScripts:'outside-only'}),w=dom.window;
  if(lab==='triangle'){
   w.console.error=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;w.requestAnimationFrame=()=>1;
   for(const file of ['js/shared/color-palettes.js','triangle-light/palette.js','triangle-light/app.js'])w.eval(fs.readFileSync(file,'utf8'));
  }
  for(const expected of baseline.controls){
   const node=!expected.id?w.document.querySelectorAll('.palette-color')[Number(expected.label)-1]:w.document.getElementById(expected.id)||w.document.querySelector(`[data-k="${expected.key}"]`)||w.document.getElementById(`p-${expected.key}`);
   assert.ok(node,`${lab}: original control ${expected.key} remains`);
   assert.equal(['SELECT','BUTTON','TEXTAREA'].includes(node.tagName)?node.tagName.toLowerCase():node.type,expected.type,`${lab}: ${expected.key} type`);
   for(const field of ['min','max','step'])if(expected[field]!==undefined)assert.equal(node[field],String(expected[field]),`${lab}: ${expected.key}.${field}`);
   for(const option of expected.options||[])assert.ok([...node.options].some(actual=>actual.value===option.value),`${lab}: ${expected.key}.${option.value} remains available`);
  }
  dom.window.close();
 }
 for(const id of ['ellipses','ellipses-gold']){
  const p=getPreset(id).preset;
  assert.equal(p.breathing,0);
  assert.ok(p.radiusY<Math.min(p.centerY,1-p.centerY)-.04,'default outer ellipse has vertical breathing room');
  assert.ok(p.radiusX<Math.min(p.centerX,1-p.centerX)-.04,'default outer ellipse has horizontal breathing room');
 }
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'));
 assert.deepEqual([...dom.window.document.querySelector('#art-direction').options].map(o=>o.value),presets.map(p=>p.id));dom.window.close();
 for(const file of ['showcase/vendor','showcase/renderers','showcase/schema.js','showcase/fallback.js'])assert.equal(fs.existsSync(file),false);
 execFileSync(process.execPath,['scripts/build-showcase.mjs'],{stdio:'pipe'});
 for(const file of ['canvas_light_columns_demo.html','triangle-light/app.js','turrell-ellipse-light/app.js','moving_shapes/app.js','light/index.html','light/app.js','light/shaders.js','light/renderer.js','light/controls.js','js/shared/poster-text.js'])assert.equal(fs.readFileSync(`_site/${file}`,'utf8'),fs.readFileSync(file,'utf8'),'Pages ships actual native source');
 for(const file of ['tests','docs','circle.html','ellipse_gold.png','ellipse-light-2400x1286.png'])assert.equal(fs.existsSync(`_site/${file}`),false);
 console.log('PASS: complete baseline control inventory, stable directions, native Pages dependencies, no duplicate generators');
})().catch(error=>{console.error(error);process.exitCode=1;});
