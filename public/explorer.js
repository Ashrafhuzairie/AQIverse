import {cities,reading,clamp} from './data.js';
const validIds=new Set(cities.map(c=>c.id));
export const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function filterCities({query='',region='All',savedOnly=false,saved=[],sort='highest',hour=12}={}){
 const q=normalize(query),ids=new Set(saved);
 return cities.filter(c=>(region==='All'||c.region===region)&&(!savedOnly||ids.has(c.id))&&(!q||normalize(c.name+' '+c.country+' '+c.code).includes(q))).sort((a,b)=>{
  if(sort==='name')return a.name.localeCompare(b.name);const x=reading(a,hour).aqi,y=reading(b,hour).aqi;
  if(!Number.isFinite(x)&&!Number.isFinite(y))return a.name.localeCompare(b.name);if(!Number.isFinite(x))return 1;if(!Number.isFinite(y))return -1;
  return sort==='lowest'?x-y:y-x;
 });
}
export function distanceKm(lat1,lon1,lat2,lon2){
 const rad=v=>v*Math.PI/180,a=rad(lat2-lat1),b=rad(lon2-lon1);
 const h=Math.sin(a/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(b/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function nearestCity(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 return cities.map(city=>({city,distance:distanceKm(lat,lon,city.lat,city.lon)})).sort((a,b)=>a.distance-b.distance)[0];
}
export function loadPreferences(storage){
 try{const data=JSON.parse(storage.getItem('aqiverse.preferences.v1')||'{}');return {selected:validIds.has(data.selected)?data.selected:'singapore',dataMode:['live','demo'].includes(data.dataMode)?data.dataMode:'live',metric:['aqi','pm','temp'].includes(data.metric)?data.metric:'aqi',saved:Array.isArray(data.saved)?[...new Set(data.saved.filter(id=>validIds.has(id)))]:[],heat:typeof data.heat==='boolean'?data.heat:true,grid:typeof data.grid==='boolean'?data.grid:true,labels:typeof data.labels==='boolean'?data.labels:true,speed:[.5,1,2].includes(data.speed)?data.speed:1};}catch{return {selected:'singapore',metric:'aqi',saved:[],heat:true,grid:true,labels:true,speed:1};}
}
export function savePreferences(storage,data){try{storage.setItem('aqiverse.preferences.v1',JSON.stringify(data));return true;}catch{return false;}}
