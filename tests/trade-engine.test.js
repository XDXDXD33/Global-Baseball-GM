import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {executeOneForOneTrade,executeMultiPlayerTrade,calculateTradeValue} from "../src/trade-engine.js";
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

test("multi-player package trade supports two-for-one deals and repairs both rosters",()=>{
 const state=makeState(),lineup=state.lineups.brothers;
 const outgoing=state.players.filter(p=>p.clubId==="brothers"&&!p.foreign&&!lineup.lineup.includes(p.id)&&!lineup.rotation.includes(p.id)).sort((a,b)=>calculateTradeValue(b)-calculateTradeValue(a)).slice(0,2);
 const incoming=state.players.filter(p=>p.clubId==="lions"&&!p.foreign).sort((a,b)=>calculateTradeValue(a)-calculateTradeValue(b)).slice(0,1);
 const record=executeMultiPlayerTrade(state,{outgoingIds:outgoing.map(p=>p.id),incomingIds:incoming.map(p=>p.id)});
 assert.equal(record.outgoingIds.length,2);
 assert.equal(record.incomingIds.length,1);
 assert.ok(outgoing.every(p=>state.players.find(x=>x.id===p.id).clubId==="lions"));
 assert.equal(state.players.find(p=>p.id===incoming[0].id).clubId,"brothers");
 assert.equal(state.lineups.brothers.lineup.length,9);
 assert.equal(state.lineups.lions.lineup.length,9);
});
test("multi-player trade rejects packages involving multiple opposing clubs",()=>{
 const state=makeState();
 const own=state.players.find(p=>p.clubId==="brothers"&&!state.lineups.brothers.lineup.includes(p.id)&&!state.lineups.brothers.rotation.includes(p.id));
 const a=state.players.find(p=>p.clubId==="lions"),b=state.players.find(p=>p.clubId==="dragons");
 assert.throws(()=>executeMultiPlayerTrade(state,{outgoingIds:[own.id],incomingIds:[a.id,b.id]}),/同一支球隊/);
});
test("multi-player trade rejects a package that would exceed the 30-player roster cap",()=>{
 const state=makeState(),own=state.players.find(p=>p.clubId==="brothers"&&!state.lineups.brothers.lineup.includes(p.id)&&!state.lineups.brothers.rotation.includes(p.id));
 const incoming=state.players.filter(p=>p.clubId==="lions").slice(0,3);
 state.players.push(...Array.from({length:4},(_,i)=>({...incoming[0],id:"extra-"+i,clubId:"brothers"})));
 assert.throws(()=>executeMultiPlayerTrade(state,{outgoingIds:[own.id],incomingIds:incoming.map(p=>p.id)}),/名單會超過/);
});
