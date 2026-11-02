import test from "node:test";
import assert from "node:assert/strict";
import {calculateBestRoster,applyBestRoster} from "../src/roster-optimizer.js";
import {createInitialLeagueRoster,createFreeAgentPool} from "../src/game-engine.js";

function player(id,position,ability=50,rosterLevel="first"){
 const pitcher=["SP","RP","P"].includes(position);
 return {id,name:id,clubId:"brothers",position,age:26,foreign:false,rosterLevel,ratings:pitcher?{velocity:ability,control:ability,movement:ability,stamina:ability,fielding:ability,arm:ability,range:ability}:{contact:ability,power:ability,eye:ability,speed:ability,fielding:ability,arm:ability,range:ability}};
}
function makeState(){
 const players=[];
 for(let i=0;i<4;i++)players.push(player("sp"+i,"SP",70-i));
 for(let i=0;i<9;i++)players.push(player("rp"+i,"RP",70-i));
 for(const pos of ["C","1B","2B","3B","SS"])for(let i=0;i<2;i++)players.push(player(pos+i,pos,65-i));
 for(const pos of ["LF","CF","RF"])players.push(player(pos,pos,66));
 players.push(player("of4","LF",62),player("of5","RF",61),player("bench","DH",40));
 return {season:2026,clubId:"brothers",foreignLimit:4,players,minorLeague:[],freeAgents:[player("free","C",99)],lineups:{brothers:{lineup:[],rotation:[],bullpen:[]}},contracts:{}};
}
test("best roster optimizer selects the requested 28-player balance from owned rosters only",()=>{
 const s=makeState(),p=calculateBestRoster(s);
 assert.equal(p.filled,28);
 assert.deepEqual(p.shortages,[]);
 assert.deepEqual(p.groups,{SP:4,RP:9,C:2,"1B":2,"2B":2,"3B":2,SS:2,OF:5});
 assert.ok(!p.selected.some(x=>x.id==="free"));
});
test("applying best roster only moves owned players between first team and farm",()=>{
 const s=makeState(),before=new Set(s.players.map(p=>p.id)),freeBefore=JSON.stringify(s.freeAgents),contractsBefore=JSON.stringify(s.contracts);
 const result=applyBestRoster(s);
 assert.equal(result.filled,28);
 assert.equal(s.players.filter(p=>p.clubId==="brothers").length,28);
 assert.equal(s.minorLeague.filter(p=>p.clubId==="brothers").length,0);
 assert.equal(s.lineups.brothers.lineup.length,9);
 assert.equal(s.lineups.brothers.rotation.length,4);
 assert.equal(s.lineups.brothers.bullpen.length,9);
 assert.deepEqual(new Set(s.players.filter(p=>p.clubId==="brothers").map(p=>p.id)),before);
 assert.equal(JSON.stringify(s.freeAgents),freeBefore);
 assert.equal(JSON.stringify(s.contracts),contractsBefore);
});
test("missing 1B is filled by the best available hitter without generating or signing anyone",()=>{
 const s=makeState();s.players=s.players.filter(p=>p.position!=="1B");
 const originalCount=s.players.length,plan=applyBestRoster(s);
 assert.equal(plan.filled,27);
 assert.equal(s.players.filter(p=>p.clubId==="brothers").length+s.minorLeague.filter(p=>p.clubId==="brothers").length,originalCount);
 assert.ok(!s.players.some(p=>p.source==="自動最佳陣容補位生成 · 虛構球員"));
 assert.ok(!s.players.some(p=>p.contractStatus==="signed"&&p.id==="free"));
});
test("missing SP slots are filled by the highest-rated available RP",()=>{
 const s=makeState();s.players=s.players.filter(p=>p.position!=="SP");
 const plan=calculateBestRoster(s);
 assert.equal(plan.groups.SP,4);
 assert.ok(plan.selected.filter(p=>p.optimizerGroup==="SP").every(p=>["RP","P"].includes(p.position)));
 assert.equal(plan.selected.find(p=>p.optimizerGroup==="SP").id,"rp0");
});
test("repeated auto lineup runs are idempotent and never create duplicate players",()=>{
 const s=makeState();
 applyBestRoster(s);applyBestRoster(s);applyBestRoster(s);applyBestRoster(s);
 const ids=[...(s.players||[]),...(s.minorLeague||[])].filter(p=>p.clubId==="brothers").map(p=>p.id);
 assert.equal(ids.length,new Set(ids).size);
 assert.equal(ids.length,29);
 assert.equal(s.freeAgents.length,1);
});
test("real generated franchise roster optimizer does not use free agents",()=>{
 const players=createInitialLeagueRoster(2026),freeAgents=createFreeAgentPool(2026);
 const s={season:2026,clubId:"brothers",foreignLimit:4,players,minorLeague:[],freeAgents,lineups:{brothers:{lineup:[],rotation:[],bullpen:[]}},contracts:{}};
 const freeIds=new Set(freeAgents.map(p=>p.id)),plan=calculateBestRoster(s);
 assert.ok(plan.selected.every(p=>!freeIds.has(p.id)));
});
