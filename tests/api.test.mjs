import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{normalizeIqair,normalizeStation} from '../worker/index.js';
const city={id:'singapore',lat:1.3521,lon:103.8198};
function provider(extra={}){return {status:'success',data:{city:'Singapore',country:'Singapore',location:{coordinates:[103.82,1.35]},current:{pollution:{aqius:42,mainus:'o3',ts:'2026-10-14T08:00:00Z',...extra},weather:{tp:29,hu:78,ts:'2026-10-14T08:00:00Z'}}}};}
test('live PM2.5 is unavailable when the provider omits concentration',()=>{
 const r=normalizeIqair(provider(),city);assert.equal(r.aqi,42);assert.equal(r.pm,null);assert.equal(r.mainPollutant,'o3');assert.equal(r.temp,29);assert.equal(r.humidity,78);assert.equal(r.observedAt,'2026-10-14T08:00:00.000Z');
});
test('reported zero values remain zero, and invalid AQI is rejected',()=>{
 const p=provider({aqius:0,p2:{conc:0}});p.data.current.weather.tp=0;p.data.current.weather.hu=0;
 const r=normalizeIqair(p,city);assert.equal(r.aqi,0);assert.equal(r.pm,0);assert.equal(r.temp,0);assert.equal(r.humidity,0);assert.equal(normalizeIqair(provider({aqius:null}),city),null);
});
test('unsupported PM units are not relabelled as micrograms',()=>{
 const p=provider({p2:{conc:13.2}});p.data.units={p2:'unsupported'};assert.equal(normalizeIqair(p,city).pm,null);
});
test('station observations retain exact coordinates and pollutant details',()=>{
 const payload={status:'success',data:{name:'Downtown sensor',city:'Singapore',state:'Singapore',country:'Singapore',location:{coordinates:[103.851,1.291]},units:{p2:'ugm3',p1:'ugm3'},current:{pollution:{aqius:57,mainus:'p2',ts:'2026-10-15T08:00:00Z',p2:{conc:15.2,aqius:57},p1:{conc:24.1,aqius:22}},weather:{tp:30,hu:74}}}};
 const record=normalizeStation(payload);assert.equal(record.name,'Downtown sensor');assert.equal(record.aqi,57);assert.deepEqual(record.location,{city:'Singapore',state:'Singapore',country:'Singapore',lat:1.291,lon:103.851});assert.equal(record.pollutants.p2.concentration,15.2);assert.equal(record.pollutants.p1.aqi,22);
});
test('API keeps credentials private, validates cities, caches results and reports failures',async()=>{
 const originalFetch=globalThis.fetch,originalNow=Date.now;let calls=0,clock=Date.parse('2026-10-14T09:00:00Z'),failure=false;
 Date.now=()=>clock;
 globalThis.fetch=async url=>{calls++;assert.equal(new URL(url).hostname,'api.airvisual.com');assert.equal(new URL(url).searchParams.get('key'),'MOCK_KEY_NEVER_EXPOSE');return new Response(JSON.stringify(failure?{status:'fail',data:{message:'incorrect_api_key',debug:'MOCK_KEY_NEVER_EXPOSE'}}:provider()),{status:200,headers:{'Content-Type':'application/json'}});};
 const env={IQAir_API_KEY:'MOCK_KEY_NEVER_EXPOSE'},request=path=>new Request('https://example.test'+path);
 try{
  const config=await worker.fetch(request('/api/config'),env);assert.equal((await config.json()).configured,true);
  const invalid=await worker.fetch(request('/api/air-quality?city=__proto__'),env);assert.equal(invalid.status,404);assert.equal(calls,0);
  const first=await worker.fetch(request('/api/air-quality?city=singapore'),env),body=await first.text();assert(!body.includes(env.IQAir_API_KEY));assert.equal(JSON.parse(body).record.pm,null);assert.equal(calls,1);
  const cached=await worker.fetch(request('/api/air-quality?city=singapore'),env);assert.equal((await cached.json()).cached,true);assert.equal(calls,1);
  clock+=16000;const refreshed=await worker.fetch(request('/api/air-quality?city=singapore&refresh=1'),env);assert.equal((await refreshed.json()).cached,false);assert.equal(calls,2);
  const spaced=await worker.fetch(request('/api/air-quality?city=tokyo'),env);assert.equal(spaced.status,429);assert.equal(calls,2);
  clock+=16000;failure=true;const rejected=await worker.fetch(request('/api/air-quality?city=tokyo'),env);assert.equal(rejected.status,401);assert(!(await rejected.text()).includes(env.IQAir_API_KEY));
  const frontend=await worker.fetch(request('/app.js'),env);assert.equal(frontend.status,200);assert(!(await frontend.text()).includes(env.IQAir_API_KEY));
  assert.equal((await worker.fetch(new Request('https://example.test/api/config',{method:'POST'}),env)).status,405);
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow;}
});
test('station API loads a bounded exact-reading bundle for a selected city',async()=>{
 const originalFetch=globalThis.fetch,originalNow=Date.now;let calls=0;Date.now=()=>Date.parse('2026-10-15T12:00:00Z');
 globalThis.fetch=async input=>{
  calls++;const url=new URL(input),path=url.pathname;
  assert.equal(url.searchParams.get('key'),'STATION_KEY');
  if(path.endsWith('/nearest_city'))return Response.json({status:'success',data:{city:'Paris',state:'Ile-de-France',country:'France',location:{coordinates:[2.3522,48.8566]},current:{pollution:{aqius:38,mainus:'p2',ts:'2026-10-15T11:00:00Z'},weather:{tp:17,hu:65}}}});
  if(path.endsWith('/stations'))return Response.json({status:'success',data:[{station:'Centre',location:{coordinates:[2.35,48.86]}},{station:'North',location:{coordinates:[2.37,48.9]}}]});
  const station=url.searchParams.get('station'),north=station==='North';return Response.json({status:'success',data:{name:station,city:'Paris',state:'Ile-de-France',country:'France',location:{coordinates:north?[2.37,48.9]:[2.35,48.86]},units:{p2:'ugm3'},current:{pollution:{aqius:north?44:36,mainus:'p2',ts:'2026-10-15T11:00:00Z',p2:{conc:north?10.8:8.7,aqius:north?44:36}},weather:{tp:17,hu:65}}}});
 };
 try{const response=await worker.fetch(new Request('https://example.test/api/stations?city=paris'),{IQAir_API_KEY:'STATION_KEY'}),body=await response.json();assert.equal(response.status,200);assert.equal(body.stations.length,2);assert.equal(body.total,2);assert.equal(body.limited,false);assert.equal(body.stations[0].source,'IQAir');assert.equal(calls,4);}
 finally{globalThis.fetch=originalFetch;Date.now=originalNow;}
});
