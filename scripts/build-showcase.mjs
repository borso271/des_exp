import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {presets} from '../showcase/presets.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(root,'_site');
const publicFolders=['assets','styles','renderers','vendor'];
const publicModules=['app.js','controller.js','presets.js','schema.js','config.js','text-layer.js','editor.js','fallback.js'];
const allowedExtensions=new Set(['.css','.js','.svg','.webp','.png','.ttf','.txt']);
fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(destination,{recursive:true});
const files=[];
function copy(source,relative) {
  const stat=fs.lstatSync(source);
  if(stat.isSymbolicLink())throw new Error(`Symlink cannot be published: ${relative}`);
  if(stat.isDirectory()){
    for(const entry of fs.readdirSync(source))copy(path.join(source,entry),path.join(relative,entry));
  }else{
    if(relative!=='index.html'&&!allowedExtensions.has(path.extname(relative)))throw new Error(`Unexpected public file: ${relative}`);
    const target=path.join(destination,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);files.push(relative);
  }
}
copy(path.join(root,'index.html'),'index.html');
for(const folder of publicFolders)copy(path.join(root,'showcase',folder),`showcase/${folder}`);
for(const file of publicModules)copy(path.join(root,'showcase',file),`showcase/${file}`);
function verifyReference(from,url) {
  if(url.startsWith('data:')||url.startsWith('#'))return;
  if(/^(?:https?:)?\/\//.test(url))throw new Error(`External asset: ${from}: ${url}`);
  if(url.startsWith('/'))throw new Error(`Root-relative asset will break on Pages: ${from}: ${url}`);
  const target=path.resolve(destination,path.dirname(from),url.split(/[?#]/)[0]);
  if(!target.startsWith(destination+path.sep)||!fs.existsSync(target))throw new Error(`Missing asset: ${from}: ${url}`);
}
for(const file of files){
  if(!['.html','.css','.js','.svg'].includes(path.extname(file)))continue;
  const text=fs.readFileSync(path.join(destination,file),'utf8');
  if(file.endsWith('.html')) {
    for(const match of text.matchAll(/<(?:script|img|source|link)\b[^>]*\b(?:src|srcset|href)="([^"]+)"/g))verifyReference(file,match[1]);
    if(/<iframe|<form|_next\/|__next|localhost|127\.0\.0\.1/.test(text))throw new Error('Non-presentation content in index.html');
  }
  if(file.endsWith('.css')||file.endsWith('.svg'))for(const match of text.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g))verifyReference(file,match[1]);
  if(file.endsWith('.js'))for(const match of text.matchAll(/(?:from\s*|import\s*\()["']([^"']+)["']/g))verifyReference(file,match[1]);
}
for(const preset of presets.filter(p=>p.renderer!=='original')){
  if(preset.renderer==='image') {verifyReference('showcase/presets.js',preset.image);continue;}
  if(!fs.existsSync(path.join(destination,`showcase/assets/fallback-${preset.id}.svg`)))throw new Error(`Missing fallback: ${preset.id}`);
}
fs.writeFileSync(path.join(destination,'.nojekyll'),'');
const bytes=files.reduce((sum,file)=>sum+fs.statSync(path.join(destination,file)).size,0);
console.log(`Pages artifact: ${files.length+1} files, ${(bytes/1024/1024).toFixed(2)} MiB. All asset paths verified.`);
