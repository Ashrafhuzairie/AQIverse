import test from 'node:test';
import assert from 'node:assert/strict';
import {MIN_ZOOM,MAX_ZOOM,CITY_DETAIL_ZOOM,wheelZoomFactor} from '../public/globe.js';

test('globe uses a practical 600% ceiling with a detailed city preset',()=>{
 assert.equal(MAX_ZOOM,6);
 assert(MIN_ZOOM<CITY_DETAIL_ZOOM);
 assert(CITY_DETAIL_ZOOM<MAX_ZOOM);
});
test('wheel zoom reaches the ceiling in about six standard notches',()=>{
 const zoomIn=wheelZoomFactor(-100),zoomOut=wheelZoomFactor(100);
 assert(zoomIn>1.35);assert(zoomOut<.75);assert(Math.pow(zoomIn,6)>=MAX_ZOOM);
 assert(Math.abs(zoomIn*zoomOut-1)<1e-10);
});
