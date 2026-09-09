const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash,webcrypto}=require('node:crypto');
const {JSDOM}=require('jsdom');

(async()=>{
 const {requestAccess,accessSessionKey}=await import('../showcase/access.js');
 const {PASSWORD_DIGEST}=await import('../showcase/access-config.js');
 assert.match(PASSWORD_DIGEST,/^[a-f0-9]{64}$/);
 const password='preview test password',passwordDigest=createHash('sha256').update(password).digest('hex');
 const markup=fs.readFileSync('index.html','utf8'),scope='/des_exp/';
 const remembered=new Map();
 const storage={getItem:key=>remembered.get(key)??null,setItem:(key,value)=>remembered.set(key,value)};
 const opened=[];
 function page(overrides={}){
  const dom=new JSDOM(markup,{url:'https://example.test/des_exp/?art=ellipses-gold'});opened.push(dom);
  const d=dom.window.document;
  const ready=requestAccess({document:d,crypto:webcrypto,storage:()=>storage,scope,passwordDigest,...overrides});
  const locked=()=>{assert.equal(d.getElementById('preview-access').hidden,false);assert.equal(d.getElementById('preview-content').hidden,true);assert.equal(d.getElementById('preview-content').hasAttribute('inert'),true);};
  const unlocked=()=>{assert.equal(d.getElementById('preview-access').hidden,true);assert.equal(d.getElementById('preview-content').hidden,false);assert.equal(d.getElementById('preview-content').hasAttribute('inert'),false);};
  async function submit(value){
   d.getElementById('access-password').value=value;
   d.getElementById('access-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
   const start=Date.now();
   while(d.getElementById('access-submit').disabled){
    if(Date.now()-start>3000)throw Error('Password verification did not finish');
    await new Promise(resolve=>setImmediate(resolve));
   }
  }
  return {dom,d,ready,locked,unlocked,submit};
 }
 try{
  const first=page();first.locked();
  assert.equal(first.d.querySelector('iframe'),null);
  const scripts=[...first.d.scripts].map(script=>script.getAttribute('src'));
  assert.deepEqual(scripts,['./showcase/entry.js?v=1'],'the application is loaded only through the access gate');
  await first.submit('incorrect');first.locked();
  assert.equal(first.d.getElementById('access-password').getAttribute('aria-invalid'),'true');
  assert.match(first.d.getElementById('access-message').textContent,/incorrecta/);
  assert.equal(remembered.size,0);
  first.d.getElementById('access-password').dispatchEvent(new first.dom.window.Event('input'));
  assert.equal(first.d.getElementById('access-message').textContent,'');
  await first.submit(password);await first.ready;first.unlocked();
  assert.equal(first.d.getElementById('access-password').value,'','password is cleared after entry');
  assert.equal(first.dom.window.location.search,'?art=ellipses-gold','entry retains the composition URL');
  assert.equal(first.d.activeElement.id,'main-content');
  assert.equal(remembered.get(accessSessionKey(scope)),passwordDigest);
  const reload=page();await reload.ready;reload.unlocked();
  const otherProject=page({scope:'/another-project/'});otherProject.locked();
  const changedPassword=page({passwordDigest:createHash('sha256').update('changed').digest('hex')});changedPassword.locked();
  const noStorage=page({storage:()=>{throw new Error('Storage blocked');}});noStorage.locked();
  await noStorage.submit(password);await noStorage.ready;noStorage.unlocked();
  const unavailable=page({storage:()=>{throw new Error('Storage blocked');},crypto:{}});
  await unavailable.submit(password);unavailable.locked();
  assert.match(unavailable.d.getElementById('access-message').textContent,/No se ha podido/);
  assert.equal(unavailable.d.getElementById('access-submit').disabled,false);
  console.log('PASS: preview gate rejects incorrect passwords, remembers tab access, preserves deep links, handles blocked storage and keeps content hidden until entry');
 }finally{opened.forEach(dom=>dom.window.close());}
})().catch(error=>{console.error(error);process.exitCode=1;});
