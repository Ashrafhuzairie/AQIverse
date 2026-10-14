import test from 'node:test';
import assert from 'node:assert/strict';
import {coverageText,detailMapView,distanceKm,mapPoint} from '../public/local-map.js';

const city={id:'singapore',name:'Singapore',subdivision:'Singapore',country:'Singapore',lat:1.3521,lon:103.8198};

test('detail map falls back to the listed city centre',()=>{
 const view=detailMapView(city,{source:'demo',aqi:42,label:'Good',color:'#54e89b'});
 assert.equal(view.lat,1.3521);assert.equal(view.lon,103.8198);assert.match(view.context,/Listed city centre/);assert.match(view.external,/#map=14\/1\.352100\/103\.819800$/);
 assert.equal(view.aqi,42);assert.equal(view.aqiLabel,'Good');assert.equal(view.aqiSource,'Simulated reading');assert.equal(view.aqiColor,'#54e89b');assert.match(view.aqiAria,/US AQI 42, Good/);
});

test('map points and coverage labels distinguish live from simulated readings',()=>{
 const reported=mapPoint(city,{source:'IQAir',location:{lat:1.4,lon:103.9}});
 assert.deepEqual(reported,{lat:1.4,lon:103.9});assert(distanceKm(mapPoint(city),reported)>0);
 assert.equal(coverageText([1,2,3],2,'demo'),'Demo coverage · 2 of 3 simulated city readings in view');
 assert.equal(coverageText([],0,'live'),'Live IQAir · no observations loaded yet');
});

test('detail map prefers valid IQAir reporting coordinates',()=>{
 const record={source:'IQAir',location:{city:'Central Water Catchment',lat:1.38,lon:103.81}};const view=detailMapView(city,record);
 assert.equal(view.lat,1.38);assert.equal(view.lon,103.81);assert.equal(view.title,'Central Water Catchment');assert.match(view.context,/IQAir reporting location for Singapore/);
});

test('detail map ignores invalid live coordinates',()=>{
 const view=detailMapView(city,{source:'IQAir',location:{city:'Unknown',lat:null,lon:'not-a-number'}});
 assert.equal(view.lat,city.lat);assert.equal(view.lon,city.lon);assert.equal(view.title,city.name);
 assert.equal(view.aqi,null);assert.equal(view.aqiLabel,'Not loaded');assert.equal(view.aqiSource,'IQAir observation');
});
