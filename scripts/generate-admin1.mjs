import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const SOURCE='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const round=value=>Math.round(value*100)/100;

function compactRing(ring){
 const points=[];
 for(const coordinate of ring){
  const point=[round(coordinate[0]),round(coordinate[1])],previous=points.at(-1);
  if(!previous||Math.hypot(point[0]-previous[0],point[1]-previous[1])>=.12)points.push(point);
 }
 const last=[round(ring.at(-1)[0]),round(ring.at(-1)[1])];
 if(points.length&&points.at(-1).some((value,index)=>value!==last[index]))points.push(last);
 return points.length>=3?points:[];
}

function outerRings(geometry){
 if(geometry.type==='Polygon')return geometry.coordinates.slice(0,1);
 if(geometry.type==='MultiPolygon')return geometry.coordinates.map(polygon=>polygon[0]);
 return [];
}

const response=await fetch(SOURCE);
if(!response.ok)throw new Error(`Natural Earth download failed: ${response.status}`);
const collection=await response.json(),lines=[],places=[];
for(const feature of collection.features){
 const properties=feature.properties;
 for(const ring of outerRings(feature.geometry)){
  const compact=compactRing(ring);
  if(compact.length)lines.push(compact);
 }
 const lat=Number(properties.latitude),lon=Number(properties.longitude);
 if(Number.isFinite(lat)&&Number.isFinite(lon))places.push({
  name:properties.name_en||properties.name,
  country:properties.admin,
  code:properties.iso_3166_2||properties.adm1_code,
  type:properties.type_en||'State / province',
  lat:round(lat),lon:round(lon),
  rank:Number(properties.labelrank)||5,
  minZoom:Number(properties.min_zoom)||3
 });
}
places.sort((a,b)=>a.country.localeCompare(b.country)||a.name.localeCompare(b.name));
const output={source:'Natural Earth 1:50m Admin-1, public domain',lines,places};
const target=path.join(root,'public','admin1.json');
await writeFile(target,JSON.stringify(output));
console.log(`Wrote ${lines.length} boundary rings and ${places.length} state/province labels to ${target}.`);
