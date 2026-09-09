import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {presets} from '../showcase/presets.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),destination=path.join(root,'_site');
const entries=['index.html','canvas_light_columns_demo.html','logo_be_arts.svg','fonts/solea-regular.ttf',
 'showcase/app.js','showcase/config.js','showcase/lab-host.js','showcase/presets.js','showcase/original.html',
 'showcase/assets','showcase/styles','showcase/compositions',
 'js/shared','js/light-columns','turrell-ellipse-light','triangle-light','moving_shapes'];
const extensions=new Set(['.html','.css','.js','.svg','.webp','.png','.ttf','.txt','.json']);
fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(destination,{recursive:true});
const files=[];
function copy(relative){
 const source=path.join(root,relative),stat=fs.lstatSync(source);
 if(stat.isSymbolicLink())throw new Error(`Symlink cannot be published: ${relative}`);
 if(stat.isDirectory()){for(const name of fs.readdirSync(source))copy(path.join(relative,name));return;}
 if(!extensions.has(path.extname(relative)))return;
 const target=path.join(destination,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);files.push(relative);
}
entries.forEach(copy);
function verifyReference(from,url){
 if(url.startsWith('data:')||url.startsWith('#'))return;
 if(/^(?:https?:)?\/\//.test(url))throw new Error(`External runtime asset: ${from}: ${url}`);
 if(url.startsWith('/'))throw new Error(`Root-relative asset breaks repository Pages: ${from}: ${url}`);
 const target=path.resolve(destination,path.dirname(from),url.split(/[?#]/)[0]);
 if(!target.startsWith(destination+path.sep)||!fs.existsSync(target))throw new Error(`Missing runtime asset: ${from}: ${url}`);
}
for(const file of files){
 if(!['.html','.css','.js','.svg'].includes(path.extname(file)))continue;
 const text=fs.readFileSync(path.join(destination,file),'utf8');
 if(file.endsWith('.html')){
  for(const match of text.matchAll(/<(?:script|img|source|link)\b[^>]*\b(?:src|srcset|href)="([^"]+)"/g))verifyReference(file,match[1]);
  if(/_next\/|__next|localhost|127\.0\.0\.1/.test(text))throw new Error(`Development dependency in ${file}`);
 }
 if(file.endsWith('.css')||file.endsWith('.svg')||file.endsWith('.html'))for(const match of text.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g))verifyReference(file,match[1]);
 if(file.endsWith('.js'))for(const match of text.matchAll(/(?:from\s*|import\s*\()["']([^"']+)["']/g))verifyReference(file,match[1]);
}
for(const preset of presets){verifyReference('index.html',preset.url);if(preset.stateURL)verifyReference('index.html',preset.stateURL);}
// These URLs are intentionally resolved dynamically by the small embedding bridge.
for(const file of ['js/shared/lab-embed.js','js/shared/lab-embed.css','js/shared/poster-text.js','js/shared/poster-text.css','canvas_light_columns_demo.html'])verifyReference('index.html',file);
fs.writeFileSync(path.join(destination,'.nojekyll'),'');
const bytes=files.reduce((sum,file)=>sum+fs.statSync(path.join(destination,file)).size,0);
console.log(`Pages artifact: ${files.length+1} files, ${(bytes/1024/1024).toFixed(2)} MiB; actual labs and local runtime paths verified.`);
