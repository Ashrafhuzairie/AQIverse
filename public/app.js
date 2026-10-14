import {cities,reading,clamp,categories,setReadingMode,setLiveReading,getLiveReading} from './data.js';
import {Globe,MIN_ZOOM,MAX_ZOOM} from './globe.js';
import {filterCities,nearestCity,loadPreferences,savePreferences,normalize} from './explorer.js';
import {LocalMap} from './local-map.js';

const $=id=>document.getElementById(id);
let storage=null;
try{storage=window.localStorage;}catch{}
const preferences=loadPreferences(storage),saved=new Set(preferences.saved);
const initial=cities.find(c=>c.id===preferences.selected);
const state={lon:initial.id==='singapore'?98:initial.lon,lat:initial.id==='singapore'?16:initial.lat,zoom:1,selected:initial.id,hour:12,rotating:false,dataMode:preferences.dataMode||'live',heat:preferences.heat,grid:preferences.grid,labels:preferences.labels,metric:preferences.metric,playing:false,speed:preferences.speed};
setReadingMode(state.dataMode);
let liveTimer,liveRequest,liveSequence=0,liveBusy=false,apiConfigured=null;
let query='',region='All',sort='highest',savedOnly=false,playAccumulator=0,rows=new Map(),toastTimer,placeIndex=[],searchResults=[],activePlaceIndex=-1,detailScrollY=0,detailZoomArmed=true;
const number=new Intl.NumberFormat('en',{maximumFractionDigits:1,minimumFractionDigits:1});
const selectedCity=()=>cities.find(c=>c.id===state.selected);
const detailedPoints=()=>cities.map(city=>({city,record:reading(city,state.hour)})).filter(item=>Number.isFinite(item.record.aqi));
const persist=()=>savePreferences(storage,{selected:state.selected,dataMode:state.dataMode,metric:state.metric,saved:[...saved],heat:state.heat,grid:state.grid,labels:state.labels,speed:state.speed});
function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},3200);}
function updateRotation(){const b=$('rotation-button');b.classList.toggle('active',state.rotating);b.setAttribute('aria-pressed',String(state.rotating));b.setAttribute('aria-label',state.rotating?'Pause globe rotation':'Start globe rotation');b.title=state.rotating?'Pause rotation':'Rotate globe';}
function updateZoom(zoom){
 const atMaximum=zoom>=MAX_ZOOM-.001;
 $('zoom-level').value=`${Math.round(zoom*100)}%`;$('zoom-in').disabled=atMaximum;$('zoom-out').disabled=zoom<=MIN_ZOOM+.001;
 if(zoom<MAX_ZOOM-.05)detailZoomArmed=true;
 if(atMaximum&&detailZoomArmed){detailZoomArmed=false;queueMicrotask(()=>{if(!localMap.isOpen()){notify(`1000% reached · opening streets and districts for ${selectedCity().name}`);openLocalMap();}});}
}
const globe=new Globe({canvas:$('earth'),effects:$('effects'),markers:$('markers'),atmosphere:$('atmosphere'),state,onRotate:updateRotation,onZoom:updateZoom,onFrame:dt=>{if(!state.playing)return;playAccumulator+=dt*state.speed;if(playAccumulator>=1.2){playAccumulator=0;setHour((state.hour+1)%24);}}});
const localMap=new LocalMap({root:$('local-map'),canvas:$('local-map-canvas'),title:$('local-map-title'),context:$('local-map-context'),status:$('local-map-status'),external:$('local-map-external'),close:$('local-map-close'),aqi:$('local-map-aqi'),aqiValue:$('local-map-aqi-value'),aqiLabel:$('local-map-aqi-label'),aqiSource:$('local-map-aqi-source'),coverage:$('local-map-coverage'),onSelect:id=>selectCity(id,false)});

function openLocalMap(){
 const c=selectedCity(),r=reading(c,state.hour);detailScrollY=scrollY;setPlaying(false);state.rotating=false;updateRotation();globe.setActive(false);
 $('app').classList.add('map-detail-mode');$('stage').classList.add('local-mode');$('stage').setAttribute('aria-label',`Detailed street map of ${c.name}`);$('local-map-button').setAttribute('aria-pressed','true');localMap.show(c,r,true,detailedPoints());scrollTo(0,0);
}
function closeLocalMap(focus=true){
 if(!localMap.isOpen())return;localMap.hide(focus);$('app').classList.remove('map-detail-mode');$('stage').classList.remove('local-mode');$('stage').setAttribute('aria-label','Interactive 3D air quality globe');$('local-map-button').setAttribute('aria-pressed','false');
 requestAnimationFrame(()=>scrollTo(0,detailScrollY));
 globe.setActive(true);globe.measure();globe.refresh();
}

