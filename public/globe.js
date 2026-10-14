import {cities,reading,geoVector,rotateVector,clamp,temperatureColor} from './data.js';
const rad=d=>d*Math.PI/180;

const vertexShader=`
attribute vec3 aPosition;
attribute vec2 aUV;
uniform mat3 uRotation;
uniform vec2 uScale;
varying vec2 vUV;
varying vec3 vView;
varying vec3 vWorld;
void main(){
 vUV=aUV;vWorld=aPosition;vView=uRotation*aPosition;
 gl_Position=vec4(vView.xy*uScale,-vView.z*.5,1.);
}`;
const fragmentShader=`
precision mediump float;
varying vec2 vUV;
varying vec3 vView;
varying vec3 vWorld;
uniform sampler2D uTexture;
uniform vec4 uCities[48];
uniform float uHeat;
uniform float uGrid;
uniform float uTemperature;
vec3 aqiColor(float n){
 if(n<=50.)return vec3(.329,.910,.608);
 if(n<=100.)return vec3(1.,.843,.427);
 if(n<=150.)return vec3(1.,.643,.361);
 if(n<=200.)return vec3(1.,.443,.549);
 if(n<=300.)return vec3(.729,.604,1.);
 return vec3(.812,.443,.616);
}
vec3 tempColor(float n){
 if(n<0.)return vec3(.510,.725,.831);
 if(n<10.)return vec3(.600,.824,.729);
 if(n<20.)return vec3(.824,.867,.608);
 if(n<30.)return vec3(.929,.796,.529);
 return vec3(.922,.596,.427);
}
void main(){
 vec3 normal=normalize(vView);
 vec3 color=texture2D(uTexture,vUV).rgb;
 float light=max(dot(normal,normalize(vec3(-.55,.7,1.2))),0.);
 color*=.68+.50*light;
 float glow=pow(1.-max(normal.z,0.),3.);
 color+=vec3(.10,.31,.46)*glow;
 float gridX=abs(fract(vUV.x*24.+.5)-.5);
 float gridY=abs(fract(vUV.y*12.+.5)-.5);
 float line=1.-smoothstep(.004,.010,min(gridX,gridY));
 color=mix(color,vec3(.72,.89,.94),line*.17*uGrid);
 float dotX=abs(fract(vUV.x*360.)-.5),dotY=abs(fract(vUV.y*180.)-.5);
 float dots=(1.-smoothstep(.035,.12,length(vec2(dotX,dotY))))*.14;
 color+=vec3(.14,.22,.24)*dots;
 vec3 heat=vec3(0.);float total=0.;
 for(int i=0;i<48;i++){
  if(uCities[i].w>-99.){
   float d=distance(normalize(vWorld),uCities[i].xyz);
   float strength=exp(-d*d/(uTemperature>.5?.018:.013));
   vec3 hc=uTemperature>.5?tempColor(uCities[i].w):aqiColor(uCities[i].w);
   heat+=hc*strength;total+=strength;
  }
 }
 if(total>.001){color=mix(color,heat/max(total,.001),min(total*.33,.46)*uHeat*(.65+.35*light));}
 float spec=pow(max(dot(reflect(-normalize(vec3(-.55,.7,1.2)),normal),vec3(0.,0.,1.)),0.),25.);
 color+=vec3(.19,.37,.48)*spec*.30;
 gl_FragColor=vec4(color,1.);
}`;

