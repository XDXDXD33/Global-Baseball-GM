import test from "node:test";
import assert from "node:assert/strict";
import {developPlayers} from "../src/player-development.js";
test("monthly training develops the selected attribute for young players",()=>{
 const state={season:2026,month:1,clubId:"brothers",trainingLevel:1,trainingFocus:"power",players:[{id:"young-hitter",clubId:"brothers",position:"CF",age:21,ratings:{contact:60,power:60,eye:50,speed:50}}]};
 developPlayers(state);
 assert.ok(state.players[0].ratings.power>60);
 assert.equal(state.players[0].ratings.contact,60);
});
test("monthly training is deterministic for save reproducibility",()=>{
 const base={season:2026,month:3,clubId:"brothers",trainingLevel:2,trainingFocus:"control",players:[{id:"pitcher-1",clubId:"brothers",position:"SP",age:24,ratings:{velocity:60,control:55,movement:60,stamina:60}}]};
 const a=JSON.parse(JSON.stringify(base)),b=JSON.parse(JSON.stringify(base));
 developPlayers(a);developPlayers(b);
 assert.deepEqual(a.players,b.players);
});
test("older players gradually decline while young pitchers can improve",()=>{
 const state={season:2026,month:2,clubId:"brothers",trainingLevel:1,trainingFocus:"balanced",players:[{id:"old",clubId:"brothers",position:"CF",age:38,ratings:{contact:60,power:60,eye:60,speed:60}},{id:"young",clubId:"brothers",position:"SP",age:20,ratings:{velocity:60,control:60,movement:60,stamina:60}}]};
 developPlayers(state);
 assert.ok(state.players[0].ratings.contact<60);
 assert.ok(state.players[1].ratings.control>60);
});
