// Curated starting values for the real labs. No rendering or palette algorithms.
const ellipse={centerX:.5,centerY:.5,radiusX:.401,radiusY:.435,breathing:0,backgroundMode:'related'};
const text={eventCopyVariant:'logo',logoEffect:'solid-white',textLayout:'positioned',textWidth:62,textX:50,textY:50};
export const presets=[
 {id:'original',name:'Original',lab:'original',url:'./showcase/original.html?embed=1',text,
  description:'Retrato artístico de una figura con vestuario escultórico.'},
 {id:'ellipses',name:'Elipses azules',lab:'ellipse',url:'./turrell-ellipse-light/?embed=1',text,
  preset:{...ellipse,c1:'#385dd3',c2:'#5c7add',c3:'#8095e3',c4:'#a3b4ec',c5:'#c8d3f3'},
  description:'Elipses concéntricas de luz azul.'},
 {id:'ellipses-gold',name:'Elipses doradas',lab:'ellipse',url:'./turrell-ellipse-light/?embed=1',text,
  preset:{...ellipse,c1:'#dda844',c2:'#dcaf58',c3:'#dfbe7a',c4:'#e6d198',c5:'#ece3bc'},
  description:'Elipses concéntricas de luz dorada.'},
 {id:'squares',name:'Campos de color',lab:'canvas',url:'./canvas_light_columns_demo.html?embed=1',preset:'nestedStudy',text,
  description:'Cuadrados descentrados; todas las geometrías del estudio Canvas están disponibles.'},
 {id:'triangle',name:'Umbral azul',lab:'triangle',url:'./triangle-light/?embed=1',text,
  preset:{aspect:'viewport',posX:.5,posY:.92,width:.95,height:.86,apexLean:.01,roll:0,floorEnabled:false,
   coreColor:'#059aff',seamColor:'#25d4ef',spillColor:'#152aff',ambientColor:'#020723',
   intensity:.8,bloom:.075,bloomRadius:1.15,spillStrength:1.2,ambient:.8,exposure:-.25},
  description:'Un triángulo de luz azul suspendido en un campo oscuro.'},
 {id:'moving',name:'Composición viva',lab:'moving',url:'./moving_shapes/moving_shapes.html?embed=1',stateURL:'./showcase/compositions/moving.json',text,
  description:'Planos de color que se desplazan y transforman su composición.'},
 {id:'light',name:'Luz en la oscuridad',lab:'light',url:'./light/?embed=1',preset:{frame:'viewport'},text,
  description:'Un haz de luz con un halo óptico en la oscuridad; movimiento atmosférico opcional.'}
];
export function getPreset(id){return presets.find(preset=>preset.id===id)||presets[0];}