function createTexture(polygons){
 const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=1024;
 const ctx=atlas.getContext('2d');
 const ocean=ctx.createLinearGradient(0,0,0,1024);ocean.addColorStop(0,'#174f86');ocean.addColorStop(.5,'#187bac');ocean.addColorStop(1,'#175d92');ctx.fillStyle=ocean;ctx.fillRect(0,0,2048,1024);
 const land=ctx.createLinearGradient(0,0,0,1024);land.addColorStop(0,'#c5e6e7');land.addColorStop(.2,'#98d6b3');land.addColorStop(.36,'#a8d4a0');land.addColorStop(.55,'#69c59d');land.addColorStop(.78,'#87d0ac');land.addColorStop(1,'#d3e9ed');
 ctx.fillStyle=land;ctx.strokeStyle='#e6ffea8c';ctx.lineWidth=1.0;
 for(const polygon of polygons){
  ctx.beginPath();polygon.forEach(([lon,lat],i)=>{const x=(lon+180)/360*2048,y=(90-lat)/180*1024;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.fill();ctx.stroke();
 }
 // A deterministic texture adds depth without pretending to be satellite imagery.
 let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<36000;i++){const x=random()*2048,y=random()*1024;ctx.fillStyle=i%2?'#d0f6ef06':'#07536410';ctx.fillRect(x,y,random()*3+1,random()*2+1);}
 return atlas;
}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function makeWebGL(canvas,polygons){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(!gl||gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)<64)throw new Error('WebGL unavailable');
 const program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,vertexShader));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Globe program could not initialize');gl.useProgram(program);
 const positions=[],uvs=[],indices=[],nx=144,ny=72;
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
  const v=y/ny,u=x/nx;positions.push(...geoVector(90-v*180,u*360-180));uvs.push(u,v);
 }
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}
 for(const [name,values,size] of [['aPosition',positions,3],['aUV',uvs,2]]){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);}
 const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,createTexture(polygons));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const uniforms=Object.fromEntries(['uRotation','uScale','uTexture','uCities[0]','uHeat','uGrid','uTemperature'].map(n=>[n,gl.getUniformLocation(program,n)]));gl.uniform1i(uniforms.uTexture,0);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 return {draw(state,layout){
  const dpr=Math.min(devicePixelRatio||1,2);const w=Math.round(layout.w*dpr),h=Math.round(layout.h*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  // Move the viewport centre to the globe's layout centre, preserving full canvas dimensions.
  gl.viewport(Math.round((layout.cx-layout.w/2)*dpr),Math.round((layout.h/2-layout.cy)*dpr),w,h);
  const cy=Math.cos(rad(state.lon)),sy=Math.sin(rad(state.lon)),cp=Math.cos(rad(state.lat)),sp=Math.sin(rad(state.lat));
  gl.uniformMatrix3fv(uniforms.uRotation,false,new Float32Array([cy,-sp*sy,cp*sy,0,cp,sp,-sy,-sp*cy,cp*cy]));
  gl.uniform2f(uniforms.uScale,2*layout.r/layout.w,2*layout.r/layout.h);
  gl.uniform1f(uniforms.uHeat,state.heat?1:0);gl.uniform1f(uniforms.uGrid,state.grid?1:0);gl.uniform1f(uniforms.uTemperature,state.metric==='temp'?1:0);
  const points=new Float32Array(48*4);for(let i=0;i<48;i++){points[i*4+3]=-100;}
  cities.forEach((c,i)=>{const v=geoVector(c.lat,c.lon),r=reading(c,state.hour),value=state.metric==='temp'?r.temp:state.metric==='pm'&&r.pm===null?null:r.aqi;if(Number.isFinite(value))points.set([...v,value],i*4);});gl.uniform4fv(uniforms['uCities[0]'],points);
  gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 }};
}

