// The control schema is also the configuration validation contract.
const range=(path,label,min,max,step=.01)=>({path,label,type:'range',min,max,step});
const check=(path,label)=>({path,label,type:'checkbox'});
const select=(path,label,options)=>({path,label,type:'select',options});
export const engineControls={
  original:[],
  ellipses:[
    range('geometry.scale','Escala',.2,1),range('geometry.radiusX','Proporción horizontal',.15,.8),
    range('geometry.centerX','Centro horizontal',.15,.85),range('geometry.centerY','Centro vertical',.15,.85),
    range('geometry.rotation','Rotación',-90,90,1),range('geometry.margin','Margen',.02,.14),
    range('geometry.ring2','Segundo anillo',.1,.95),range('geometry.ring3','Tercer anillo',.08,.9),
    range('geometry.ring4','Cuarto anillo',.06,.85),range('geometry.core','Núcleo',.03,.8),
    range('geometry.softness','Suavidad',.001,.08,.001),range('geometry.irregularity','Irregularidad',0,.05,.001),
    range('light.exposure','Exposición',.3,2),range('light.coreGlow','Luz del núcleo',0,1),
    range('light.halo','Halo',0,1),range('light.bottomFalloff','Sombra inferior',0,.7),
    range('light.vignette','Viñeta',0,.5),range('light.grain','Grano',0,.08,.001),
    check('motion.enabled','Animar respiración'),range('motion.breathing','Amplitud',0,.08,.001),range('motion.speed','Velocidad',.02,.5)
  ],
  squares:[
    range('geometry.count','Número de cuadrados',2,8,1),range('geometry.scale','Escala',.3,1),
    range('geometry.ratio','Proporción sucesiva',.2,.95),range('geometry.ratioChange','Cambio de proporción',-.25,.25),
    range('geometry.offsetX','Desplazamiento horizontal',-.9,.9),range('geometry.offsetY','Desplazamiento vertical',-.9,.9),
    select('geometry.shape','Forma',[['square','Cuadrados'],['rectangle','Rectángulos']])
  ],
  triangle:[
    range('geometry.posX','Centro horizontal',.2,.8),range('geometry.posY','Posición vertical',.5,1),
    range('geometry.width','Anchura',.2,1.3),range('geometry.height','Altura',.2,1),
    range('geometry.apexLean','Inclinación del vértice',-.3,.3),range('geometry.roll','Rotación',-45,45,1),
    check('geometry.floorEnabled','Mostrar suelo'),range('light.intensity','Intensidad',.1,2),
    range('light.bloom','Resplandor',0,.5,.005),range('light.bloomRadius','Radio de luz',.3,2),
    range('light.spillStrength','Luz reflejada',0,2),range('light.ambient','Luz ambiental',0,2),range('light.exposure','Exposición',-2,2)
  ],
  moving:[
    range('geometry.count','Número de formas',2,60,1),range('geometry.breathing','Variación de las formas',0,1),
    check('motion.enabled','Animar composición'),range('motion.speed','Velocidad',.02,1),range('motion.initialTime','Composición inicial',0,60,.1),
    {...range('seed','Semilla',0,999999,1),type:'number'}
  ]
};
export const textControls=[
  select('mode','Contenido',[['logo','Logo BE ART'],['manifesto','NO SOMOS ESPECTADORES'],['custom','Texto personalizado'],['none','Sin texto']]),
  {path:'content',label:'Texto (admite varias líneas)',type:'textarea',maxLength:500,modes:['custom']},
  select('font','Tipografía',[['Solea','Solea'],['Poppins','Poppins']]),
  select('weight','Peso',[['200','Extra ligero'],['300','Ligero'],['400','Regular']]),
  range('size','Tamaño del texto (% del banner)',2,24,.1),range('lineHeight','Interlineado',.75,2),
  range('width','Anchura del bloque (%)',20,94,1),
  {path:'color',label:'Color del texto',type:'color'},
  select('align','Alineación',[['left','Izquierda'],['center','Centro'],['right','Derecha']]),
  select('vertical','Posición vertical',[['top','Arriba'],['center','Centrar bloque completo'],['bottom','Abajo'],['custom','Posición libre']]),
  range('x','Posición horizontal (%)',5,95,1),range('y','Posición vertical (%)',5,95,1)
].map(c=>({...c,modes:c.modes||(['font','weight','size','lineHeight'].includes(c.path)?['manifesto','custom']:c.path==='mode'?['logo','manifesto','custom','none']:['logo','manifesto','custom'])}));
export const palettes={
  azure:{name:'Azul · luz',colors:['#203a8f','#385dd3','#5c7add','#8095e3','#a3b4ec','#c8d3f3']},
  gold:{name:'Oro · luz',colors:['#a96f02','#dda844','#dcaf58','#dfbe7a','#e6d198','#ece3bc']},
  jade:{name:'Jade',colors:['#123f40','#226c69','#49948a','#7bb4a5','#aad4bc','#e1ecce']},
  rose:{name:'Rosa mineral',colors:['#512c4c','#89506b','#b67e8b','#d7a29f','#eac6b6','#f4e5cf']},
  earth:{name:'Tierra y ciruela',colors:['#3b324b','#705276','#ab7369','#c59167','#817454','#d9cbb0']},
  mono:{name:'Grafito',colors:['#202327','#484d54','#717983','#9ca4ac','#c7cdd1','#f0ede5']}
};
export const getPath=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
export function setPath(object,path,value){const parts=path.split('.'),key=parts.pop();let target=object;for(const part of parts)target=target[part];target[key]=value;}
