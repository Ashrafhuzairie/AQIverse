import {cities,reading,category,clamp,temperatureColor} from './data.js';
import {Globe} from './globe.js';

const $=id=>document.getElementById(id);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={lon:98,lat:16,zoom:1,selected:'singapore',hour:12,rotating:!reducedMotion,heat:true,grid:true,labels:true,metric:'aqi',playing:false};
let query='',region='All',descending=true,playAccumulator=0,rows=new Map();
const number=new Intl.NumberFormat('en',{maximumFractionDigits:1,minimumFractionDigits:1});

function selectedCity(){return cities.find(c=>c.id===state.selected);}
function updateRotation(){const b=$('rotation-button');b.classList.toggle('active',state.rotating);b.setAttribute('aria-pressed',String(state.rotating));b.setAttribute('aria-label',state.rotating?'Pause globe rotation':'Start globe rotation');b.title=state.rotating?'Pause auto-rotation':'Start auto-rotation';}
const globe=new Globe({canvas:$('earth'),effects:$('effects'),markers:$('markers'),atmosphere:$('atmosphere'),state,onRotate:updateRotation,onFrame:dt=>{if(!state.playing)return;playAccumulator+=dt;if(playAccumulator>=1.2){playAccumulator=0;setHour((state.hour+1)%24);}}});

