import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {executeOneForOneTrade,calculateTradeValue} from "../src/trade-engine.js";
function makeState(){
 const players=createInitialLeagueRoster(2026);
 return {season:2026,matchday:12,clubId:"brothers",foreignLimit:4,players,lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),tradeHistory:[],contracts:{}};
}
test("balanced one-for-one trade transfers player ownership and repairs AI lineup",()=>{
 const state=makeState(),ownLineup=state.lineups.brothers;
 const own=state.players.filter(p=>p.clubId==="brothers"&&!ownLineup.lineup.includes(p.id)&&!ownLineup.rotation.includes(p.id)).sort((a,b)=>calculateTradeValue(b)-calculateTradeValue(a))[0];
 const incoming=state.players.find(p=>p.clubId==="lions"&&state.lineups.lions.lineup.includes(p.id));
 const record=executeOneForOneTrade(state,{outgoingId:own.id,incomingId:incoming.id});
 assert.equal(state.players.find(p=>p.id===own.id).clubId,"lions");
 assert.equal(state.players.find(p=>p.id===incoming.id).clubId,"brothers");
 assert.equal(state.tradeHistory.length,1);
 assert.equal(record.incomingId,incoming.id);
 assert.equal(new Set(state.lineups.lions.lineup).size,state.lineups.lions.lineup.length);
});
test("trade rejects an outgoing starter until lineup is changed",()=>{
 const state=makeState(),starter=state.lineups.brothers.lineup[0],incoming=state.players.find(p=>p.clubId==="lions");
 assert.throws(()=>executeOneForOneTrade(state,{outgoingId:starter,incomingId:incoming.id}),/先發打序/);
});
test("trade enforces foreign-player limits for both clubs",()=>{
 const state=makeState();state.foreignLimit=0;
 const own=state.players.find(p=>p.clubId==="brothers"&&!state.lineups.brothers.lineup.includes(p.id)&&!state.lineups.brothers.rotation.includes(p.id));
 const incoming=state.players.find(p=>p.clubId==="lions");incoming.foreign=true;
 assert.throws(()=>executeOneForOneTrade(state,{outgoingId:own.id,incomingId:incoming.id}),/洋將人數/);
});
test("AI declines a clearly unbalanced offer",()=>{
 const state=makeState(),ownLineup=state.lineups.brothers;
 const weak=state.players.filter(p=>p.clubId==="brothers"&&!ownLineup.lineup.includes(p.id)&&!ownLineup.rotation.includes(p.id)).sort((a,b)=>calculateTradeValue(a)-calculateTradeValue(b))[0];
 const strong=state.players.filter(p=>p.clubId==="lions").sort((a,b)=>calculateTradeValue(b)-calculateTradeValue(a))[0];
 assert.throws(()=>executeOneForOneTrade(state,{outgoingId:weak.id,incomingId:strong.id}),/交易條件不足/);
});
