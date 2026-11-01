import test from "node:test";
import assert from "node:assert/strict";
import {createPostseasonState,getNextPostseasonFixture,recordPostseasonResult} from "../src/postseason-engine.js";
const standings=["brothers","lions","dragons","monkeys","guardians","hawks"].map((teamId,i)=>({teamId,wins:90-i*5,losses:30+i*5,winPct:.75-i*.04}));
test("top seed receives a bye and seeds two and three play a best-of-five",()=>{
 const p=createPostseasonState(standings,2026),f=getNextPostseasonFixture(p,121);
 assert.equal(p.seeds[0].teamId,"brothers");
 assert.equal(f.round,"semifinal");
 assert.deepEqual(new Set([f.homeId,f.awayId]),new Set(["lions","dragons"]));
 assert.equal(f.bestOf,5);
});
test("semifinal winner advances to a best-of-seven championship against top seed",()=>{
 const p=createPostseasonState(standings,2026);
 for(let n=0;n<3;n++){const f=getNextPostseasonFixture(p,121+n);recordPostseasonResult(p,f,{winnerId:"dragons",homeScore:4,awayScore:2});}
 assert.equal(p.round,"championship");
 const f=getNextPostseasonFixture(p,124);
 assert.equal(f.bestOf,7);
 assert.deepEqual(new Set([f.homeId,f.awayId]),new Set(["brothers","dragons"]));
});
test("championship completes when one club wins four games",()=>{
 const p=createPostseasonState(standings,2026);
 for(let n=0;n<3;n++){const f=getNextPostseasonFixture(p,121+n);recordPostseasonResult(p,f,{winnerId:"lions",homeScore:5,awayScore:1});}
 for(let n=0;n<4;n++){const f=getNextPostseasonFixture(p,124+n);recordPostseasonResult(p,f,{winnerId:"lions",homeScore:5,awayScore:1});}
 assert.equal(p.status,"complete");
 assert.equal(p.championId,"lions");
 assert.equal(getNextPostseasonFixture(p,130),null);
});
test("series follows 2-2-1 and 2-3-2 home-field patterns",()=>{
 const p=createPostseasonState(standings,2026);
 const homes=[];for(let n=0;n<5;n++){const f=getNextPostseasonFixture(p,121+n);homes.push(f.homeId);recordPostseasonResult(p,f,{winnerId:"lions",homeScore:3,awayScore:2});}
 assert.deepEqual(homes,["lions","lions","dragons","dragons","lions"]);
});