// A real orthographic 3D projection also works when a device disables WebGL.
function makeCanvasFallback(canvas,polygons){
 let ctx=canvas.getContext('2d');
 const vectors=polygons.map(p=>p.map(([lon,lat])=>geoVector(lat,lon)));
 return {draw(state,l){
  const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(l.w*dpr)||canvas.height!==Math.round(l.h*dpr)){canvas.width=Math.round(l.w*dpr);canvas.height=Math.round(l.h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,l.w,l.h);
  const ocean=ctx.createRadialGradient(l.cx-l.r*.35,l.cy-l.r*.4,l.r*.05,l.cx,l.cy,l.r);ocean.addColorStop(0,'#218fbe');ocean.addColorStop(.75,'#196da2');ocean.addColorStop(1,'#184d84');ctx.fillStyle=ocean;ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.clip();
  for(const poly of vectors){let prev=rotateVector(poly.at(-1),state.lon,state.lat);ctx.beginPath();let began=false;
   for(const v of poly){const cur=rotateVector(v,state.lon,state.lat);if(cur[2]>=0){if(prev[2]<0){const f=-prev[2]/(cur[2]-prev[2]);let x=prev[0]+(cur[0]-prev[0])*f,y=prev[1]+(cur[1]-prev[1])*f;const m=Math.hypot(x,y);x/=m;y/=m;ctx.moveTo(l.cx+x*l.r,l.cy-y*l.r);}else if(!began)ctx.moveTo(l.cx+cur[0]*l.r,l.cy-cur[1]*l.r);else ctx.lineTo(l.cx+cur[0]*l.r,l.cy-cur[1]*l.r);began=true;}else if(prev[2]>=0){const f=prev[2]/(prev[2]-cur[2]);let x=prev[0]+(cur[0]-prev[0])*f,y=prev[1]+(cur[1]-prev[1])*f;const m=Math.hypot(x,y);ctx.lineTo(l.cx+x/m*l.r,l.cy-y/m*l.r);}prev=cur;}
   ctx.fillStyle='#86d0aa';ctx.strokeStyle='#e6ffea85';ctx.lineWidth=.75;ctx.fill();ctx.stroke();
  }
  if(state.grid){ctx.strokeStyle='#d8f6ff2a';ctx.lineWidth=.6;for(let lat=-75;lat<=75;lat+=15){drawProjectedLine(ctx,l,state,Array.from({length:181},(_,i)=>geoVector(lat,i*2-180)));}for(let lon=-180;lon<180;lon+=15){drawProjectedLine(ctx,l,state,Array.from({length:91},(_,i)=>geoVector(i*2-90,lon)));}}
  if(state.heat)for(const c of cities){const v=rotateVector(geoVector(c.lat,c.lon),state.lon,state.lat);if(v[2]<0)continue;const r=reading(c,state.hour);if(!Number.isFinite(state.metric==='temp'?r.temp:r.aqi)||(state.metric==='pm'&&r.pm===null))continue;const color=state.metric==='temp'?temperatureColor(r.temp):r.color,x=l.cx+v[0]*l.r,y=l.cy-v[1]*l.r,g=ctx.createRadialGradient(x,y,0,x,y,l.r*.1);g.addColorStop(0,color+'65');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-l.r*.1,y-l.r*.1,l.r*.2,l.r*.2);}
  const shadow=ctx.createLinearGradient(l.cx-l.r,l.cy-l.r,l.cx+l.r,l.cy+l.r);shadow.addColorStop(0,'#12345400');shadow.addColorStop(1,'#061f5a8a');ctx.fillStyle=shadow;ctx.fillRect(l.cx-l.r,l.cy-l.r,l.r*2,l.r*2);ctx.restore();
 }};
}
function drawProjectedLine(ctx,l,s,points){ctx.beginPath();let connected=false;for(const v of points){const p=rotateVector(v,s.lon,s.lat);if(p[2]>0){if(connected)ctx.lineTo(l.cx+p[0]*l.r,l.cy-p[1]*l.r);else ctx.moveTo(l.cx+p[0]*l.r,l.cy-p[1]*l.r);connected=true;}else connected=false;}ctx.stroke();}

