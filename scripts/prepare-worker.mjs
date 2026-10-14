import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const assets={};
for(const name of (await readdir(path.join(root,'public'))).sort()){
 const type=types[path.extname(name)];if(!type)continue;
 const bytes=await readFile(path.join(root,'public',name));assets['/'+name]=path.extname(name)==='.png'?{type,base64:bytes.toString('base64')}:{type,content:bytes.toString('utf8')};
}
const {cities}=await import(pathToFileURL(path.join(root,'public/data.js')).href);
const lookup=Object.fromEntries(cities.map(c=>[c.id,{id:c.id,name:c.name,country:c.country,lat:c.lat,lon:c.lon}]));
const filename=path.join(root,'worker/index.js'),source=await readFile(filename,'utf8');
const start='/* ASSETS_START */',end='/* ASSETS_END */',a=source.indexOf(start),b=source.indexOf(end);
if(a<0||b<a)throw new Error('Worker asset markers are missing.');
await writeFile(filename,source.slice(0,a)+start+'\nconst ASSETS='+JSON.stringify(assets)+';\nconst CITY_LOOKUP='+JSON.stringify(lookup)+';\n'+source.slice(b));
console.log(`Embedded ${Object.keys(assets).length} local assets and ${cities.length} city locations.`);
