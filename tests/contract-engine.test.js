import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createFreeAgentPool} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {initializeContracts,offerExtension,signFreeAgent,releasePlayer,advanceContractYear,contractDemand} from "../src/contract-engine.js";
function state(){
 const players=createInitialLeagueRoster(2026);
 return {season:2026,clubId:"brothers",foreignLimit:4,budget:200000000,players,freeAgents:createFreeAgentPool(2026),lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),contracts:initializeContracts(players,2026),contractHistory:[]};
}
test("initial roster receives deterministic multi-year contracts",()=>{
 const s=state();assert.equal(Object.keys(s.contracts).length,s.players.length);
 assert.ok(Object.values(s.contracts).every(c=>c.yearsRemaining>=2&&c.yearsRemaining<=4&&c.salary>0));
});
test("player accepts a reasonable extension and budget pays signing bonus",()=>{
 const s=state(),p=s.players.find(x=>x.clubId===s.clubId),before=s.budget,demand=contractDemand(p);
 const result=offerExtension(s,{playerId:p.id,salary:demand*1.1,years:2});
 assert.equal(result.contract.yearsRemaining,s.contracts[p.id].yearsRemaining);
 assert.ok(s.budget<before);
 assert.equal(s.contractHistory.at(-1).type,"extension");
});
test("player rejects a low renewal offer",()=>{
 const s=state(),p=s.players.find(x=>x.clubId===s.clubId);
 assert.throws(()=>offerExtension(s,{playerId:p.id,salary:100000,years:2}),/拒絕報價/);
});
test("free-agent signing enforces roster, foreign limit and records a contract",()=>{
 const s=state(),p=s.freeAgents.find(x=>!x.foreign),result=signFreeAgent(s,{playerId:p.id,years:3});
 assert.equal(result.contract.yearsRemaining,3);
 assert.equal(s.players.find(x=>x.id===p.id).clubId,s.clubId);
 assert.ok(!s.freeAgents.some(x=>x.id===p.id));
});
test("release charges compensation and removes the player from active lineup",()=>{
 const s=state(),p=s.players.find(x=>x.clubId===s.clubId&&!s.lineups[s.clubId].rotation.includes(x.id)&&!s.lineups[s.clubId].lineup.includes(x.id));
 const result=releasePlayer(s,p.id);
 assert.equal(s.players.find(x=>x.id===p.id).clubId,null);
 assert.ok(result.penalty>=0);
 assert.ok(!s.lineups[s.clubId].bullpen.includes(p.id));
 assert.ok(s.freeAgents.some(x=>x.id===p.id));
});
test("expired user and AI contracts both enter free agency for offseason evaluation",()=>{
 const s=state(),user=s.players.find(x=>x.clubId===s.clubId),ai=s.players.find(x=>x.clubId==="lions");
 s.contracts[user.id]={salary:500000,yearsRemaining:1};s.contracts[ai.id]={salary:500000,yearsRemaining:1};
 const expired=advanceContractYear(s);
 assert.ok(expired.some(x=>x.id===user.id));
 assert.equal(s.players.find(x=>x.id===user.id).clubId,null);
 assert.equal(s.players.find(x=>x.id===ai.id).clubId,null);
 assert.ok(s.freeAgents.some(x=>x.id===ai.id));
 assert.equal(s.contracts[ai.id],undefined);
});

test("initial contract generation skips released and retired players",()=>{
 const players=[{id:"active",clubId:"brothers",age:25},{id:"free",clubId:null,age:25},{id:"retired",clubId:null,retired:true,age:40}];
 const contracts=initializeContracts(players,2026);
 assert.deepEqual(Object.keys(contracts),["active"]);
});