export class Globe {
 constructor({canvas,effects,markers,atmosphere,state,onRotate,onFrame}){
  Object.assign(this,{canvas,effects,markers,atmosphere,state,onRotate,onFrame});this.ctx=effects.getContext('2d');this.layout={w:0,h:0,r:0,cx:0,cy:0};this.pointerMap=new Map();this.lastTime=0;this.dirty=true;this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;this.countries=[];this.markerBoxes=[];this.overlayBoxes=[];this.labelMeasurements=new Map();this.drawnCountryNames=[];
  this.pins=cities.map(c=>{const el=document.createElement('button');el.className='pin';el.type='button';el.hidden=true;el.dataset.city=c.id;el.setAttribute('aria-label',`Select ${c.name}`);el.innerHTML='<span class="pin-value"></span><span class="pin-label" hidden></span>';markers.append(el);return {city:c,el,value:el.firstElementChild,label:el.lastElementChild,vec:geoVector(c.lat,c.lon)};});
  let seed=28;this.particles=Array.from({length:95},()=>{seed=(seed*1664525+1013904223)>>>0;const a=seed/4294967296;seed=(seed*1664525+1013904223)>>>0;return {lon:a*360-180,lat:(seed/4294967296)*130-65,speed:1+a*3,length:2+a*5};});
  this.bind();this.resizeObserver=new ResizeObserver(()=>{this.measure();this.dirty=true;});this.resizeObserver.observe(canvas.parentElement);this.measure();
 }
 async init(){
  const responses=await Promise.all([fetch('./world.json'),fetch('./countries.json')]);if(responses.some(r=>!r.ok))throw new Error('World geography could not load');const [polygons,countries]=await Promise.all(responses.map(r=>r.json()));this.countries=countries.map(c=>({...c,vec:geoVector(c.lat,c.lon)}));
  try{this.renderer=makeWebGL(this.canvas,polygons);}catch(error){
   // A canvas cannot change context types after WebGL has initialized. Replace it for the fallback.
   const replacement=this.canvas.cloneNode();this.canvas.replaceWith(replacement);this.canvas=replacement;this.bindCanvas();this.renderer=makeCanvasFallback(replacement,polygons);
  }
  this.dirty=true;requestAnimationFrame(t=>this.tick(t));
 }
 measure(){const stage=this.canvas.parentElement,rect=stage.getBoundingClientRect(),w=rect.width,h=rect.height,mobile=innerWidth<=760;let r,cx,cy;if(mobile){r=Math.min(w*.425,180);cx=w*.5;cy=278;}else{r=Math.min(h*.375,w*.345);cx=w*.415;cy=h*.51+15;}this.layout={w,h,r:r*this.state.zoom,cx,cy};this.atmosphere.style.cssText=`left:${cx}px;top:${cy}px;width:${this.layout.r*2.7}px;height:${this.layout.r*2.7}px;`;this.overlayBoxes=[...stage.querySelectorAll('.city-detail,.stage-intro,.stage-top-right,.legend,.layer-switches,.timeline,.map-tools')].map(el=>{const b=el.getBoundingClientRect();return {left:b.left-rect.left-5,right:b.right-rect.left+5,top:b.top-rect.top-5,bottom:b.bottom-rect.top+5};});}
 project(v,altitude=1){const p=rotateVector(v,this.state.lon,this.state.lat),l=this.layout;return {x:l.cx+p[0]*l.r*altitude,y:l.cy-p[1]*l.r*altitude,z:p[2]};}
 focus(city){this.state.rotating=false;let delta=((city.lon-this.state.lon+540)%360)-180;this.target={lon:this.state.lon+delta,lat:city.lat};this.dirty=true;}
 zoom(amount){this.state.zoom=clamp(this.state.zoom+amount,.65,2.2);this.measure();this.dirty=true;}
 reset(){this.target={lon:this.state.lon+((98-this.state.lon+540)%360)-180,lat:16};this.state.zoom=1;this.measure();this.dirty=true;}
 refresh(){this.dirty=true;}
 bind(){this.bindCanvas();document.addEventListener('visibilitychange',()=>{this.lastTime=0;this.dirty=true;});}
 bindCanvas(){const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;c.focus({preventScroll:true});c.setPointerCapture(e.pointerId);this.pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});this.target=null;this.state.rotating=false;this.onRotate?.();c.classList.add('dragging');if(this.pointerMap.size===2)this.pinchDistance=this.getPinchDistance();});
  c.addEventListener('pointermove',e=>{const previous=this.pointerMap.get(e.pointerId);if(!previous)return;this.pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointerMap.size>=2){const distance=this.getPinchDistance();if(this.pinchDistance)this.zoom((distance-this.pinchDistance)/200);this.pinchDistance=distance;}else{this.state.lon-=(e.clientX-previous.x)*.3;this.state.lat=clamp(this.state.lat+(e.clientY-previous.y)*.3,-80,80);this.dirty=true;}});
  const release=e=>{this.pointerMap.delete(e.pointerId);this.pinchDistance=null;if(!this.pointerMap.size)c.classList.remove('dragging');};c.addEventListener('pointerup',release);c.addEventListener('pointercancel',release);c.addEventListener('lostpointercapture',release);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoom(-e.deltaY*.001);},{passive:false});
  c.addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'];if(!keys.includes(e.key))return;e.preventDefault();this.target=null;this.state.rotating=false;this.onRotate?.();if(e.key==='ArrowLeft')this.state.lon-=8;if(e.key==='ArrowRight')this.state.lon+=8;if(e.key==='ArrowUp')this.state.lat=clamp(this.state.lat+8,-80,80);if(e.key==='ArrowDown')this.state.lat=clamp(this.state.lat-8,-80,80);if(e.key==='+'||e.key==='=')this.zoom(.15);if(e.key==='-')this.zoom(-.15);if(e.key==='0')this.reset();this.dirty=true;});
  c.addEventListener('webglcontextlost',e=>{e.preventDefault();const s=document.getElementById('canvas-status');s.hidden=false;s.textContent='The 3D view paused. Reload this page to restore your globe.';});
 }
 getPinchDistance(){const [a,b]=this.pointerMap.values();return Math.hypot(a.x-b.x,a.y-b.y);}
 tick(time){
  requestAnimationFrame(t=>this.tick(t));if(document.hidden){this.lastTime=0;return;}
  const dt=this.lastTime?Math.min((time-this.lastTime)/1000,.05):0;this.lastTime=time;let moved=false;
  if(this.target){const f=this.reducedMotion?1:1-Math.exp(-dt*6);this.state.lon+=(this.target.lon-this.state.lon)*f;this.state.lat+=(this.target.lat-this.state.lat)*f;if(Math.abs(this.target.lon-this.state.lon)<.05&&Math.abs(this.target.lat-this.state.lat)<.05){this.state.lon=this.target.lon;this.state.lat=this.target.lat;this.target=null;}moved=true;}
  else if(this.state.rotating){this.state.lon+=dt*1.8;moved=true;}
  this.onFrame?.(dt);const redraw=moved||this.dirty;
  if(redraw){this.renderer.draw(this.state,this.layout);this.drawMarkers();this.dirty=false;}
  if(!redraw&&(this.reducedMotion||time-(this.lastEffectsTime||0)<1000/30))return;
  this.lastEffectsTime=time;this.drawEffects(time/1000);this.drawCountryLabels();
 }

 drawEffects(time){const ctx=this.ctx,l=this.layout,dpr=Math.min(devicePixelRatio||1,2);if(this.effects.width!==Math.round(l.w*dpr)||this.effects.height!==Math.round(l.h*dpr)){this.effects.width=Math.round(l.w*dpr);this.effects.height=Math.round(l.h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,l.w,l.h);
  if(!this.reducedMotion){ctx.strokeStyle='#c1f6ff80';ctx.lineWidth=.7;ctx.save();ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.clip();for(const p of this.particles){const a=geoVector(p.lat,p.lon+time*p.speed),b=geoVector(p.lat+.5,p.lon+time*p.speed+p.length),start=this.project(a,1.008),end=this.project(b,1.008);if(start.z<.12||end.z<.12)continue;ctx.globalAlpha=Math.min(start.z,.65);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo((start.x+end.x)/2,(start.y+end.y)/2-1,end.x,end.y);ctx.stroke();}ctx.restore();}
  const selected=cities.find(c=>c.id===this.state.selected),p=this.project(geoVector(selected.lat,selected.lon));if(p.z>.05){const rr=reading(selected,this.state.hour),pulse=this.reducedMotion?0:(time*.4)%1;ctx.globalAlpha=(1-pulse)*.5;ctx.strokeStyle=rr.color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,10+pulse*18,(10+pulse*18)*Math.max(.35,p.z),0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 drawMarkers(){const selected=this.state.selected,visible=[];for(const pin of this.pins){const c=pin.city,p=this.project(pin.vec,1.015),r=reading(c,this.state.hour),chosen=c.id===selected;pin.el.hidden=p.z<.10||p.x<10||p.x>this.layout.w-10||p.y<10||p.y>this.layout.h-10;if(pin.el.hidden)continue;visible.push({pin,p,r,chosen});}
  visible.sort((a,b)=>Number(b.chosen)-Number(a.chosen)||b.p.z-a.p.z);const placed=[];this.markerBoxes=[];
  for(const {pin,p,r,chosen} of visible){const overlap=placed.some(o=>Math.hypot(o.x-p.x,o.y-p.y)<(chosen?0:29));if(overlap&&!chosen){pin.el.hidden=true;continue;}placed.push(p);const half=chosen?20:16;this.markerBoxes.push({left:p.x-half,right:p.x+half,top:p.y-half,bottom:p.y+half});if(chosen){const labelWidth=Math.max(60,pin.city.name.length*7+20);this.markerBoxes.push({left:p.x-labelWidth/2,right:p.x+labelWidth/2,top:p.y+28,bottom:p.y+62});}pin.el.style.left=p.x+'px';pin.el.style.top=p.y+'px';pin.el.style.opacity=clamp(p.z*2,.65,1);const missing=!Number.isFinite(this.state.metric==='temp'?r.temp:this.state.metric==='pm'?r.pm:r.aqi),color=missing?'#a5bacb':this.state.metric==='temp'?temperatureColor(r.temp):r.color;pin.el.style.setProperty('--pin-color',color);pin.el.style.setProperty('--pin-glow',color+'66');pin.el.classList.toggle('selected',chosen);pin.value.textContent=missing?'—':this.state.metric==='temp'?r.temp+'°':this.state.metric==='pm'?Math.round(r.pm):r.aqi;pin.label.hidden=false;pin.label.textContent=pin.city.name;pin.el.setAttribute('aria-label',`${pin.city.name}: ${r.aqi===null?'no reading loaded':r.aqi+' US AQI'}, ${r.source==='IQAir'?'IQAir observation':r.source==='demo'?'simulated':'select to load IQAir data'}. Select city.`);}
 }
 drawCountryLabels(){
  this.drawnCountryNames=[];if(!this.state.labels)return;
  const ctx=this.ctx,l=this.layout,selected=cities.find(c=>c.id===this.state.selected),overlaps=(a,b)=>a.left<b.right+5&&a.right>b.left-5&&a.top<b.bottom+4&&a.bottom>b.top-4;
  const reserved=[...this.overlayBoxes,...this.markerBoxes],mobile=innerWidth<=760;
  const visible=this.countries.map(country=>({country,p:this.project(country.vec,1.002)})).filter(({country,p})=>p.z>.25&&this.state.zoom>=country.minZoom&&country.name!==selected?.name).sort((a,b)=>Number(b.country.name===selected?.country)-Number(a.country.name===selected?.country)||a.country.rank-b.country.rank||b.p.z-a.p.z);
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=3.4;ctx.strokeStyle='rgba(246,255,249,.9)';ctx.fillStyle='#123e3b';
  for(const {country,p} of visible){
   const size=Math.round((country.rank<=2?(mobile?10:12):(mobile?9:10))*clamp(Math.pow(this.state.zoom,.25),.9,1.2));ctx.font=`600 ${size}px "Segoe UI", Arial, sans-serif`;
   const text=country.name.toLocaleUpperCase('en'),key=size+':'+text;
   if(!this.labelMeasurements.has(key))this.labelMeasurements.set(key,ctx.measureText(text).width);
   const width=this.labelMeasurements.get(key),offsets=country.rank<=2?[[0,0],[0,14],[0,-14],[14,0],[-14,0],[0,26],[0,-26],[24,12],[-24,12],[18,26],[-18,26],[18,-26],[-18,-26],[0,38]]:[[0,0],[0,10],[0,-10],[10,0],[-10,0]];
   if(['India','China','Australia','Russia','Canada','United States','Brazil','Argentina'].includes(country.name))offsets.push([0,50],[18,38],[-18,38],[18,-38],[-18,-38]);
   let placement;
   for(const [dx,dy] of offsets){const x=p.x+dx,y=p.y+dy,box={left:x-width/2-3,right:x+width/2+3,top:y-size/2-3,bottom:y+size/2+3};if(box.left<6||box.right>l.w-6||box.top<6||box.bottom>l.h-6||reserved.some(b=>overlaps(box,b)))continue;placement={x,y,box};break;}
   if(!placement)continue;
   ctx.globalAlpha=clamp((p.z-.15)/.35,.45,1);ctx.strokeText(text,placement.x,placement.y);ctx.fillText(text,placement.x,placement.y);reserved.push(placement.box);this.drawnCountryNames.push({name:country.name,box:placement.box,z:p.z});
  }
  ctx.restore();
 }
}
