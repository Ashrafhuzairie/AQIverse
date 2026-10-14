import test from 'node:test';
import assert from 'node:assert/strict';
import {MIN_ZOOM,MAX_ZOOM,CITY_DETAIL_ZOOM} from '../public/globe.js';

test('globe supports the requested 1000% zoom ceiling',()=>{
 assert.equal(MAX_ZOOM,10);
 assert(MIN_ZOOM<CITY_DETAIL_ZOOM);
 assert(CITY_DETAIL_ZOOM<MAX_ZOOM);
});
