import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {retirePlayer,processAiRetirements} from "../src/retirement-engine.js";
function makeState(){
 const players=createInitialLeagueRoster(2026);
 return {season:2026,clubId:"brothers",players,contracts:Object.fromEntries(players.map(p=>[p.id,{salary:500000,yearsRemaining:2}])),lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),retiredPlayers:[],contractHistory:[]};
}
test("user can retire an eligible veteran and remove the contract",()=>{
 const state=makeState(),player=state.players.find(p=>p.clubId==="brothers");
 player.age=36;const id=player.id;
 retirePlayer(state,id);
 assert.equal(state.players.find(p=>p.id===id).retired,true);
 assert.equal(state.players.find(p=>p.id===id).clubId,null);
 assert.equal(state.contracts[id],undefined);
 assert.ok(state.retiredPlayers.some(x=>x.playerId===id));
 assert.ok(!state.lineups.brothers.lineup.includes(id));
});
test("user cannot retire a player younger than 35",()=>{
 const state=makeState(),player=state.players.find(p=>p.clubId==="brothers");
 player.age=34;
 assert.throws(()=>retirePlayer(state,player.id),/年滿 35 歲/);
});
test("AI retires players at age forty and repairs the club lineup",()=>{
 const state=makeState(),player=state.players.find(p=>p.clubId==="lions");
 player.age=40;const id=player.id;
 const retired=processAiRetirements(state);
 assert.ok(retired.some(p=>p.id===id));
 assert.equal(state.players.find(p=>p.id===id).retired,true);
 assert.ok(!state.lineups.lions.lineup.includes(id));
});
