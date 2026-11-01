import test from "node:test";
import assert from "node:assert/strict";
import {createPostseasonState,getNextPostseasonFixture,recordPostseasonResult} from "../src/postseason-engine.js";
const overall=["brothers","lions","dragons","monkeys","guardians","hawks"].map((teamId,i)=>({teamId,wins:90-i*5,losses:30+i*5,winPct:.75-i*.04}));
const different={firstHalf:[{teamId:"brothers",wins:40,winPct:.67}],secondHalf:[{teamId:"lions",wins:39,winPct:.65}],overall};
const same={firstHalf:[{teamId:"lions",wins:42,winPct:.7}],secondHalf:[{teamId:"lions",wins:41,winPct:.68}],overall};
test("different half champions: lower annual percentage starts the playoff with one win",()=>{
 const p=createPostseasonState(different,2026),f=getNextPostseasonFixture(p,121);
 assert.equal(p.format,"different-half-champions");
 assert.equal(p.topSeed.teamId,"brothers");
 assert.equal(p.semifinal.homeTeamId,"lions");
 assert.equal(p.semifinal.awayTeamId,"dragons");
 assert.equal(p.semifinal.wins.lions,1);
 assert.equal(f.bestOf,5);
});
test("same half champion: overall second and third play for a place in the championship",()=>{
 const p=createPostseasonState(same,2026),f=getNextPostseasonFixture(p,121);
 assert.equal(p.format,"same-half-champion");
 assert.equal(p.semifinal.homeTeamId,"lions"===p.topSeed.teamId?"brothers":overall[1].teamId);
 assert.equal(p.semifinal.awayTeamId,overall[2].teamId);
 assert.equal(p.semifinal.wins[overall[1].teamId],0);
 assert.equal(f.bestOf,5);
});
test("different-half champion playoff winner faces the higher half champion in a best-of-seven",()=>{
 const p=createPostseasonState(different,2026);
 for(let n=0;n<3;n++){const f=getNextPostseasonFixture(p,121+n);recordPostseasonResult(p,f,{winnerId:"dragons",homeScore:4,awayScore:2});}
 assert.equal(p.round,"championship");
 assert.equal(p.championship.homeTeamId,"brothers");
 assert.equal(p.championship.awayTeamId,"dragons");
 assert.equal(p.championship.wins.brothers,0);
 assert.equal(getNextPostseasonFixture(p,124).bestOf,7);
});
test("same-half champion receives one championship win in advance",()=>{
 const p=createPostseasonState(same,2026);
 for(let n=0;n<3;n++){const f=getNextPostseasonFixture(p,121+n);recordPostseasonResult(p,f,{winnerId:"dragons",homeScore:4,awayScore:2});}
 assert.equal(p.championship.homeTeamId,"brothers");
 assert.equal(p.championship.awayTeamId,"dragons");
 assert.equal(p.championship.wins.brothers,1);
});
test("championship completes after a team reaches four wins",()=>{
 const p=createPostseasonState(different,2026);
 for(let n=0;n<3;n++){const f=getNextPostseasonFixture(p,121+n);recordPostseasonResult(p,f,{winnerId:"dragons",homeScore:5,awayScore:1});}
 for(let n=0;n<4;n++){const f=getNextPostseasonFixture(p,124+n);recordPostseasonResult(p,f,{winnerId:"dragons",homeScore:5,awayScore:1});}
 assert.equal(p.status,"complete");
 assert.equal(p.championId,"dragons");
 assert.equal(getNextPostseasonFixture(p,130),null);
});
test("CPBL home-field patterns are applied to a full five-game and seven-game series",()=>{
 const p=createPostseasonState(same,2026),homes=[];
 for(let n=0;n<5;n++){const f=getNextPostseasonFixture(p,121+n);homes.push(f.homeId);const winnerId=n%2===0?"dragons":"brothers";recordPostseasonResult(p,f,{winnerId,homeScore:3,awayScore:2});}
 assert.deepEqual(homes,["brothers","brothers","dragons","dragons","brothers"]);
 const finalHomes=[];
 for(let n=0;n<6;n++){const f=getNextPostseasonFixture(p,126+n);finalHomes.push(f.homeId);const winnerId=n%2===0?"dragons":"brothers";recordPostseasonResult(p,f,{winnerId,homeScore:3,awayScore:2});}
 assert.deepEqual(finalHomes,["lions","lions","dragons","dragons","lions","lions"]);
});
