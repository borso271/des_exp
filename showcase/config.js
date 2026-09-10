import {presets,getPreset} from './presets.js?v=native-3';
export const CONFIG_FORMAT='be-art-native-banner';
export const CONFIG_VERSION=2;
export const MAX_CONFIG_BYTES=32*1024*1024;
export const clone=value=>JSON.parse(JSON.stringify(value));
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// Only the hosting envelope is checked here. Complete art and text validation
// belongs to the actual lab and shared text source, before a visible mutation.
export function validateConfig(value){
 if(!record(value)||Object.keys(value).length!==6||value.format!==CONFIG_FORMAT||value.version!==CONFIG_VERSION)throw new Error('Se requiere una configuración completa de laboratorios, versión 2.');
 if(!presets.some(p=>p.id===value.direction)||value.lab!==getPreset(value.direction).lab||typeof value.paused!=='boolean')throw new Error('Dirección o laboratorio no compatible.');
 if(!record(value.state)||Object.keys(value.state).length!==2||!record(value.state.native)||!record(value.state.text))throw new Error('Faltan los ajustes completos del laboratorio o del texto.');
 return clone(value);
}
export function makeConfig(direction,state,paused=false){return validateConfig({format:CONFIG_FORMAT,version:CONFIG_VERSION,direction,lab:getPreset(direction).lab,paused,state});}
export function serializeConfig(config){return JSON.stringify(validateConfig(config),null,2)+'\n';}
export function parseConfig(source){
 if(new TextEncoder().encode(source).length>MAX_CONFIG_BYTES)throw new Error('El archivo supera 32 MB.');
 let value;try{value=JSON.parse(source);}catch{throw new Error('El archivo no contiene JSON válido.');}
 return validateConfig(value);
}
