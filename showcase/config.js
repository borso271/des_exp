import {presets,getPreset} from './presets.js';
import {engineControls,textControls,getPath} from './schema.js';
export const CONFIG_FORMAT='be-art-banner';
export const CONFIG_VERSION=1;
export const clone=value=>JSON.parse(JSON.stringify(value));
export const defaultText={mode:'logo',content:'NO SOMOS\nESPECTADORES',font:'Solea',weight:'400',size:9,lineHeight:1,width:61,color:'#ffffff',align:'center',vertical:'center',x:50,y:50};
export function createConfig(id){
  const p=clone(getPreset(id));
  if(p.renderer==='ellipses') {p.geometry.scale=1;p.motion.speed=.08;p.motion.breathing=.025;}
  return {...p,text:clone(defaultText)};
}
const fail=message=>{throw new Error(message);};
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function validateShape(value,template,path){
  if(plain(template)){
    if(!plain(value))fail(`${path}: se esperaba un objeto.`);
    for(const key of Object.keys(value))if(!Object.hasOwn(template,key))fail(`${path}.${key}: campo desconocido.`);
    for(const key of Object.keys(template)){
      if(!Object.hasOwn(value,key))fail(`${path}.${key}: falta este campo.`);
      validateShape(value[key],template[key],`${path}.${key}`);
    }
  }else if(Array.isArray(template)){
    if(!Array.isArray(value)||value.length!==template.length)fail(`${path}: número de colores incorrecto.`);
    value.forEach((color,i)=>{if(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))fail(`${path}[${i}]: color hexadecimal inválido.`);});
  }else if(typeof value!==typeof template||(typeof value==='number'&&!Number.isFinite(value)))fail(`${path}: valor inválido.`);
}
function validateControl(value,c){
  if(['range','number'].includes(c.type)){
    if(!Number.isFinite(value)||value<c.min||value>c.max||(c.step===1&&!Number.isInteger(value)))fail(`${c.label}: debe estar entre ${c.min} y ${c.max}.`);
  }else if(c.type==='select'&&!c.options.some(([key])=>key===value))fail(`${c.label}: opción desconocida.`);
  else if(c.type==='checkbox'&&typeof value!=='boolean')fail(`${c.label}: valor inválido.`);
  else if(c.type==='color'&&!/^#[0-9a-f]{6}$/i.test(value))fail(`${c.label}: color inválido.`);
  else if(c.type==='textarea'&&(typeof value!=='string'||value.length>c.maxLength))fail(`${c.label}: máximo ${c.maxLength} caracteres.`);
}
export function validateConfig(input){
  if(!plain(input)||!presets.some(p=>p.id===input.id))fail('Dirección artística desconocida.');
  const defaults=createConfig(input.id);
  validateShape(input,defaults,'config');
  for(const key of ['renderer','name','description'])if(input[key]!==defaults[key])fail(`${key}: no coincide con la dirección artística.`);
  for(const c of engineControls[input.renderer])validateControl(getPath(input,c.path),c);
  textControls.forEach(c=>validateControl(input.text[c.path],c));
  if(!Number.isInteger(input.seed)||input.seed<0||input.seed>999999)fail('Semilla inválida.');
  if(input.shade<0||input.shade>.8)fail('Sombra del fondo: debe estar entre 0 y 0.8.');
  if(input.text.font==='Solea'&&input.text.weight!=='400')fail('Solea solo incluye el peso Regular.');
  // Non-editable engine values remain pinned, avoiding unbounded GPU inputs.
  for(const section of ['geometry','light','motion'])for(const key of Object.keys(defaults[section]||{})){
    if(!engineControls[input.renderer].some(c=>c.path===`${section}.${key}`)&&input[section][key]!==defaults[section][key])fail(`${section}.${key}: parámetro no editable.`);
  }
  if(input.renderer==='ellipses'){
    const g=input.geometry;
    if(!(g.ring2>g.ring3&&g.ring3>g.ring4&&g.ring4>g.core))fail('Los anillos deben disminuir hacia el núcleo.');
  }
  return clone(input);
}
export function serializeConfig(config){return JSON.stringify({format:CONFIG_FORMAT,version:CONFIG_VERSION,config:validateConfig(config)},null,2)+'\n';}
export function parseConfig(source){
  if(source.length>100000)fail('El archivo es demasiado grande (máximo 100 KB).');
  let data;try{data=JSON.parse(source);}catch{fail('El archivo no contiene JSON válido.');}
  if(!plain(data)||data.format!==CONFIG_FORMAT)fail('Este archivo no es una configuración de Be Art Banner.');
  if(data.version!==CONFIG_VERSION)fail(`Versión no compatible: ${data.version}. Se requiere la versión ${CONFIG_VERSION}.`);
  if(Object.keys(data).some(k=>!['format','version','config'].includes(k)))fail('La configuración contiene campos desconocidos.');
  return validateConfig(data.config);
}
export function createSession(){
  const drafts=new Map();
  return {
    get(id){id=getPreset(id).id;if(!drafts.has(id))drafts.set(id,createConfig(id));return clone(drafts.get(id));},
    put(config){const valid=validateConfig(config);drafts.set(valid.id,valid);return clone(valid);},
    reset(id){const config=createConfig(id);drafts.set(config.id,config);return clone(config);}
  };
}
