import test from 'node:test';
import assert from 'node:assert/strict';
import {filterCities,nearestCity,loadPreferences,savePreferences} from '../public/explorer.js';
import {setReadingMode,setLiveReading,reading,cities} from '../public/data.js';
test('search, regions, saved cities and sort operate together',()=>{
 setReadingMode('demo');assert.equal(filterCities({query:'sao paulo'})[0].id,'sao-paulo');assert.equal(filterCities({query:'karnataka'})[0].id,'bengaluru');assert(filterCities({region:'Asia'}).every(c=>c.region==='Asia'));assert.equal(filterCities({savedOnly:true,saved:['singapore']})[0].id,'singapore');assert.equal(filterCities({savedOnly:true,saved:[]}).length,0);
 const lowest=filterCities({sort:'lowest'});assert(reading(lowest[0]).aqi<=reading(lowest.at(-1)).aqi);
});
test('globe includes expanded Malaysia and Singapore coverage',()=>{
 assert.equal(cities.length,163);
 for(const id of ['johor-bahru','kuala-lumpur','george-town','kangar','ipoh','kota-kinabalu','bukit-timah','changi','woodlands','tampines'])assert(cities.some(city=>city.id===id),`${id} should be listed`);
 assert.equal(new Set(cities.map(city=>city.id)).size,cities.length);
});
test('globe includes broader worldwide city and state coverage',()=>{
 for(const id of ['bandung','chengdu','hyderabad','manchester','barcelona','san-francisco','calgary','brasilia','durban','adelaide','christchurch'])assert(cities.some(city=>city.id===id),`${id} should be listed`);
 assert(cities.every(city=>city.subdivision), 'every listed location should include its state or province');
});
test('live mode never substitutes demo data for unloaded locations',()=>{
 setReadingMode('live');assert.equal(reading(cities.find(c=>c.id==='tokyo')).aqi,null);
 setLiveReading('singapore',{aqi:42,pm:null,temp:29,humidity:78});assert.equal(reading(cities.find(c=>c.id==='singapore')).source,'IQAir');assert.equal(filterCities({sort:'lowest'})[0].id,'singapore');setReadingMode('demo');
});
test('nearest listed city uses geographic distance and rejects invalid coordinates',()=>{
 const n=nearestCity(1.3521,103.8198);assert.equal(n.city.id,'singapore');assert(n.distance<.001);assert.equal(nearestCity(999,0),null);assert.equal(nearestCity(NaN,0),null);
});
test('stored preferences are validated and blocked storage degrades gracefully',()=>{
 const storage={getItem:()=>JSON.stringify({selected:'invalid',metric:'pm',saved:['singapore','invalid','singapore'],speed:900})};const p=loadPreferences(storage);assert.equal(p.selected,'singapore');assert.equal(p.metric,'aqi');assert.deepEqual(p.saved,['singapore']);assert.equal(p.speed,1);
 assert.equal(loadPreferences(null).selected,'singapore');assert.equal(savePreferences(null,{}),false);
});