function setSidebar(open,restore=true){
 const mobile=innerWidth<=760;open=Boolean(open&&mobile);
 $('sidebar').classList.toggle('open',open);$('sidebar-backdrop').hidden=!open;
 $('menu-button').setAttribute('aria-expanded',String(open));$('menu-button').setAttribute('aria-label',open?'Close city explorer':'Open city explorer');$('stage').inert=open;
 if(open)$('city-search').focus({preventScroll:true});else if(restore&&mobile)$('menu-button').focus({preventScroll:true});
}
function selectCity(id,focus=true){
 if(!cities.some(c=>c.id===id))return;state.selected=id;
 if(focus&&!localMap.isOpen()){globe.focus(selectedCity());updateRotation();}
 updateSelected();updateRows();persist();globe.measure();globe.refresh();if(state.dataMode==='live')queueLiveCity(id);
 if(innerWidth<=760&&$('sidebar').classList.contains('open')){setSidebar(false,false);(localMap.isOpen()?$('local-map-close'):$('earth')).focus({preventScroll:true});}
}
function updateSaved(){
 const chosen=saved.has(state.selected),button=$('save-city');button.classList.toggle('saved',chosen);button.setAttribute('aria-pressed',String(chosen));button.setAttribute('aria-label',`${chosen?'Unsave':'Save'} ${selectedCity().name}`);button.title=chosen?'Remove from saved cities':'Save city';$('saved-count').textContent=saved.size;
}
function updateRows(){
 for(const [id,row] of rows){const c=cities.find(c=>c.id===id),r=reading(c,state.hour);row.classList.toggle('selected',id===state.selected);row.setAttribute('aria-pressed',String(id===state.selected));row.style.setProperty('--row-color',r.color);row.querySelector('.row-number').textContent=r.aqi??'—';row.setAttribute('aria-label',`${c.name}, ${c.country}. ${r.source==='IQAir'?'IQAir observation':r.source==='demo'?'Simulated reading':'Select to load IQAir data'}, US AQI ${r.aqi??'not loaded'}, ${r.label}.${saved.has(id)?' Saved.':''}`);}
}
function placeScore(place,q){const name=normalize(place.name),context=normalize(`${place.subdivision||''} ${place.country||''} ${place.code||''}`);if(name===q)return 0;if(name.startsWith(q))return 1;if(name.includes(q))return 2;if(context.includes(q))return 3;return 99;}
function matchingPlaces(){const q=normalize(query);if(q.length<2)return [];const cityPlaces=cities.map(city=>({kind:'city',...city,zoom:2.9})),order={country:0,subdivision:1,city:2};return [...placeIndex,...cityPlaces].map(place=>({place,score:placeScore(place,q)})).filter(item=>item.score<99).sort((a,b)=>a.score-b.score||order[a.place.kind]-order[b.place.kind]||a.place.name.localeCompare(b.place.name)).slice(0,9).map(item=>item.place);}
function setActivePlace(index){activePlaceIndex=index;const options=[...$('place-results').querySelectorAll('[role="option"]')];options.forEach((option,i)=>{option.classList.toggle('active',i===index);option.setAttribute('aria-selected',String(i===index));});if(index>=0)$('city-search').setAttribute('aria-activedescendant',options[index]?.id||'');else $('city-search').removeAttribute('aria-activedescendant');}
function renderPlaceResults(){const list=$('place-results');searchResults=matchingPlaces();activePlaceIndex=-1;list.replaceChildren();const open=query.length>=2&&searchResults.length>0;list.hidden=!open;$('city-search').setAttribute('aria-expanded',String(open));$('city-search').removeAttribute('aria-activedescendant');if(!open)return;searchResults.forEach((place,index)=>{const button=document.createElement('button');button.type='button';button.className='place-result';button.id=`place-option-${index}`;button.dataset.index=index;button.setAttribute('role','option');button.setAttribute('aria-selected','false');const badge=document.createElement('span');badge.className='place-kind';badge.textContent=place.kind==='country'?'COUNTRY':place.kind==='subdivision'?(place.type||'STATE'):'CITY';const copy=document.createElement('span');copy.className='place-copy';const name=document.createElement('strong');name.textContent=place.name;const trail=document.createElement('small');trail.textContent=place.kind==='country'?'Zoom to country':place.kind==='subdivision'?place.country:`${place.subdivision} · ${place.country}`;copy.append(name,trail);button.append(badge,copy);list.append(button);});}
function choosePlace(index){const place=searchResults[index];if(!place)return;query='';$('city-search').value='';renderList();renderPlaceResults();if(place.kind==='city'){selectCity(place.id);return;}closeLocalMap(false);globe.focusPlace(place,place.zoom);updateRotation();notify(`${place.name}${place.kind==='subdivision'?' · '+place.country:''}`);if(innerWidth<=760&&$('sidebar').classList.contains('open')){setSidebar(false,false);$('earth').focus({preventScroll:true});}}
function renderList(){
 const list=$('city-list');list.replaceChildren();rows=new Map();
 const visible=filterCities({query,region,savedOnly,saved:[...saved],sort,hour:state.hour});
 $('city-count').textContent=`${visible.length} ${visible.length===1?'city':'cities'}${savedOnly?' saved':''}`;
 $('clear-search').hidden=!query;$('all-cities-tab').classList.toggle('active',!savedOnly);$('saved-cities-tab').classList.toggle('active',savedOnly);$('all-cities-tab').setAttribute('aria-pressed',String(!savedOnly));$('saved-cities-tab').setAttribute('aria-pressed',String(savedOnly));
 if(!visible.length){const empty=document.createElement('div');empty.className='empty-list';empty.innerHTML=savedOnly&&!saved.size?'<span class="empty-star" aria-hidden="true">☆</span><strong>Your favourites, in one place.</strong><p>Use the star in a city’s location card to save it here.</p>':'<strong>No cities found.</strong><p>Try a different city, country, or region.</p>';const clear=document.createElement('button');clear.className='empty-action';clear.textContent=savedOnly&&!saved.size?'Explore all cities':'Clear filters';clear.addEventListener('click',clearFilters);empty.append(clear);list.append(empty);return;}
 for(const c of visible){const b=document.createElement('button');b.type='button';b.className='city-row';b.innerHTML=`<span class="country-code">${c.code}</span><span class="city-copy"><strong>${c.name}${saved.has(c.id)?'<span class="row-saved" aria-label="Saved">★</span>':''}</strong><small>${c.subdivision} · ${c.country}</small></span><span class="row-reading"><span class="row-number"></span><i></i></span>`;b.addEventListener('click',()=>selectCity(c.id));list.append(b);rows.set(c.id,b);}updateRows();
}
function clearFilters(){query='';region='All';savedOnly=false;$('city-search').value='';$('region-select').value='All';renderList();renderPlaceResults();}
function updateSelected(){
 const c=selectedCity(),r=reading(c,state.hour);document.documentElement.style.setProperty('--city-color',r.color);
 $('selected-name').textContent=c.name;$('selected-country').textContent=c.country;$('selected-coordinates').textContent=`${Math.abs(c.lat).toFixed(2)}° ${c.lat>=0?'N':'S'}, ${Math.abs(c.lon).toFixed(2)}° ${c.lon>=0?'E':'W'}`;$('selected-aqi').textContent=r.aqi??'—';$('selected-status').textContent=r.aqi===null?(liveBusy?'Loading…':'Not loaded'):r.label;$('selected-pm').textContent=r.pm===null?'—':number.format(r.pm);$('selected-temp').textContent=r.temp??'—';$('selected-humidity').textContent=r.humidity??'—';$('aqi-indicator').hidden=!Number.isFinite(r.aqi);$('reading-source').textContent=r.source==='IQAir'?'LIVE OBSERVATION · IQAIR':r.source==='demo'?'SIMULATED READING':'SELECT A CITY TO LOAD';$('data-note').hidden=!(r.source==='IQAir'&&r.pm===null);$('data-note').textContent='PM2.5 concentration is not included in this API response.';const reporting=$('reporting-location');reporting.hidden=r.source!=='IQAir'||!r.location?.city||r.location.city.toLowerCase()===c.name.toLowerCase();reporting.textContent=r.location?.city?'Reporting location: '+r.location.city+(r.location.country?' · '+r.location.country:''):'';
 const bands=[[0,50],[51,100],[101,150],[151,200],[201,300],[301,500]],index=Math.max(0,bands.findIndex(b=>r.aqi<=b[1])<0?bands.length-1:bands.findIndex(b=>r.aqi<=b[1])),band=bands[index];$('aqi-indicator').style.left=clamp((index+(r.aqi-band[0])/(band[1]-band[0]))/6*100,0,99)+'%';
 $('iqair-city-link').href='https://www.iqair.com/sg/'+c.iqairPath;updateSaved();renderChart(c,r);
 $('local-map-button').setAttribute('aria-label',`${localMap.isOpen()?'Detailed map open for':'Open detailed map of'} ${c.name}`);$('local-map-button').title=`Open detailed street map of ${c.name}`;localMap.sync(c,r,detailedPoints());
}
function renderChart(c,r){
 const svg=$('trend-chart');svg.closest('.trend').hidden=state.dataMode==='live';if(state.dataMode==='live')return;const series=Array.from({length:24},(_,h)=>reading(c,h).aqi),min=Math.max(0,Math.min(...series)-8),max=Math.max(...series)+8,px=h=>6+h/23*238,py=n=>62-(n-min)/(max-min)*53;
 const path=series.map((n,h)=>`${h?'L':'M'}${px(h).toFixed(2)},${py(n).toFixed(2)}`).join(' '),area=path+' L244,68 L6,68 Z';
 svg.innerHTML=`<defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${r.color}" stop-opacity=".2"/><stop offset="100%" stop-color="${r.color}" stop-opacity="0"/></linearGradient></defs><path d="M6 20H244M6 44H244M6 68H244" stroke="#ffffff10" stroke-width=".7"/><path d="${area}" fill="url(#chart-fill)" stroke="none"/><path d="${path}" fill="none" stroke="${r.color}" stroke-width="1.5"/><path d="M${px(state.hour)} 6V68" stroke="${r.color}" stroke-opacity=".3" stroke-dasharray="2 3"/><circle cx="${px(state.hour)}" cy="${py(series[state.hour])}" r="3" fill="${r.color}" stroke="#152128" stroke-width="1.5"/>`;
 svg.setAttribute('aria-label',`Simulated 24-hour US AQI for ${c.name}; ${Math.min(...series)} to ${Math.max(...series)}. Selected hour ${state.hour}:00, AQI ${r.aqi}.`);
}
function setHour(value){
 state.hour=clamp(Math.round(Number(value)),0,23);$('time-slider').value=state.hour;$('time-label').innerHTML=`${String(state.hour).padStart(2,'0')}:00 <small>UTC</small>`;$('time-slider').setAttribute('aria-valuetext',`${state.hour}:00 UTC, simulated`);$('time-slider').style.background=`linear-gradient(90deg,var(--mint) 0% ${state.hour/23*100}%,#93bde740 ${state.hour/23*100}% 100%)`;updateSelected();updateRows();
 const list=$('city-list'),scroll=list.scrollTop;if(!list.contains(document.activeElement)){filterCities({query,region,savedOnly,saved:[...saved],sort,hour:state.hour}).forEach(c=>{const row=rows.get(c.id);if(row)list.append(row);});list.scrollTop=scroll;}
 globe.refresh();
}
function setPlaying(playing){if(state.dataMode!=='demo')playing=false;state.playing=playing;playAccumulator=0;const b=$('play-button');b.setAttribute('aria-pressed',String(playing));b.setAttribute('aria-label',playing?'Pause simulated day':'Play simulated day');b.innerHTML=playing?'<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24"><path d="m9 5 10 7-10 7z"/></svg>';}
function renderLegend(){
 const legends={aqi:{title:'US AQI',direction:'LOW → HIGH',values:['0','50','100','150','200','300+'],note:state.dataMode==='live'?'Loaded city readings; halos are illustrative.':'Sample pollution halos; not measured coverage.'},pm:{title:'PM2.5 · µg/m³',direction:'LOW → HIGH',values:['0','9','35.4','55.4','125.4','225.4+'],note:'PM2.5 colours follow the US AQI categories.'},temp:{title:'TEMPERATURE · °C',direction:'COOL → WARM',values:['−10','0','10','20','30+'],note:state.dataMode==='live'?'Weather for loaded cities; not global coverage.':'Sample temperatures; not a measured weather map.'}};
 const l=legends[state.metric],colours=state.metric==='temp'?['#82b9d4','#99d2ba','#d2dd9b','#edcb87','#eb986d']:categories.map(c=>c.color);
 $('legend').innerHTML=`<div class="legend-title">${l.title}<span>${l.direction}</span></div><div class="legend-bar">${colours.map(c=>`<i style="background:${c}"></i>`).join('')}</div><div class="legend-values">${l.values.map(v=>`<span>${v}</span>`).join('')}</div><span class="legend-note">${l.note}</span>`;$('heat-toggle').parentElement.lastChild.textContent=state.metric==='temp'?'Temperature halos':'Pollution halos';
}

