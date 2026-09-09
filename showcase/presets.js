// Named, repeatable compositions. The owners choose a direction, not parameters.
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
export const presets = freeze([
  {id:'original', name:'Original', renderer:'original', seed:0, palette:[], geometry:{},
    motion:{enabled:false, speed:0}, shade:0,
    description:'Retrato artístico de una figura con vestuario escultórico.'},
  {id:'ellipses', name:'Elipses azules', renderer:'image', seed:2107,
    image:'./assets/ellipse-light-2400x1286.png',palette:[],geometry:{},
    motion:{enabled:false,speed:0},shade:0,
    description:'Elipses concéntricas de luz azul, en una composición estática.'},
  {id:'squares', name:'Campos de color', renderer:'squares', seed:271,
    palette:['#3b324b','#705276','#ab7369','#c59167','#817454'],
    geometry:{count:4,scale:.97,ratio:.78,ratioChange:-.065,offsetX:-.08,offsetY:.45,shape:'square'},
    motion:{enabled:false,speed:0},shade:.28,
    description:'Cuadrados descentrados en tonos ciruela, terracota y ocre.'},
  {id:'triangle', name:'Umbral azul', renderer:'triangle', seed:271,
    palette:['#059aff','#25d4ef','#152aff','#020723'],
    geometry:{posX:.5,posY:.92,width:.95,height:.86,apexLean:.01,roll:0,floorEnabled:false},
    light:{intensity:.80,bloom:.075,bloomRadius:1.15,spillStrength:1.2,ambient:.8,exposure:-.25},
    motion:{enabled:false,speed:0},shade:.16,
    description:'Un triángulo de luz azul suspendido en un campo oscuro.'},
  {id:'moving', name:'Composición viva', renderer:'moving', seed:271,
    palette:['#275552','#c56748','#493d63','#b38f43','#864c62','#33536c'],
    geometry:{count:12,breathing:.45},motion:{enabled:true,speed:.40,initialTime:7},shade:.24,
    description:'Planos de color que se desplazan lentamente y transforman su composición.'}
]);
export function getPreset(id) { return presets.find(preset => preset.id === id) || presets[0]; }
