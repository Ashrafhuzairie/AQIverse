import {cities,reading,geoVector,rotateVector,clamp,temperatureColor} from './data.js';
const rad=d=>d*Math.PI/180;
export const MIN_ZOOM=.65,MAX_ZOOM=6,CITY_DETAIL_ZOOM=4.5;
export function wheelZoomFactor(deltaY){const direction=Math.sign(Number(deltaY)||0),intensity=clamp(Math.abs(Number(deltaY)||0)/100,.55,1.5);return Math.exp(-direction*.32*intensity);}

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
 vec4 surface=texture2D(uTexture,vUV);
 vec3 color=surface.rgb;
 float land=smoothstep(.46,.82,surface.a);
 float light=max(dot(normal,normalize(vec3(-.55,.7,1.2))),0.);
 float luminance=dot(color,vec3(.2126,.7152,.0722));
 color=mix(vec3(luminance),color,1.16);
 color*=.64+.48*light;
 float glow=pow(1.-max(normal.z,0.),3.);
 color+=mix(vec3(.055,.24,.39),vec3(.06,.16,.13),land)*glow;
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
 color+=vec3(.26,.49,.64)*spec*.38*(1.-land*.86);
 gl_FragColor=vec4(color,1.);
}`;

function createTexture(polygons){
 const width=2048,height=1024,atlas=document.createElement('canvas');atlas.width=width;atlas.height=height;
 const ctx=atlas.getContext('2d'),layer=document.createElement('canvas'),mask=document.createElement('canvas');layer.width=mask.width=width;layer.height=mask.height=height;
 const layerCtx=layer.getContext('2d'),maskCtx=mask.getContext('2d');
 const trace=(target,polygon)=>{target.beginPath();polygon.forEach(([lon,lat],i)=>{const x=(lon+180)/360*width,y=(90-lat)/180*height;i?target.lineTo(x,y):target.moveTo(x,y);});target.closePath();};

 const ocean=ctx.createLinearGradient(0,0,0,height);ocean.addColorStop(0,'#062e58');ocean.addColorStop(.18,'#07527d');ocean.addColorStop(.5,'#087daf');ocean.addColorStop(.82,'#075078');ocean.addColorStop(1,'#062b52');ctx.fillStyle=ocean;ctx.fillRect(0,0,width,height);
 const seaLight=ctx.createRadialGradient(width*.54,height*.42,20,width*.54,height*.42,width*.55);seaLight.addColorStop(0,'#42b5c42b');seaLight.addColorStop(.58,'#117fa319');seaLight.addColorStop(1,'#031a3800');ctx.fillStyle=seaLight;ctx.fillRect(0,0,width,height);

 maskCtx.fillStyle='#fff';
 for(const polygon of polygons){
  trace(maskCtx,polygon);maskCtx.fill();
 }

 // Blur the land silhouette into the ocean before drawing terrain to suggest shallow coastal water.
 layerCtx.fillStyle='#55d5c8';layerCtx.drawImage(mask,0,0);ctx.save();ctx.globalAlpha=.38;ctx.filter='blur(13px)';ctx.drawImage(layer,0,0);ctx.restore();layerCtx.clearRect(0,0,width,height);

 const land=layerCtx.createLinearGradient(0,0,0,height);land.addColorStop(0,'#edf4ee');land.addColorStop(.12,'#9fbda0');land.addColorStop(.25,'#61975e');land.addColorStop(.42,'#3f914e');land.addColorStop(.5,'#318c4c');land.addColorStop(.63,'#4b9853');land.addColorStop(.82,'#789c70');land.addColorStop(1,'#eef3ed');layerCtx.fillStyle=land;layerCtx.fillRect(0,0,width,height);
 const paintBiome=(lon,lat,rx,ry,color,opacity=1)=>{const x=(lon+180)/360*width,y=(90-lat)/180*height,sx=rx/360*width,sy=ry/180*height;layerCtx.save();layerCtx.translate(x,y);layerCtx.scale(sx,sy);const gradient=layerCtx.createRadialGradient(0,0,0,0,0,1);gradient.addColorStop(0,color);gradient.addColorStop(.68,color);gradient.addColorStop(1,'rgba(0,0,0,0)');layerCtx.globalAlpha=opacity;layerCtx.fillStyle=gradient;layerCtx.beginPath();layerCtx.arc(0,0,1,0,Math.PI*2);layerCtx.fill();layerCtx.restore();};

 // Broad climate regions keep the stylisation geographic without borrowing satellite imagery.
 for(const area of [[-63,-5,31,19,'#176a3d',.78],[23,0,18,13,'#1b7040',.8],[106,8,25,19,'#1d7544',.76],[-84,37,19,14,'#397e47',.54],[18,50,29,14,'#4d8650',.5],[80,20,16,15,'#438e47',.48],[111,28,19,12,'#397f43',.5]])paintBiome(...area);
 for(const area of [[10,24,42,16,'#d4aa62',.96],[47,24,18,10,'#d1a25a',.94],[62,39,25,12,'#bba268',.76],[104,42,20,9,'#c4aa6b',.82],[134,-25,27,17,'#c89c54',.94],[22,-24,15,12,'#c09a5a',.78],[-70,-24,7,15,'#c49a5f',.84],[-111,31,14,10,'#c4a164',.72],[-69,-44,10,11,'#ad9568',.65]])paintBiome(...area);
 for(const area of [[84,31,28,7,'#c9c8b0',.68],[-72,-18,7,42,'#9f8f68',.62],[-112,45,9,28,'#8d8969',.55],[38,8,8,17,'#9b8b61',.5]])paintBiome(...area);

 // Deterministic fine variation gives terrain and water a tactile, topographic finish.
 let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<28000;i++){const x=random()*width,y=random()*height;layerCtx.fillStyle=i%3?'#f4f1cf0a':'#082d2510';layerCtx.fillRect(x,y,random()*3.4+.6,random()*2.2+.5);}
 layerCtx.globalCompositeOperation='destination-in';layerCtx.drawImage(mask,0,0);layerCtx.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0);

 ctx.strokeStyle='#e8f6d985';ctx.lineWidth=1;
 for(const polygon of polygons){trace(ctx,polygon);ctx.stroke();}
 for(let i=0;i<9000;i++){const x=random()*width,y=random()*height;ctx.fillStyle=i%2?'#b6eff408':'#031b3311';ctx.fillRect(x,y,random()*2.6+.4,random()*1.6+.4);}

 // Preserve a land mask in alpha so the shader can restrict ocean specular highlights.
 const pixels=ctx.getImageData(0,0,width,height),landPixels=maskCtx.getImageData(0,0,width,height).data;
 for(let i=0;i<landPixels.length;i+=4)pixels.data[i+3]=landPixels[i+3]>24?255:76;
 ctx.putImageData(pixels,0,0);
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
  const selected=cities.find(c=>c.id===state.selected),heatCities=[selected,...cities.filter(c=>c!==selected)].filter(Boolean).slice(0,48);
  heatCities.forEach((c,i)=>{const v=geoVector(c.lat,c.lon),r=reading(c,state.hour),value=state.metric==='temp'?r.temp:r.aqi;if(Number.isFinite(value))points.set([...v,value],i*4);});gl.uniform4fv(uniforms['uCities[0]'],points);
  gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 }};
}

// A real orthographic 3D projection also works when a device disables WebGL.
function makeCanvasFallback(canvas,polygons){
 let ctx=canvas.getContext('2d');
 const vectors=polygons.map(p=>p.map(([lon,lat])=>geoVector(lat,lon)));
 return {draw(state,l){
  const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(l.w*dpr)||canvas.height!==Math.round(l.h*dpr)){canvas.width=Math.round(l.w*dpr);canvas.height=Math.round(l.h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,l.w,l.h);
  const ocean=ctx.createRadialGradient(l.cx-l.r*.35,l.cy-l.r*.4,l.r*.05,l.cx,l.cy,l.r);ocean.addColorStop(0,'#1598bb');ocean.addColorStop(.68,'#0874a3');ocean.addColorStop(1,'#062f5c');ctx.fillStyle=ocean;ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.clip();
  for(const poly of vectors){let prev=rotateVector(poly.at(-1),state.lon,state.lat);ctx.beginPath();let began=false;
   for(const v of poly){const cur=rotateVector(v,state.lon,state.lat);if(cur[2]>=0){if(prev[2]<0){const f=-prev[2]/(cur[2]-prev[2]);let x=prev[0]+(cur[0]-prev[0])*f,y=prev[1]+(cur[1]-prev[1])*f;const m=Math.hypot(x,y);x/=m;y/=m;ctx.moveTo(l.cx+x*l.r,l.cy-y*l.r);}else if(!began)ctx.moveTo(l.cx+cur[0]*l.r,l.cy-cur[1]*l.r);else ctx.lineTo(l.cx+cur[0]*l.r,l.cy-cur[1]*l.r);began=true;}else if(prev[2]>=0){const f=prev[2]/(prev[2]-cur[2]);let x=prev[0]+(cur[0]-prev[0])*f,y=prev[1]+(cur[1]-prev[1])*f;const m=Math.hypot(x,y);ctx.lineTo(l.cx+x/m*l.r,l.cy-y/m*l.r);}prev=cur;}
   ctx.fillStyle='#5f9e59';ctx.strokeStyle='#e8f6d985';ctx.lineWidth=.75;ctx.fill();ctx.stroke();
  }
  if(state.grid){ctx.strokeStyle='#d8f6ff2a';ctx.lineWidth=.6;for(let lat=-75;lat<=75;lat+=15){drawProjectedLine(ctx,l,state,Array.from({length:181},(_,i)=>geoVector(lat,i*2-180)));}for(let lon=-180;lon<180;lon+=15){drawProjectedLine(ctx,l,state,Array.from({length:91},(_,i)=>geoVector(i*2-90,lon)));}}
  if(state.heat)for(const c of cities){const v=rotateVector(geoVector(c.lat,c.lon),state.lon,state.lat);if(v[2]<0)continue;const r=reading(c,state.hour);if(!Number.isFinite(state.metric==='temp'?r.temp:r.aqi))continue;const color=state.metric==='temp'?temperatureColor(r.temp):r.color,x=l.cx+v[0]*l.r,y=l.cy-v[1]*l.r,g=ctx.createRadialGradient(x,y,0,x,y,l.r*.1);g.addColorStop(0,color+'65');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-l.r*.1,y-l.r*.1,l.r*.2,l.r*.2);}
  const shadow=ctx.createLinearGradient(l.cx-l.r,l.cy-l.r,l.cx+l.r,l.cy+l.r);shadow.addColorStop(0,'#12345400');shadow.addColorStop(1,'#061f5a8a');ctx.fillStyle=shadow;ctx.fillRect(l.cx-l.r,l.cy-l.r,l.r*2,l.r*2);ctx.restore();
 }};
}
function drawProjectedLine(ctx,l,s,points){ctx.beginPath();let connected=false;for(const v of points){const p=rotateVector(v,s.lon,s.lat);if(p[2]>0){if(connected)ctx.lineTo(l.cx+p[0]*l.r,l.cy-p[1]*l.r);else ctx.moveTo(l.cx+p[0]*l.r,l.cy-p[1]*l.r);connected=true;}else connected=false;}ctx.stroke();}
function projectedPath(l,s,lines){const path=new Path2D();for(const points of lines){let connected=false;for(const v of points){const p=rotateVector(v,s.lon,s.lat);if(p[2]>.015){const x=l.cx+p[0]*l.r,y=l.cy-p[1]*l.r;if(connected)path.lineTo(x,y);else path.moveTo(x,y);connected=true;}else connected=false;}}return path;}
function vectorToGeo(vector){const length=Math.hypot(...vector)||1,x=vector[0]/length,y=vector[1]/length,z=vector[2]/length;return {lat:Math.asin(clamp(y,-1,1))*180/Math.PI,lon:Math.atan2(x,z)*180/Math.PI};}

export class Globe {
 constructor({canvas,effects,markers,atmosphere,state,onRotate,onFrame,onZoom}){
  Object.assign(this,{canvas,effects,markers,atmosphere,state,onRotate,onFrame,onZoom});this.ctx=effects.getContext('2d');this.layout={w:0,h:0,r:0,cx:0,cy:0};this.pointerMap=new Map();this.lastTime=0;this.dirty=true;this.active=true;this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;this.countries=[];this.adminPlaces=[];this.adminLines=[];this.clusterEls=[];this.markerBoxes=[];this.overlayBoxes=[];this.labelMeasurements=new Map();this.drawnCountryNames=[];
  this.pins=cities.map((c,index)=>{const el=document.createElement('button');el.className='pin';el.type='button';el.hidden=true;el.dataset.city=c.id;el.style.setProperty('--pulse-delay',`${-(index%17)*.31}s`);el.setAttribute('aria-label',`Select ${c.name}`);el.innerHTML='<span class="pin-value"></span><span class="pin-label" hidden></span>';markers.append(el);return {city:c,el,value:el.firstElementChild,label:el.lastElementChild,vec:geoVector(c.lat,c.lon)};});
  let seed=28;this.particles=Array.from({length:95},()=>{seed=(seed*1664525+1013904223)>>>0;const a=seed/4294967296;seed=(seed*1664525+1013904223)>>>0;return {lon:a*360-180,lat:(seed/4294967296)*130-65,speed:1+a*3,length:2+a*5};});
  this.bind();this.resizeObserver=new ResizeObserver(()=>{this.measure();this.dirty=true;});this.resizeObserver.observe(canvas.parentElement);this.measure();this.syncZoomUi();
 }
 async init(){
  const responses=await Promise.all([fetch('./world.json'),fetch('./countries.json'),fetch('./admin1.json')]);if(responses.some(r=>!r.ok))throw new Error('World geography could not load');const [polygons,countries,admin]=await Promise.all(responses.map(r=>r.json()));this.countries=countries.map(c=>({...c,vec:geoVector(c.lat,c.lon)}));this.adminPlaces=admin.places.map(place=>({...place,vec:geoVector(place.lat,place.lon)}));this.adminLines=admin.lines.map(line=>line.map(([lon,lat])=>geoVector(lat,lon)));
  try{this.renderer=makeWebGL(this.canvas,polygons);}catch(error){
   // A canvas cannot change context types after WebGL has initialized. Replace it for the fallback.
   const replacement=this.canvas.cloneNode();this.canvas.replaceWith(replacement);this.canvas=replacement;this.bindCanvas();this.renderer=makeCanvasFallback(replacement,polygons);
  }
  this.dirty=true;requestAnimationFrame(t=>this.tick(t));
 }
 measure(){const stage=this.canvas.parentElement,rect=stage.getBoundingClientRect(),w=rect.width,h=rect.height,mobile=innerWidth<=760;let r,cx,cy;if(mobile){r=Math.min(w*.425,180);cx=w*.5;cy=278;}else{r=Math.min(h*.375,w*.345);cx=w*.415;cy=h*.51+15;}this.layout={w,h,r:r*this.state.zoom,cx,cy};this.atmosphere.style.cssText=`left:${cx}px;top:${cy}px;width:${this.layout.r*2.7}px;height:${this.layout.r*2.7}px;`;this.overlayBoxes=[...stage.querySelectorAll('.city-detail,.stage-intro,.stage-top-right,.legend,.layer-switches,.timeline,.map-tools')].map(el=>{const b=el.getBoundingClientRect();return {left:b.left-rect.left-5,right:b.right-rect.left+5,top:b.top-rect.top-5,bottom:b.bottom-rect.top+5};});}
 project(v,altitude=1){const p=rotateVector(v,this.state.lon,this.state.lat),l=this.layout;return {x:l.cx+p[0]*l.r*altitude,y:l.cy-p[1]*l.r*altitude,z:p[2]};}
 focus(city){this.focusPlace(city,Math.max(this.state.zoom,CITY_DETAIL_ZOOM));}
 focusPlace(place,zoom=CITY_DETAIL_ZOOM){this.state.rotating=false;this.focusedPlace=place;const delta=((place.lon-this.state.lon+540)%360)-180;this.target={lon:this.state.lon+delta,lat:clamp(place.lat,-80,80),zoom:clamp(zoom,MIN_ZOOM,MAX_ZOOM)};this.dirty=true;}
 getSearchPlaces(){return [...this.countries.map(country=>({kind:'country',name:country.name,country:country.name,lat:country.lat,lon:country.lon,zoom:country.rank<=2?1.7:2.1})),...this.adminPlaces.map(place=>({kind:'subdivision',...place,zoom:Math.max(3.6,Math.min(4.6,place.minZoom+1))}))];}
 syncZoomUi(){this.markers.classList.toggle('detail-zoom',this.state.zoom>=2.3);this.onZoom?.(this.state.zoom);}
 geographicAt(clientX,clientY){const rect=this.canvas.getBoundingClientRect(),x=(clientX-rect.left-this.layout.cx)/this.layout.r,y=(this.layout.cy-(clientY-rect.top))/this.layout.r,squared=x*x+y*y;if(squared>=1)return null;const z=Math.sqrt(1-squared),yaw=rad(this.state.lon),pitch=rad(this.state.lat),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),worldY=y*cp+z*sp,worldZ=-y*sp+z*cp,worldX=x*cy+worldZ*sy,finalZ=-x*sy+worldZ*cy;return vectorToGeo([worldX,worldY,finalZ]);}
 zoomTo(value,anchor){this.target=null;const old=this.state.zoom,next=clamp(value,MIN_ZOOM,MAX_ZOOM),point=anchor?this.geographicAt(anchor.x,anchor.y):null;if(next===old){this.syncZoomUi();return;}if(point){const fraction=1-old/next,delta=((point.lon-this.state.lon+540)%360)-180;this.state.lon+=delta*fraction;this.state.lat=clamp(this.state.lat+(point.lat-this.state.lat)*fraction,-80,80);}this.state.zoom=next;this.measure();this.syncZoomUi();this.dirty=true;}
 zoom(amount,anchor){this.zoomTo(this.state.zoom+amount,anchor);}
 zoomByFactor(factor,anchor){this.zoomTo(this.state.zoom*factor,anchor);}
 reset(){this.target={lon:this.state.lon+((98-this.state.lon+540)%360)-180,lat:16,zoom:1};this.dirty=true;}
 refresh(){this.dirty=true;}
 setActive(active){this.active=Boolean(active);this.lastTime=0;this.dirty=true;}
 bind(){this.bindCanvas();document.addEventListener('visibilitychange',()=>{this.lastTime=0;this.dirty=true;});}
 bindCanvas(){const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;c.focus({preventScroll:true});c.setPointerCapture(e.pointerId);this.pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,type:e.pointerType});this.target=null;this.state.rotating=false;this.onRotate?.();c.classList.add('dragging');if(this.pointerMap.size===2){this.pinchDistance=this.getPinchDistance();this.didPinch=true;}});
  c.addEventListener('pointermove',e=>{const previous=this.pointerMap.get(e.pointerId);if(!previous)return;this.pointerMap.set(e.pointerId,{...previous,x:e.clientX,y:e.clientY});if(this.pointerMap.size>=2){const distance=this.getPinchDistance();if(this.pinchDistance&&distance>0)this.zoomByFactor(Math.pow(distance/this.pinchDistance,1.25),this.getPinchCentre());this.pinchDistance=distance;}else{this.state.lon-=(e.clientX-previous.x)*.3;this.state.lat=clamp(this.state.lat+(e.clientY-previous.y)*.3,-80,80);this.dirty=true;}});
  const release=e=>{const point=this.pointerMap.get(e.pointerId);if(e.type==='pointerup'&&point?.type==='touch'&&!this.didPinch&&Math.hypot(point.x-point.startX,point.y-point.startY)<12){const now=performance.now(),tap={time:now,x:point.x,y:point.y};if(this.lastTouchTap&&now-this.lastTouchTap.time<360&&Math.hypot(tap.x-this.lastTouchTap.x,tap.y-this.lastTouchTap.y)<30){this.zoomByFactor(1.75,{x:tap.x,y:tap.y});this.lastTouchTap=null;}else this.lastTouchTap=tap;}this.pointerMap.delete(e.pointerId);this.pinchDistance=null;if(!this.pointerMap.size){c.classList.remove('dragging');this.didPinch=false;}};c.addEventListener('pointerup',release);c.addEventListener('pointercancel',release);c.addEventListener('lostpointercapture',release);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoomByFactor(wheelZoomFactor(e.deltaY),{x:e.clientX,y:e.clientY});},{passive:false});
  c.addEventListener('dblclick',e=>{e.preventDefault();this.zoomByFactor(1.75,{x:e.clientX,y:e.clientY});});
  c.addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'];if(!keys.includes(e.key))return;e.preventDefault();this.target=null;this.state.rotating=false;this.onRotate?.();if(e.key==='ArrowLeft')this.state.lon-=8;if(e.key==='ArrowRight')this.state.lon+=8;if(e.key==='ArrowUp')this.state.lat=clamp(this.state.lat+8,-80,80);if(e.key==='ArrowDown')this.state.lat=clamp(this.state.lat-8,-80,80);if(e.key==='+'||e.key==='=')this.zoomByFactor(1.5);if(e.key==='-')this.zoomByFactor(1/1.5);if(e.key==='0')this.reset();this.dirty=true;});
  c.addEventListener('webglcontextlost',e=>{e.preventDefault();const s=document.getElementById('canvas-status');s.hidden=false;s.textContent='The 3D view paused. Reload this page to restore your globe.';});
 }
 getPinchDistance(){const [a,b]=this.pointerMap.values();return Math.hypot(a.x-b.x,a.y-b.y);}
 getPinchCentre(){const [a,b]=this.pointerMap.values();return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
 tick(time){
  requestAnimationFrame(t=>this.tick(t));if(document.hidden||!this.active){this.lastTime=0;return;}
  const dt=this.lastTime?Math.min((time-this.lastTime)/1000,.05):0;this.lastTime=time;let moved=false;
  if(this.target){const f=this.reducedMotion?1:1-Math.exp(-dt*10),zooming=Math.abs(this.target.zoom-this.state.zoom)>.002;this.state.lon+=(this.target.lon-this.state.lon)*f;this.state.lat+=(this.target.lat-this.state.lat)*f;if(zooming){this.state.zoom+=(this.target.zoom-this.state.zoom)*f;this.measure();this.syncZoomUi();}if(Math.abs(this.target.lon-this.state.lon)<.05&&Math.abs(this.target.lat-this.state.lat)<.05&&!zooming){this.state.lon=this.target.lon;this.state.lat=this.target.lat;this.state.zoom=this.target.zoom;this.measure();this.syncZoomUi();this.target=null;}moved=true;}
  else if(this.state.rotating){this.state.lon+=dt*1.8;moved=true;}
  this.onFrame?.(dt);const redraw=moved||this.dirty;
  if(redraw){this.renderer.draw(this.state,this.layout);this.drawMarkers();this.dirty=false;}
  if(!redraw&&(this.reducedMotion||time-(this.lastEffectsTime||0)<1000/30))return;
  this.lastEffectsTime=time;this.drawEffects(time/1000);this.drawCountryLabels();
 }

 drawEffects(time){const ctx=this.ctx,l=this.layout,dpr=Math.min(devicePixelRatio||1,2);if(this.effects.width!==Math.round(l.w*dpr)||this.effects.height!==Math.round(l.h*dpr)){this.effects.width=Math.round(l.w*dpr);this.effects.height=Math.round(l.h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,l.w,l.h);
  if(this.state.labels&&this.state.zoom>=2.15&&this.adminLines.length){const key=[this.state.lon.toFixed(2),this.state.lat.toFixed(2),this.state.zoom.toFixed(3),l.w,l.h].join(':');if(key!==this.adminPathKey){this.adminPath=projectedPath(l,this.state,this.adminLines);this.adminPathKey=key;}ctx.save();ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.clip();ctx.strokeStyle='rgba(214,249,242,.3)';ctx.lineWidth=clamp(this.state.zoom*.33,.72,1.25);ctx.stroke(this.adminPath);ctx.restore();}
  if(!this.reducedMotion){ctx.strokeStyle='#c1f6ff80';ctx.lineWidth=.7;ctx.save();ctx.beginPath();ctx.arc(l.cx,l.cy,l.r,0,Math.PI*2);ctx.clip();for(const p of this.particles){const a=geoVector(p.lat,p.lon+time*p.speed),b=geoVector(p.lat+.5,p.lon+time*p.speed+p.length),start=this.project(a,1.008),end=this.project(b,1.008);if(start.z<.12||end.z<.12)continue;ctx.globalAlpha=Math.min(start.z,.65);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo((start.x+end.x)/2,(start.y+end.y)/2-1,end.x,end.y);ctx.stroke();}ctx.restore();}
  const selected=cities.find(c=>c.id===this.state.selected),p=this.project(geoVector(selected.lat,selected.lon));if(p.z>.05){const rr=reading(selected,this.state.hour),pulse=this.reducedMotion?0:(time*.4)%1;ctx.globalAlpha=(1-pulse)*.5;ctx.strokeStyle=rr.color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,10+pulse*18,(10+pulse*18)*Math.max(.35,p.z),0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 drawMarkers(){
  const selected=this.state.selected,visible=[];this.markerBoxes=[];
  for(const element of this.clusterEls)element.hidden=true;
  for(const pin of this.pins){const c=pin.city,p=this.project(pin.vec,1.015),r=reading(c,this.state.hour),chosen=c.id===selected;pin.el.hidden=true;pin.el.classList.remove('label-visible');if(p.z<.10||p.x<10||p.x>this.layout.w-10||p.y<10||p.y>this.layout.h-10)continue;visible.push({pin,p,r,chosen});}
  let individuals=visible;
  if(this.state.zoom<2.3){
   const cell=Math.round(clamp(78-this.state.zoom*15,46,68)),groups=new Map(),chosen=visible.find(entry=>entry.chosen);individuals=chosen?[chosen]:[];
   for(const entry of visible){if(entry.chosen)continue;const key=Math.floor(entry.p.x/cell)+':'+Math.floor(entry.p.y/cell);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(entry);}
   let clusterIndex=0;
   for(const group of groups.values()){
    if(group.length===1){individuals.push(group[0]);continue;}
    const element=this.clusterElement(clusterIndex++),x=group.reduce((sum,item)=>sum+item.p.x,0)/group.length,y=group.reduce((sum,item)=>sum+item.p.y,0)/group.length,centre=vectorToGeo(group.reduce((sum,item)=>sum.map((value,index)=>value+item.pin.vec[index]),[0,0,0]));
    element.hidden=false;element.style.left=x+'px';element.style.top=y+'px';element.textContent=group.length;element.dataset.lat=centre.lat;element.dataset.lon=centre.lon;element.setAttribute('aria-label',`${group.length} cities nearby. Zoom in to explore.`);this.markerBoxes.push({left:x-22,right:x+22,top:y-22,bottom:y+22});
   }
  }
  individuals.sort((a,b)=>Number(b.chosen)-Number(a.chosen)||b.p.z-a.p.z);const placed=[],labelBoxes=[],mobile=innerWidth<=760,maxLabels=mobile?4:8,overlaps=(a,b)=>a.left<b.right+8&&a.right>b.left-8&&a.top<b.bottom+6&&a.bottom>b.top-6;
  for(const {pin,p,r,chosen} of individuals){
   const overlap=placed.some(other=>Math.hypot(other.x-p.x,other.y-p.y)<(chosen?0:29));if(overlap&&!chosen)continue;placed.push(p);pin.el.hidden=false;
   const half=chosen?20:16;this.markerBoxes.push({left:p.x-half,right:p.x+half,top:p.y-half,bottom:p.y+half});
   const labelWidth=Math.max(72,pin.city.name.length*7+28),labelBox={left:p.x-labelWidth/2,right:p.x+labelWidth/2,top:p.y+24,bottom:p.y+58},inside=labelBox.left>8&&labelBox.right<this.layout.w-8&&labelBox.bottom<this.layout.h-8,clear=!labelBoxes.some(box=>overlaps(labelBox,box))&&!this.overlayBoxes.some(box=>overlaps(labelBox,box)),showLabel=chosen||(this.state.zoom>=2.3&&labelBoxes.length<maxLabels&&inside&&clear);
   pin.el.classList.toggle('label-visible',showLabel);if(showLabel){labelBoxes.push(labelBox);this.markerBoxes.push(labelBox);}
   pin.el.style.left=p.x+'px';pin.el.style.top=p.y+'px';pin.el.style.opacity=clamp(p.z*2,.65,1);const missing=!Number.isFinite(this.state.metric==='temp'?r.temp:r.aqi),color=missing?'#a5bacb':this.state.metric==='temp'?temperatureColor(r.temp):r.color;pin.el.style.setProperty('--pin-color',color);pin.el.style.setProperty('--pin-glow',color+'66');pin.el.classList.toggle('selected',chosen);pin.value.textContent=missing?'—':this.state.metric==='temp'?r.temp+'°':r.aqi;pin.label.hidden=false;pin.label.textContent=pin.city.name;pin.el.setAttribute('aria-label',`${pin.city.name}: ${r.aqi===null?'no reading loaded':r.aqi+' US AQI'}, ${r.source==='IQAir'?'IQAir observation':'select to load live data'}. Select city.`);
  }
 }
 clusterElement(index){if(this.clusterEls[index])return this.clusterEls[index];const element=document.createElement('button');element.type='button';element.className='city-cluster';element.hidden=true;element.addEventListener('click',()=>this.focusPlace({lat:Number(element.dataset.lat),lon:Number(element.dataset.lon)},Math.min(MAX_ZOOM,Math.max(this.state.zoom*1.75,this.state.zoom+1.2))));this.markers.append(element);this.clusterEls.push(element);return element;}
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
  if(this.state.zoom>=2.9){
   const preferred=this.focusedPlace?.kind==='subdivision'?this.focusedPlace.name:selected?.subdivision,admins=this.adminPlaces.map(place=>({place,p:this.project(place.vec,1.003)})).filter(({place,p})=>p.z>.28&&this.state.zoom>=Math.max(2.9,place.minZoom)&&place.name!==selected?.name).sort((a,b)=>Number(b.place.name===preferred)-Number(a.place.name===preferred)||a.place.rank-b.place.rank||b.p.z-a.p.z);
   let shown=0;ctx.lineWidth=2.8;ctx.strokeStyle='rgba(242,255,252,.78)';ctx.fillStyle='#1c5260';
   for(const {place,p} of admins){if(shown>=(mobile?10:18))break;const size=mobile?8:9;ctx.font=`600 ${size}px "Segoe UI", Arial, sans-serif`;const text=place.name.toLocaleUpperCase('en'),key='admin:'+size+':'+text;if(!this.labelMeasurements.has(key))this.labelMeasurements.set(key,ctx.measureText(text).width);const width=this.labelMeasurements.get(key),offsets=[[0,0],[0,11],[0,-11],[11,0],[-11,0]];let placement;for(const [dx,dy] of offsets){const x=p.x+dx,y=p.y+dy,box={left:x-width/2-3,right:x+width/2+3,top:y-size/2-3,bottom:y+size/2+3};if(box.left<6||box.right>l.w-6||box.top<6||box.bottom>l.h-6||reserved.some(b=>overlaps(box,b)))continue;placement={x,y,box};break;}if(!placement)continue;ctx.globalAlpha=clamp((p.z-.2)/.35,.38,.82);ctx.strokeText(text,placement.x,placement.y);ctx.fillText(text,placement.x,placement.y);reserved.push(placement.box);shown++;
   }
  }
  ctx.restore();
 }
}
