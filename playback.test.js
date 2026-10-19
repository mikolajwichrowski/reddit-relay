import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleEnough} from './playback.js';
test('playback visibility excludes slivers and handles tall media',()=>{
 const entry=(height,visible,ratio,intersects=true)=>({isIntersecting:intersects,intersectionRect:{height:visible},boundingClientRect:{height},intersectionRatio:ratio});
 assert.equal(visibleEnough(entry(400,300,.75)),true);
 assert.equal(visibleEnough(entry(400,20,.05)),false);
 assert.equal(visibleEnough(entry(1200,450,.375)),true);
 assert.equal(visibleEnough(entry(100,50,.5)),true);
 assert.equal(visibleEnough(entry(400,300,.75,false)),false);
});
