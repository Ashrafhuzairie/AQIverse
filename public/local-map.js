const finite=value=>typeof value==='number'&&Number.isFinite(value);
const coordinate=(value,min,max)=>Math.min(max,Math.max(min,Number(value)));
const radians=value=>value*Math.PI/180;

export function mapPoint(city,record={}){
 const reported=record?.source==='IQAir'&&finite(record?.location?.lat)&&finite(record?.location?.lon);
 return {lat:coordinate(reported?record.location.lat:city.lat,-85,85),lon:coordinate(reported?record.location.lon:city.lon,-180,180)};
}

export function distanceKm(a,b){
 const dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon),lat1=radians(a.lat),lat2=radians(b.lat);
 const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

export function detailMapView(city,record={}){
 const live=record?.source==='IQAir'&&finite(record?.location?.lat)&&finite(record?.location?.lon),{lat,lon}=mapPoint(city,record);
 const external=`https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=14/${lat.toFixed(6)}/${lon.toFixed(6)}`;
 const reported=record?.location?.city?.trim(),placeParts=[city.subdivision,city.country].filter((value,index,values)=>value&&values.findIndex(other=>other.toLowerCase()===value.toLowerCase())===index);
 const hasAqi=finite(record?.aqi),aqi=hasAqi?Math.round(record.aqi):null;
 const aqiLabel=hasAqi&&record?.label?record.label:'Not loaded',aqiSource=record?.source==='IQAir'?'IQAir observation':record?.source==='demo'?'Simulated reading':'AQI not loaded';
 return {
  lat,lon,external,
  title:live&&reported?reported:city.name,
  context:live?`IQAir reporting location for ${city.name}`:`Listed city centre · ${placeParts.join(', ')}`,
  aria:`Interactive detailed air quality map of ${live&&reported?`${reported}, reporting for ${city.name}`:city.name}`,
  aqi,aqiLabel,aqiSource,aqiColor:hasAqi&&record?.color?record.color:'#a5bacb',
  aqiAria:`${city.name}, US AQI ${hasAqi?aqi:'not loaded'}, ${aqiLabel}. ${aqiSource}.`
 };
}

export function coverageText(points,visible,mode){
 if(mode==='demo')return `Demo coverage · ${visible} of ${points.length} simulated city readings in view`;
 if(!points.length)return 'Live IQAir · no observations loaded yet';
 return `Live IQAir · ${visible} of ${points.length} loaded observations in view`;
}

