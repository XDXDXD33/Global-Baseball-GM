import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createFreeAgentPool,createLeagueSchedule} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {initializeContracts,estimatePlayerSalary} from "../src/contract-engine.js";
import {runAIClubManagement} from "../src/ai-management.js";

test("AI clubs promote a developed prospect over a weak bench player",()=>{
 const players=createInitialLeagueRoster(2026);
 const team="lions";
 const weak=players.find(p=>p.clubId===team&&p.position==="CF"&&!buildDefaultLineup(players,team).lineup.includes(p.id));
 assert.ok(weak);
 weak.ratings={contact:25,power:25,eye:25,speed:25,fielding:25,range:25};
 const state={season:2026,month:4,matchday:31,clubId:"brothers",foreignLimit:4,players,freeAgents:createFreeAgentPool(2026),contracts:initializeContracts(players,2026),lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),tactics:{},schedule:createLeagueSchedule(2026),injuries:{},minorLeague:[{id:"ai-prospect-cf",name:"AI 新秀",clubId:team,position:"CF",age:20,potential:90,ratings:{contact:75,power:72,eye:70,speed:70,fielding:72,range:72},developmentMonths:18}],aiClubReports:[]};
 runAIClubManagement(state,{phase:"monthly"});
 assert.ok(state.players.some(p=>p.id==="ai-prospect-cf"&&p.clubId===team));
 assert.ok(!state.minorLeague.some(p=>p.id==="ai-prospect-cf"));
 assert.ok(state.freeAgents.some(p=>p.id===weak.id));
 assert.ok(state.contracts["ai-prospect-cf"].yearsRemaining>=1);
 assert.ok(state.aiClubReports.some(x=>x.type==="promotion"&&x.message.includes("AI 新秀")));
});