function setDataMode(mode,load=true){
 state.dataMode=mode==='demo'?'demo':'live';setReadingMode(state.dataMode);setPlaying(false);clearTimeout(liveTimer);liveRequest?.abort();liveBusy=false;
 $('data-mode-select').value=state.dataMode;$('timeline').hidden=state.dataMode==='live';$('live-status-bar').hidden=state.dataMode!=='live';
 $('demo-info').innerHTML=state.dataMode==='live'?'<i></i> LIVE CITY <span aria-hidden="true">ⓘ</span>':'<i></i> DEMO MODE <span aria-hidden="true">ⓘ</span>';$('demo-info').classList.toggle('live',state.dataMode==='live');
 $('footer-about').textContent=state.dataMode==='live'?'IQAir city observations · Unloaded cities show —':'Simulated readings · Demo day';
 renderList();updateSelected();renderLegend();persist();globe.refresh();if(load&&state.dataMode==='live')queueLiveCity(state.selected);
}
function describeObservation(record){
 if(!record?.observedAt)return 'Observation timestamp not provided by IQAir.';
 const date=new Date(record.observedAt),format=new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'});
 const old=Date.now()-date.getTime()>6*3600*1000;return `Observed ${format.format(date)}${old?' · Older observation':''}. Cached requests reduce API use.`;
}
function queueLiveCity(id){clearTimeout(liveTimer);liveBusy=true;$('live-status').textContent='Loading IQAir observation…';updateSelected();liveTimer=setTimeout(()=>loadLiveCity(id),350);}
async function loadLiveCity(id,refresh=false){
 clearTimeout(liveTimer);const sequence=++liveSequence;liveRequest?.abort();liveRequest=new AbortController();$('refresh-live').disabled=false;
 const previous=getLiveReading(id);
 if(previous&&!refresh&&Date.now()-Date.parse(previous.fetchedAt)<1800000){liveBusy=false;$('live-status').textContent=describeObservation(previous);updateSelected();globe.refresh();return;}
 if(apiConfigured===false){liveBusy=false;$('live-status').textContent='IQAir is not configured for this deployment. Demo day is available.';updateSelected();return;}
 liveBusy=true;$('refresh-live').disabled=true;updateSelected();
 try{
  const response=await fetch('/api/air-quality?city='+encodeURIComponent(id),{signal:liveRequest.signal,headers:{Accept:'application/json'}}),payload=await response.json();
  if(!response.ok||payload.status!=='success'||!Number.isFinite(payload.record?.aqi))throw new Error(payload.message||'IQAir data is unavailable for this city.');
  setLiveReading(id,payload.record);
  if(sequence!==liveSequence||state.dataMode!=='live'||state.selected!==id)return;
  liveBusy=false;$('live-status').textContent=describeObservation(payload.record);renderList();updateSelected();globe.measure();globe.refresh();
 }catch(error){if(error.name==='AbortError'||sequence!==liveSequence||state.dataMode!=='live'||state.selected!==id)return;liveBusy=false;$('live-status').textContent=error.message+(previous?' Showing last observation: '+describeObservation(previous):'');updateSelected();globe.refresh();}
 finally{if(sequence===liveSequence)$('refresh-live').disabled=false;}
}
async function bootstrapData(){
 try{const response=await fetch('/api/config',{headers:{Accept:'application/json'}});if(!response.ok)throw new Error();const config=await response.json();apiConfigured=Boolean(config.configured);
  if(apiConfigured){if(state.dataMode==='live')loadLiveCity(state.selected);}else{setDataMode('demo',false);notify('Demo day is available. IQAir is not configured for this deployment.');}
 }catch{apiConfigured=false;setDataMode('demo',false);notify('Live connection is unavailable. Demo day is available.');}
}
$('data-mode-select').addEventListener('change',e=>setDataMode(e.target.value));$('refresh-live').addEventListener('click',()=>loadLiveCity(state.selected,true));