export class LocalMap{
 constructor({root,canvas,title,context,status,external,close,aqi,aqiValue,aqiLabel,aqiSource,coverage,onSelect}){
  Object.assign(this,{root,canvas,title,context,status,external,close,aqi,aqiValue,aqiLabel,aqiSource,coverage,onSelect});
  this.cityId='';this.points=[];this.mode='live';this.map=null;this.markerLayer=null;
 }
 isOpen(){return !this.root.hidden;}
 ensureMap(){
  if(this.map)return true;
  const L=globalThis.L;
  if(!L){this.status.hidden=false;this.status.textContent='The interactive map library could not load. Open the location in OpenStreetMap instead.';return false;}
  this.map=L.map(this.canvas,{zoomControl:false,attributionControl:false,minZoom:2,maxZoom:19,worldCopyJump:true,preferCanvas:true});
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:2,maxZoom:19,maxNativeZoom:19});
  tiles.once('load',()=>{if(this.isOpen())this.status.hidden=true;});
  tiles.on('tileerror',()=>{if(this.isOpen()){this.status.hidden=false;this.status.textContent='Some map tiles could not load. Check the connection or open this location in OpenStreetMap.';}});
  tiles.addTo(this.map);L.control.zoom({position:'bottomleft'}).addTo(this.map);this.markerLayer=L.layerGroup().addTo(this.map);
  this.map.on('moveend zoomend',()=>this.updateCoverage());
  return true;
 }
 markerPoint(item){return mapPoint(item.city,item.record);}
 renderMarkers(selectedId){
  const L=globalThis.L;this.markerLayer.clearLayers();
  for(const item of this.points){
   if(!finite(item.record?.aqi))continue;
   const point=this.markerPoint(item),value=Math.round(item.record.aqi),selected=item.city.id===selectedId;
   const icon=L.divIcon({className:'detail-aqi-marker-shell',html:`<span class="detail-aqi-marker${selected?' selected':''}">${value}</span>`,iconSize:[42,42],iconAnchor:[21,21]});
   const marker=L.marker([point.lat,point.lon],{icon,keyboard:true,title:`${item.city.name}: US AQI ${value}`,zIndexOffset:selected?1000:0});
   const label=document.createElement('span');label.textContent=item.city.name;
   marker.bindTooltip(label,{permanent:selected,direction:'bottom',offset:[0,12],className:'detail-aqi-label',opacity:1});
   marker.on('add',()=>marker.getElement()?.style.setProperty('--marker-color',item.record.color||'#a5bacb'));
   marker.on('click',()=>this.onSelect?.(item.city.id));marker.addTo(this.markerLayer);
  }
 }
 focusArea(city,view){
  const centre={lat:view.lat,lon:view.lon};
  const nearby=this.points.map(item=>({item,point:this.markerPoint(item)})).filter(({item})=>finite(item.record?.aqi)).map(entry=>({...entry,distance:distanceKm(centre,entry.point)})).filter(entry=>entry.distance<=450).sort((a,b)=>a.distance-b.distance).slice(0,7);
  const mobile=globalThis.innerWidth<=760;
  if(nearby.length>1){this.map.fitBounds(nearby.map(entry=>[entry.point.lat,entry.point.lon]),{paddingTopLeft:mobile?[45,190]:[80,120],paddingBottomRight:mobile?[45,310]:[310,100],maxZoom:9,animate:false});}
  else this.map.setView([view.lat,view.lon],12,{animate:false});
  if(mobile)this.map.panBy([0,Math.min(155,this.canvas.clientHeight*.2)],{animate:false});
 }
 updateCoverage(){
  if(!this.map)return;const bounds=this.map.getBounds();
  const visible=this.points.filter(item=>finite(item.record?.aqi)&&bounds.contains(this.markerPoint(item))).length;
  this.coverage.textContent=coverageText(this.points.filter(item=>finite(item.record?.aqi)),visible,this.mode);
 }
 sync(city,record,points){if(this.isOpen())this.show(city,record,false,points);}
 show(city,record,focus=true,points=[]){
  const view=detailMapView(city,record),changed=this.cityId!==city.id;this.root.hidden=false;this.title.textContent=view.title;this.context.textContent=view.context;
  this.aqiValue.textContent=view.aqi??'—';this.aqiLabel.textContent=view.aqiLabel;this.aqiSource.textContent=view.aqiSource;this.aqi.style.setProperty('--map-aqi-color',view.aqiColor);this.aqi.setAttribute('aria-label',view.aqiAria);
  this.canvas.setAttribute('aria-label',view.aria);this.external.href=view.external;this.external.setAttribute('aria-label',`Open ${view.title} in OpenStreetMap (new tab)`);
  this.points=points;this.mode=record?.source==='demo'?'demo':'live';
  if(!this.map){this.status.hidden=false;this.status.textContent='Loading detailed map…';}
  if(this.ensureMap()){
   requestAnimationFrame(()=>{this.map.invalidateSize(false);this.renderMarkers(city.id);if(changed||!this.cityId)this.focusArea(city,view);this.updateCoverage();});
  }
  this.cityId=city.id;this.currentCity=city;this.currentView=view;this.mobileLayout=globalThis.innerWidth<=760;if(focus)this.close.focus({preventScroll:true});return view;
 }
 hide(focus=true){if(!this.isOpen())return;this.root.hidden=true;if(focus)document.getElementById('local-map-button')?.focus({preventScroll:true});}
 resize(){clearTimeout(this.resizeTimer);this.resizeTimer=setTimeout(()=>{if(!this.isOpen()||!this.map)return;const mobile=globalThis.innerWidth<=760,layoutChanged=mobile!==this.mobileLayout;this.map.invalidateSize(false);if(layoutChanged&&this.currentCity&&this.currentView)this.focusArea(this.currentCity,this.currentView);this.mobileLayout=mobile;},120);}
}
