import {PASSWORD_DIGEST} from './access-config.js?v=1';

export const accessSessionKey=scope=>`be-art-preview-access:${scope}`;

// This browser-only prompt discourages casual viewing; it is not authentication.
export function requestAccess({document=window.document,crypto=window.crypto,
 storage=()=>window.sessionStorage,scope=new URL('.',window.location.href).pathname,
 passwordDigest=PASSWORD_DIGEST}={}){
 const gate=document.getElementById('preview-access'),content=document.getElementById('preview-content');
 const form=document.getElementById('access-form'),password=document.getElementById('access-password');
 const button=document.getElementById('access-submit'),message=document.getElementById('access-message');
 const key=accessSessionKey(scope);
 return new Promise(resolve=>{
  function unlock(){
   password.value='';gate.hidden=true;content.hidden=false;content.removeAttribute('inert');resolve();
  }
  try{if(storage().getItem(key)===passwordDigest){unlock();return;}}catch{}
  password.addEventListener('input',()=>{message.textContent='';password.removeAttribute('aria-invalid');});
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(button.disabled||!password.value)return;
   button.disabled=true;message.textContent='';password.removeAttribute('aria-invalid');
   try{
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password.value));
    const digest=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
    if(digest!==passwordDigest){
     message.textContent='Contraseña incorrecta. Inténtalo de nuevo.';
     password.setAttribute('aria-invalid','true');password.focus();password.select();return;
    }
    try{storage().setItem(key,passwordDigest);}catch{}
    unlock();
    document.getElementById('main-content')?.focus();
   }catch{
    message.textContent='No se ha podido comprobar la contraseña. Recarga la página e inténtalo de nuevo.';
   }finally{button.disabled=false;}
  });
 });
}
