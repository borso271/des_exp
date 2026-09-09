import {presets} from './presets.js';
import {engineControls,textControls,palettes,getPath,setPath} from './schema.js';
import {clone,parseConfig,serializeConfig} from './config.js';

export function createEditor({root,toggle,onEdit,onSelect,onReset,getConfig,download=downloadConfig}){
  const doc=root.ownerDocument;
  let active=getConfig(),tab='art';
  const controls=[];
  const el=(tag,text,className)=>{const node=doc.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
  const message=root.querySelector('#editor-message');
  const report=(text,error=false)=>{message.textContent=text;message.dataset.error=String(error);};
  const panels={art:root.querySelector('#editor-art'),text:root.querySelector('#editor-text'),parameters:root.querySelector('#editor-parameters')};
  const direction=el('select');direction.id='editor-direction';
  for(const p of presets)direction.append(new doc.defaultView.Option(p.name,p.id));
  const directionLabel=el('label','Dirección artística','editor-field');directionLabel.append(direction);panels.art.append(directionLabel);
  direction.addEventListener('change',()=>onSelect(direction.value));
  const paletteSelect=el('select');paletteSelect.id='editor-palette';
  paletteSelect.append(new doc.defaultView.Option('Colores actuales','custom'));
  for(const [key,p] of Object.entries(palettes))paletteSelect.append(new doc.defaultView.Option(p.name,key));
  const paletteLabel=el('label','Paleta','editor-field');paletteLabel.append(paletteSelect);panels.art.append(paletteLabel);
  const colors=el('div',null,'editor-colors');panels.art.append(colors);
  paletteSelect.addEventListener('change',()=>{
    if(paletteSelect.value==='custom')return;
    const draft=clone(active),palette=palettes[paletteSelect.value].colors;
    draft.palette=active.renderer==='triangle'?[palette[2],palette[4],palette[1],palette[0]]:
      active.palette.map((_,i)=>palette[Math.round(i*(palette.length-1)/(active.palette.length-1))]);
    apply(draft);sync();
  });
  const hint=el('p','Los cambios se conservan al cambiar de dirección. Descarga un JSON para guardar esta composición.','editor-hint');panels.art.append(hint);
  function apply(draft){try{active=onEdit(draft);report('Cambios aplicados.');return true;}catch(error){report(error.message,true);return false;}}
  function control(c,panel,text=false){
    const label=el('label',null,'editor-field');
    const heading=el('span',c.label,'editor-field-heading');label.append(heading);
    let input;
    if(c.type==='select') {input=el('select');for(const [value,title] of c.options)input.append(new doc.defaultView.Option(title,value));}
    else if(c.type==='textarea'){input=el('textarea');input.rows=3;input.maxLength=c.maxLength;}
    else {input=el('input');input.type=c.type;if(c.min!==undefined){input.min=c.min;input.max=c.max;input.step=c.step;}}
    input.id=`${text?'text':'param'}-${c.path.replaceAll('.','-')}`;
    const output=c.type==='range'?el('output'):null;if(output)heading.append(output);
    label.append(input);panel.append(label);
    const item={c,label,input,output,text};controls.push(item);
    input.addEventListener('input',()=>{
      const draft=clone(active),target=text?draft.text:draft;
      const value=c.type==='checkbox'?input.checked:['range','number'].includes(c.type)?Number(input.value):input.value;
      setPath(target,c.path,value);
      if(text&&c.path==='font'&&value==='Solea')draft.text.weight='400';
      apply(draft);syncValues();
    });
    return item;
  }
  for(const c of textControls)control(c,panels.text,true);
  const parameterFields=el('div');panels.parameters.append(parameterFields);
  const originalHint=el('p','La fotografía original no tiene parámetros de generación. Puedes editar su texto.','editor-hint');panels.parameters.append(originalHint);
  function syncValues(){
    for(const {c,label,input,output,text} of controls){
      const value=getPath(text?active.text:active,c.path);
      label.hidden=text?(!c.modes.includes(active.text.mode)||(c.path==='weight'&&active.text.font==='Solea')||(c.path==='y'&&active.text.vertical!=='custom')||(c.path==='align'&&active.text.mode!=='custom')):
        (c.path.startsWith('motion.')&&c.path!=='motion.enabled'&&!active.motion.enabled);
      if(c.type==='checkbox')input.checked=!!value;else input.value=value??'';
      if(output)output.value=String(value);
    }
    direction.value=active.id;
  }
  function sync(){
    active=getConfig();direction.value=active.id;paletteSelect.value='custom';
    paletteLabel.hidden=active.renderer==='original';colors.replaceChildren();
    active.palette.forEach((color,i)=>{
      const label=el('label',active.renderer==='triangle'?['Luz','Borde','Reflejo','Ambiente'][i]:i===0?'Fondo':`Color ${i}`,'editor-swatch');
      const input=el('input');input.type='color';input.id=`palette-${i}`;input.value=color;label.append(input);colors.append(label);
      input.addEventListener('input',()=>{const draft=clone(active);draft.palette[i]=input.value;apply(draft);paletteSelect.value='custom';});
    });
    for(let i=controls.length-1;i>=0;i--)if(!controls[i].text)controls.splice(i,1);
    parameterFields.replaceChildren();originalHint.hidden=active.renderer!=='original';
    for(const c of engineControls[active.renderer])control(c,parameterFields);
    if(active.renderer!=='original')control({path:'shade',label:'Oscurecer fondo',type:'range',min:0,max:.8,step:.01},parameterFields);
    syncValues();
    root.querySelector('#editor-current').textContent=active.name;
  }
  const tabs=[...root.querySelectorAll('[data-editor-tab]')];
  function showTab(name){
    tab=name;tabs.forEach(button=>{const selected=button.dataset.editorTab===name;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    for(const [key,panel] of Object.entries(panels))panel.hidden=key!==name;
  }
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>showTab(button.dataset.editorTab));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[next].click();tabs[next].focus();
    });
  });
  function setOpen(open){
    root.hidden=!open;doc.body.classList.toggle('editor-open',open);toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?'Cerrar editor':'Editar banner';
    if(open){sync();tabs.find(button=>button.dataset.editorTab===tab).focus();}else toggle.focus();
  }
  toggle.addEventListener('click',()=>setOpen(root.hidden));
  root.querySelector('#close-editor').addEventListener('click',()=>setOpen(false));
  const escape=event=>{if(event.key==='Escape'&&!root.hidden){event.preventDefault();setOpen(false);}};
  doc.addEventListener('keydown',escape);
  root.querySelector('#reset-banner').addEventListener('click',()=>{onReset();sync();report('Dirección restaurada, incluido el texto.');});
  root.querySelector('#download-banner').addEventListener('click',()=>{
    try{download(serializeConfig(active),`be-art-${active.id}.json`,doc);report('Configuración descargada.');}catch(error){report(error.message,true);}
  });
  const file=root.querySelector('#import-banner');
  root.querySelector('#load-banner').addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{
    const selected=file.files?.[0];if(!selected)return;
    try{
      if(selected.size>100000)throw new Error('El archivo es demasiado grande (máximo 100 KB).');
      const config=parseConfig(await selected.text());onSelect(config.id,config);sync();report('Configuración cargada.');
    }catch(error){report(error.message,true);}finally{file.value='';}
  });
  sync();showTab('art');
  return {sync,setOpen,report,dispose(){doc.removeEventListener('keydown',escape);}};
}
export function downloadConfig(source,name,doc=document){
  const url=URL.createObjectURL(new Blob([source],{type:'application/json'}));
  const link=doc.createElement('a');link.href=url;link.download=name;doc.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