function selectCity(id,focus=true){if(!cities.some(c=>c.id===id))return;state.selected=id;if(focus){globe.focus(selectedCity());updateRotation();}updateSelected();updateRows();globe.refresh();if(innerWidth<=760){$('sidebar').classList.remove('open');$('menu-button').setAttribute('aria-expanded','false');}}
function updateRows(){for(const [id,row] of rows){const c=cities.find(c=>c.id===id),r=reading(c,state.hour);row.classList.toggle('selected',id===state.selected);row.setAttribute('aria-pressed',String(id===state.selected));row.style.setProperty('--row-color',r.color);row.querySelector('.row-number').textContent=r.aqi;row.setAttribute('aria-label',`${c.name}, ${c.country}, ${r.aqi} US AQI, simulated. ${r.label}.`);}}
function renderList(){
 const list=$('city-list');list.replaceChildren();rows=new Map();
 const visible=cities.filter(c=>(region==='All'||c.region===region)&&(!query||(c.name+' '+c.country+' '+c.code).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query))).sort((a,b)=>descending?reading(b,state.hour).aqi-reading(a,state.hour).aqi:reading(a,state.hour).aqi-reading(b,state.hour).aqi);
 $('city-count').textContent=`${visible.length} ${visible.length===1?'city':'cities'}`;
 if(!visible.length){const p=document.createElement('p');p.className='empty-list';p.textContent='No sample cities match. Try another city, country, or region.';list.append(p);return;}
 for(const c of visible){const b=document.createElement('button');b.type='button';b.className='city-row';b.innerHTML=`<span class="country-code">${c.code}</span><span class="city-copy"><strong>${c.name}</strong><small>${c.country}</small></span><span class="row-reading"><span class="row-number"></span><i></i></span>`;b.addEventListener('click',()=>selectCity(c.id));list.append(b);rows.set(c.id,b);}updateRows();
}
function updateSelected(){const c=selectedCity(),r=reading(c,state.hour);document.documentElement.style.setProperty('--city-color',r.color);$('selected-name').textContent=c.name;$('selected-country').textContent=c.country;$('selected-coordinates').textContent=`${Math.abs(c.lat).toFixed(2)}° ${c.lat>=0?'N':'S'}, ${Math.abs(c.lon).toFixed(2)}° ${c.lon>=0?'E':'W'}`;$('selected-aqi').textContent=r.aqi;$('selected-status').textContent=r.label;$('selected-pm').textContent=number.format(r.pm);$('selected-temp').textContent=r.temp;$('selected-humidity').textContent=r.humidity;
 // Six equal colour bands correspond to the six category ranges, rather than equal AQI lengths.
 const bands=[[0,50],[51,100],[101,150],[151,200],[201,300],[301,500]],index=bands.findIndex(b=>r.aqi<=b[1]),band=bands[index];$('aqi-indicator').style.left=clamp((index+(r.aqi-band[0])/(band[1]-band[0]))/6*100,0,99)+'%';
 $('iqair-city-link').href='https://www.iqair.com/sg/'+c.iqairPath;
 renderChart(c,r);
}
function renderChart(c,r){const svg=$('trend-chart'),series=Array.from({length:24},(_,h)=>reading(c,h).aqi),min=Math.max(0,Math.min(...series)-8),max=Math.max(...series)+8;const px=h=>6+h/23*238,py=n=>62-(n-min)/(max-min)*53,points=series.map((n,h)=>[px(h),py(n)]),path=points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' '),area=path+' L244,68 L6,68 Z';
 svg.innerHTML=`<defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${r.color}" stop-opacity=".18"/><stop offset="100%" stop-color="${r.color}" stop-opacity="0"/></linearGradient></defs><path d="M6 20H244M6 44H244M6 68H244" stroke="#ffffff0a" stroke-width=".7"/><path d="${area}" fill="url(#chart-fill)" stroke="none"/><path d="${path}" fill="none" stroke="${r.color}" stroke-width="1.3"/><path d="M${px(state.hour)} 6V68" stroke="${r.color}" stroke-opacity=".25" stroke-dasharray="2 3"/><circle cx="${px(state.hour)}" cy="${py(series[state.hour])}" r="3" fill="${r.color}" stroke="#152128" stroke-width="1.5"/>`;
 svg.setAttribute('aria-label',`Simulated 24-hour US AQI trend for ${c.name}; ${Math.min(...series)} to ${Math.max(...series)}. Selected hour ${state.hour}:00: ${r.aqi}.`);
}
function setHour(value){state.hour=clamp(Math.round(Number(value)),0,23);$('time-slider').value=state.hour;$('time-label').innerHTML=`${String(state.hour).padStart(2,'0')}:00 <small>UTC</small>`;$('time-slider').setAttribute('aria-valuetext',`${String(state.hour).padStart(2,'0')}:00 UTC, simulated`);$('time-slider').style.background=`linear-gradient(90deg,var(--mint) 0% ${state.hour/23*100}%,#93bde740 ${state.hour/23*100}% 100%)`;updateSelected();updateRows();const list=$('city-list'),scroll=list.scrollTop;[...rows.entries()].sort(([a],[b])=>{const ra=reading(cities.find(c=>c.id===a),state.hour).aqi,rb=reading(cities.find(c=>c.id===b),state.hour).aqi;return descending?rb-ra:ra-rb;}).forEach(([,row])=>list.append(row));list.scrollTop=scroll;globe.refresh();}
function setPlaying(playing){state.playing=playing;playAccumulator=0;const b=$('play-button');b.setAttribute('aria-pressed',String(playing));b.setAttribute('aria-label',playing?'Pause simulated day':'Play simulated day');b.innerHTML=playing?'<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24"><path d="m9 5 10 7-10 7z"/></svg>';}
function renderLegend(){const legend=$('legend');if(state.metric==='temp'){legend.innerHTML='<div class="legend-title">TEMPERATURE · °C <span>COOL → WARM</span></div><div class="legend-bar"><i style="background:#82b9d4"></i><i style="background:#99d2ba"></i><i style="background:#d2dd9b"></i><i style="background:#edcb87"></i><i style="background:#eb986d"></i></div><div class="legend-values"><span>−10</span><span>0</span><span>10</span><span>20</span><span>30+</span></div><span class="legend-note">Sample temperatures, not a measured weather map.</span>';}
 else if(state.metric==='pm'){legend.innerHTML='<div class="legend-title">PM2.5 · µg/m³ <span>LOW → HIGH</span></div><div class="legend-bar"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="legend-values"><span>0</span><span>9</span><span>35.4</span><span>55.4</span><span>125.4</span><span>225.4+</span></div><span class="legend-note">PM2.5 colours follow the corresponding US AQI category.</span>';}
 else legend.innerHTML='<div class="legend-title">US AQI <span>LOW → HIGH</span></div><div class="legend-bar"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="legend-values"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300+</span></div><span class="legend-note">Coloured halos are illustrative, not measured coverage.</span>';
 $('heat-toggle').parentElement.lastChild.textContent=state.metric==='temp'?'Temperature halos':'Pollution halos';
}
const openAbout=()=>{if(!$('about-dialog').open)$('about-dialog').showModal();};
for(const id of ['about-button','sidebar-info','footer-about'])$(id).addEventListener('click',openAbout);
$('close-about').addEventListener('click',()=>$('about-dialog').close());
$('about-dialog').addEventListener('click',e=>{if(e.target===$('about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('city-search').addEventListener('input',e=>{query=e.target.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();renderList();});
$('region-select').addEventListener('change',e=>{region=e.target.value;renderList();});
$('sort-button').addEventListener('click',()=>{descending=!descending;$('sort-button').innerHTML='AQI <span>'+(descending?'↓':'↑')+'</span>';$('sort-button').setAttribute('aria-label',descending?'Sort lowest AQI first':'Sort highest AQI first');renderList();});
$('markers').addEventListener('click',e=>{const b=e.target.closest('[data-city]');if(b)selectCity(b.dataset.city);});
$('locate-button').addEventListener('click',()=>{globe.focus(selectedCity());updateRotation();});
$('rotation-button').addEventListener('click',()=>{state.rotating=!state.rotating;globe.target=null;updateRotation();globe.refresh();});
$('zoom-in').addEventListener('click',()=>globe.zoom(.15));$('zoom-out').addEventListener('click',()=>globe.zoom(-.15));
$('reset-button').addEventListener('click',()=>{globe.reset();state.rotating=!reducedMotion;updateRotation();});
$('metric-select').addEventListener('change',e=>{state.metric=e.target.value;renderLegend();globe.refresh();});
$('heat-toggle').addEventListener('change',e=>{state.heat=e.target.checked;globe.refresh();});$('grid-toggle').addEventListener('change',e=>{state.grid=e.target.checked;globe.refresh();});$('labels-toggle').addEventListener('change',e=>{state.labels=e.target.checked;globe.refresh();});
$('time-slider').addEventListener('input',e=>{setPlaying(false);setHour(e.target.value);});$('play-button').addEventListener('click',()=>setPlaying(!state.playing));
$('menu-button').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu-button').setAttribute('aria-expanded',String(open));$('menu-button').setAttribute('aria-label',open?'Close city explorer':'Open city explorer');});
$('stage').addEventListener('click',e=>{if(innerWidth<=760&&!e.target.closest('.pin')){$('sidebar').classList.remove('open');$('menu-button').setAttribute('aria-expanded','false');}});
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{const b=$('fullscreen-button');b.title='Fullscreen is unavailable in this view';b.setAttribute('aria-label','Fullscreen unavailable in this view');b.disabled=true;}});
if(!document.fullscreenEnabled)$('fullscreen-button').hidden=true;
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('about-dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();if(innerWidth<=760){$('sidebar').classList.add('open');$('menu-button').setAttribute('aria-expanded','true');}$('city-search').focus();}if(e.key==='Escape'){$('sidebar').classList.remove('open');$('menu-button').setAttribute('aria-expanded','false');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');globe.measure();globe.refresh();});

renderList();updateSelected();setHour(12);updateRotation();
globe.init().then(()=>{$('canvas-status').hidden=true;}).catch(()=>{$('canvas-status').textContent='The globe could not load. Refresh the page to try again. You can still explore the sample city readings.';});
