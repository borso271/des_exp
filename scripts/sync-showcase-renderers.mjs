import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const between = (text, start, end) => {
  const a=text.indexOf(start), b=text.indexOf(end,a);
  if(a<0||b<0)throw new Error(`Extraction boundary missing: ${start}`);
  return text.slice(a,b);
};
const output = (file, code, source) => {
  const text=`// Derived from ${source}. Refresh with scripts/sync-showcase-renderers.mjs.\n// Rendering only; no prototype UI or application bootstrap.\n${code.trim()}\n`.replace(/[ \t]+$/gm,'');
  const destination=path.join(root,'showcase/vendor',file);
  if(process.argv.includes('--check')) {
    if(!fs.existsSync(destination)||read(`showcase/vendor/${file}`)!==text)throw new Error(`Stale renderer: ${file}`);
  } else fs.writeFileSync(destination,text);
};
const unwrap = text => text.replace(/^\(\(\) => \{\s*"use strict";\s*const root = window.LightColumns = window.LightColumns \|\| \{\};\s*/,'').replace(/\}\)\(\);\s*$/,'');
for(const [source,name,assignment,exports] of [
 ['geometry','geometry','geometry','describeColumn, profile, randomAt, trace'],
 ['nested-geometry','nested','nestedGeometry','build, trace'],
 ['moving-geometry','moving','movingGeometry','build, trace']
]){
 let text=unwrap(read(`js/light-columns/${source}.js`));
 text=text.slice(0,text.indexOf(`root.${assignment} =`));
 if(source==='moving-geometry')text="import {randomAt} from './geometry.js';\n"+text.replaceAll('root.geometry.randomAt','randomAt');
 output(`${name}.js`,`${text}\nexport {${exports}};`,`js/light-columns/${source}.js`);
}
const triangle=read('triangle-light/app.js');
const defaults=between(triangle,'const DEFAULTS = Object.freeze({','// key, label');
const linear=between(triangle,'function linearColor(hex)','const VERTEX_SHADER');
const palette=read('triangle-light/palette.js');
const tints=between(palette,'  function lightTints(','  window.TrianglePalette');
const reference=between(palette,'  const reference =','  const controlKeys');
const core=between(triangle,'const VERTEX_SHADER','const canvas=document.getElementById');
output('triangle.js',`${defaults}\n${linear}\n${reference}\n${tints}\n${core.replace('window.TrianglePalette.lightTints(p,linearColor)','lightTints(p,linearColor)')}\nexport {DEFAULTS, LightRenderer};`,'triangle-light/app.js and triangle-light/palette.js');
const ellipse=between(read('turrell-ellipse-light/app.js'),'  const VERT =','  function shader(');
output('ellipse-shaders.js',`${ellipse}\nexport {VERT, FRAG};`,'turrell-ellipse-light/app.js');
console.log(process.argv.includes('--check')?'Renderer snapshots match the prototypes.':'Updated presentation renderer snapshots.');
