import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createFreeAgentPool} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {initializeContracts,offerExtension,signFreeAgent,signForeignFreeAgent,releasePlayer,advanceContractYear,contractDemand,calculateAnnualPayroll,calculateAvailableBudget} from "../src/contract-engine.js";
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

test("available budget reserves the next year's player payroll and staff payroll",()=>{
 const s=state(),payroll=calculateAnnualPayroll(s);
 assert.equal(calculateAvailableBudget(s),s.budget-payroll);
 s.staffByClub={brothers:{coach:{monthlySalary:100000},scout:{monthlySalary:80000}}};
 assert.equal(calculateAvailableBudget(s),s.budget-payroll-2160000);
});
test("foreign release keeps the player available as a free agent",()=>{
 const s=state(),p=s.players.find(x=>x.clubId===s.clubId&&!s.lineups[s.clubId].rotation.includes(x.id)&&!s.lineups[s.clubId].lineup.includes(x.id));
 p.foreign=true;p.marketType="overseas";
 const result=releasePlayer(s,p.id);
 const free=s.freeAgents.filter(x=>x.id===p.id);
 assert.equal(free.length,1);
 assert.equal(free[0].clubId,null);
 assert.equal(free[0].foreign,true);
 assert.equal(s.players.find(x=>x.id===p.id).clubId,null);
 assert.ok(result.penalty>=0);
});
test("expired foreign contracts enter free agency instead of disappearing",()=>{
 const s=state(),p=s.players.find(x=>x.clubId===s.clubId);
 p.foreign=true;p.marketType="overseas";
 s.contracts[p.id]={salary:500000,yearsRemaining:1};
 advanceContractYear(s);
 assert.ok(s.freeAgents.some(x=>x.id===p.id&&x.foreign&&x.clubId===null));
 assert.equal(s.players.find(x=>x.id===p.id).clubId,null);
});
test("a high-rated overseas signing replaces a weaker eligible starter but keeps that player",()=>{
 const s=state();s.budget=300000000;
 const displacedId=s.lineups[s.clubId].lineup[8];
 const displaced=s.players.find(x=>x.id===displacedId);
 displaced.ratings={contact:20,power:20,eye:20,avoidK:20,speed:20,stealing:20,fielding:20,arm:20,range:20};
 const star={id:"overseas-test-star",name:"Test Star",clubId:null,position:"DH",age:27,foreign:true,marketType:"overseas",marketDemand:2000000,estimatedCPBLAbility:99,ratings:{contact:96,power:99,eye:94,avoidK:93,speed:75,stealing:70,fielding:70,arm:70,range:70}};
 s.overseasMarket=[star];
 const result=signForeignFreeAgent(s,{playerId:star.id,years:1,salary:2000000});
 assert.ok(s.lineups[s.clubId].lineup.includes(result.player.id));
 assert.ok(s.players.some(x=>x.id===displacedId&&x.clubId===s.clubId));
 assert.equal(s.players.filter(x=>x.id===result.player.id).length,1);
});
test("foreign market signing cannot steal a player who is still under contract with another club",()=>{
 const s=state(),active=s.players.find(x=>x.clubId==="lions");
 active.foreign=true;active.sourcePlayerId="historic-foreign-id";
 const candidate={id:"foreign-market-candidate",name:active.name,sourcePlayerId:active.sourcePlayerId,clubId:null,position:active.position,age:active.age,foreign:true,marketDemand:1000000,ratings:active.ratings};
 s.foreignMarket=[candidate];
 assert.throws(()=>signForeignFreeAgent(s,{playerId:candidate.id,years:1,salary:1000000}),/仍隸屬其他球團/);
 assert.equal(s.players.find(x=>x.id===active.id).clubId,"lions");
});
test("foreign signings are rejected when next year's payroll reserve would exceed cash",()=>{
 const s=state();s.budget=120000000;
 const star={id:"overseas-too-expensive",name:"Expensive Star",clubId:null,position:"DH",age:27,foreign:true,marketType:"overseas",marketDemand:420000000,estimatedCPBLAbility:99,ratings:{contact:96,power:99,eye:94,avoidK:93,fielding:70,arm:70,range:70}};
 s.overseasMarket=[star];
 assert.throws(()=>signForeignFreeAgent(s,{playerId:star.id,years:1,salary:420000000}),/可用資金不足/);
 assert.ok(!s.players.some(x=>x.name===star.name));
 assert.ok(s.overseasMarket.some(x=>x.id===star.id));
});
test("free-agent signings also reserve the annual salary before accepting",()=>{
 const s=state();s.budget=30000000;
 const p=s.freeAgents.find(x=>!x.foreign);
 assert.throws(()=>signFreeAgent(s,{playerId:p.id,years:2,salary:100000000}),/可用資金不足/);
 assert.ok(s.freeAgents.some(x=>x.id===p.id));
});
