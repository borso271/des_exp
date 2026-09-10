import {requestAccess} from './access.js?v=1';

await requestAccess();
try{
 await import('./app.js?v=native-3');
}catch{
 const content=document.getElementById('preview-content');
 content.hidden=true;content.setAttribute('inert','');
 document.getElementById('preview-access').hidden=false;
 document.getElementById('access-submit').disabled=true;
 document.getElementById('access-message').textContent='No se ha podido abrir la vista previa. Recarga la página para intentarlo de nuevo.';
}