function openAbout(){setSidebar(false,false);if(!$('about-dialog').open)$('about-dialog').showModal();}
function openAqi(){setSidebar(false,false);if(!$('aqi-dialog').open)$('aqi-dialog').showModal();}
for(const id of ['about-button','sidebar-info','footer-about','demo-info'])$(id).addEventListener('click',openAbout);
$('aqi-help').addEventListener('click',openAqi);
for(const [dialogId,buttonId] of [['about-dialog','close-about'],['aqi-dialog','close-aqi']]){const dialog=$(dialogId);$(buttonId).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});}
$('aqi-scale-list').innerHTML=categories.map((c,i)=>`<div class="aqi-scale-row"><i style="background:${c.color}" aria-hidden="true"></i><span>${c.label}</span><strong>${['0–50','51–100','101–150','151–200','201–300','301+'][i]}</strong></div>`).join('');
const searchInput=$('city-search');
searchInput.addEventListener('input',e=>{query=e.target.value.trim();renderList();renderPlaceResults();});
searchInput.addEventListener('focus',renderPlaceResults);
searchInput.addEventListener('blur',()=>setTimeout(()=>{if(!$('place-results').contains(document.activeElement)){$('place-results').hidden=true;searchInput.setAttribute('aria-expanded','false');}},120));
searchInput.addEventListener('keydown',e=>{if(!searchResults.length||$('place-results').hidden)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const direction=e.key==='ArrowDown'?1:-1;setActivePlace((activePlaceIndex+direction+searchResults.length)%searchResults.length);}else if(e.key==='Enter'&&activePlaceIndex>=0){e.preventDefault();choosePlace(activePlaceIndex);}else if(e.key==='Escape'){$('place-results').hidden=true;searchInput.setAttribute('aria-expanded','false');}});
$('place-results').addEventListener('pointerdown',e=>e.preventDefault());$('place-results').addEventListener('click',e=>{const option=e.target.closest('[data-index]');if(option)choosePlace(Number(option.dataset.index));});
$('clear-search').addEventListener('click',()=>{query='';searchInput.value='';renderList();renderPlaceResults();searchInput.focus();});
$('region-select').addEventListener('change',e=>{region=e.target.value;renderList();});$('sort-select').addEventListener('change',e=>{sort=e.target.value;renderList();});
$('all-cities-tab').addEventListener('click',()=>{savedOnly=false;renderList();});$('saved-cities-tab').addEventListener('click',()=>{savedOnly=true;renderList();});
for(const button of document.querySelectorAll('[data-quick-city]'))button.addEventListener('click',()=>selectCity(button.dataset.quickCity));
$('save-city').addEventListener('click',()=>{const c=selectedCity();if(saved.has(c.id)){saved.delete(c.id);notify(`${c.name} removed from saved cities.`);}else{saved.add(c.id);notify(`${c.name} saved.`);}persist();updateSaved();renderList();});
$('nearby-button').addEventListener('click',()=>{
 const button=$('nearby-button'),status=$('location-status');
 if(!navigator.geolocation){status.textContent='Location is unavailable. Search for your city instead.';return;}
 button.disabled=true;status.textContent='Finding your nearest demo city…';
 navigator.geolocation.getCurrentPosition(position=>{button.disabled=false;const result=nearestCity(position.coords.latitude,position.coords.longitude);if(!result){status.textContent='Could not match your location. Try city search.';return;}selectCity(result.city.id);status.textContent=`Nearest ${state.dataMode==='live'?'listed':'demo'} city: ${result.city.name} · ${Math.round(result.distance)} km away. ${state.dataMode==='live'?'IQAir checks the nearest reporting location.':'These are sample readings.'}`;notify(`Nearest ${state.dataMode==='live'?'listed':'demo'} city: ${result.city.name}. ${state.dataMode==='live'?'Fetching IQAir data.':'Sample data.'}`);},error=>{button.disabled=false;status.textContent=error.code===1?'Location access was declined. You can search for a city instead.':error.code===3?'Location lookup timed out. Try again or search for a city.':'Your location is unavailable. Search for a city instead.';},{timeout:12000,maximumAge:180000,enableHighAccuracy:false});
});
$('markers').addEventListener('click',e=>{const b=e.target.closest('[data-city]');if(b)selectCity(b.dataset.city);});$('locate-button').addEventListener('click',()=>{closeLocalMap(false);globe.focus(selectedCity());updateRotation();});
$('local-map-button').addEventListener('click',()=>localMap.isOpen()?closeLocalMap():openLocalMap());$('local-map-close').addEventListener('click',()=>closeLocalMap());
$('rotation-button').addEventListener('click',()=>{state.rotating=!state.rotating;globe.target=null;updateRotation();globe.refresh();});$('zoom-in').addEventListener('click',()=>globe.zoom(.35));$('zoom-out').addEventListener('click',()=>globe.zoom(-.35));
$('reset-button').addEventListener('click',()=>{globe.reset();state.rotating=false;updateRotation();notify('Globe view reset.');});
$('metric-select').addEventListener('change',e=>{state.metric=e.target.value;renderLegend();persist();globe.refresh();});
for(const [id,key] of [['heat-toggle','heat'],['grid-toggle','grid'],['labels-toggle','labels']])$(id).addEventListener('change',e=>{state[key]=e.target.checked;persist();globe.refresh();});
$('time-slider').addEventListener('input',e=>{setPlaying(false);setHour(e.target.value);});$('play-button').addEventListener('click',()=>setPlaying(!state.playing));$('speed-select').addEventListener('change',e=>{state.speed=Number(e.target.value);persist();});
$('menu-button').addEventListener('click',()=>setSidebar(!$('sidebar').classList.contains('open')));$('sidebar-close').addEventListener('click',()=>setSidebar(false));$('sidebar-backdrop').addEventListener('click',()=>setSidebar(false));
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this view.');}});if(!document.fullscreenEnabled)$('fullscreen-button').hidden=true;
document.addEventListener('keydown',e=>{
 const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName),modal=$('about-dialog').open||$('aqi-dialog').open;
 if(e.key==='/'&&!editing&&!modal){e.preventDefault();if(innerWidth<=760)setSidebar(true);else $('city-search').focus();}
 if(e.key==='?'&&!editing&&!modal){e.preventDefault();openAbout();}
 if(e.code==='Space'&&e.target.id==='earth'&&!modal){e.preventDefault();setPlaying(!state.playing);}
 if(e.key==='Escape'&&!modal&&localMap.isOpen()){e.preventDefault();closeLocalMap();}
 else if(e.key==='Escape'&&!modal&&$('sidebar').classList.contains('open'))setSidebar(false);
 if(e.key==='Tab'&&innerWidth<=760&&$('sidebar').classList.contains('open')){const controls=[...$('sidebar').querySelectorAll('button,input,select,a')].filter(el=>!el.disabled&&el.offsetParent!==null),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
document.addEventListener('fullscreenchange',()=>{$('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');globe.measure();globe.refresh();});
window.addEventListener('resize',()=>{if(innerWidth>760)setSidebar(false,false);localMap.resize();});
$('data-mode-select').value=state.dataMode;$('metric-select').value=state.metric;$('speed-select').value=state.speed;for(const [id,key] of [['heat-toggle','heat'],['grid-toggle','grid'],['labels-toggle','labels']])$(id).checked=state[key];
renderList();updateSelected();setHour(12);updateRotation();renderLegend();setDataMode(state.dataMode,false);bootstrapData();
globe.init().then(()=>{placeIndex=globe.getSearchPlaces();renderPlaceResults();$('canvas-status').hidden=true;}).catch(()=>{const status=$('canvas-status');status.textContent='The globe could not load. You can still explore the demo city readings.';const retry=document.createElement('button');retry.textContent='Retry globe';retry.addEventListener('click',()=>window.location.reload());status.append(retry);});
