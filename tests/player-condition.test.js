import test from "node:test";
import assert from "node:assert/strict";
import {applyPlayerGameLoad,recoverPlayerConditions,conditionMultiplier,conditionLabel,ensurePlayerCondition} from "../src/player-condition.js";
test("player condition changes attribute multiplier in both directions",()=>{
 const p={condition:100};assert.ok(conditionMultiplier(p)>1);p.condition=20;assert.ok(conditionMultiplier(p)<1);
});
test("game workload reduces batter, fielder and pitcher condition",()=>{
 const state={players:[{id:"b",condition:80},{id:"f",condition:80},{id:"p",condition:80}]};
 applyPlayerGameLoad(state,{batterStats:{b:{PA:4}},fieldingStats:{f:{PO:2}},pitcherStats:{p:{pitches:90}}});
 assert.ok(state.players.every(p=>p.condition<80));
 assert.ok(state.players.find(p=>p.id==="p").condition<state.players.find(p=>p.id==="b").condition);
});
test("rest restores condition while injured players recover more slowly",()=>{
 const state={players:[{id:"healthy",condition:50},{id:"hurt",condition:50}],injuries:{hurt:{daysRemaining:4}}};
 recoverPlayerConditions(state);
 assert.equal(state.players[0].condition,52.5);assert.equal(state.players[1].condition,50.35);
});
test("pitcher stamina falls with workload and returns with rest",()=>{
 const state={players:[{id:"sp",position:"SP",condition:80,pitcherStamina:100}],injuries:{}};
 applyPlayerGameLoad(state,{batterStats:{},fieldingStats:{},pitcherStats:{sp:{pitches:90}}});
 assert.equal(state.players[0].pitcherStamina,80.2);
 recoverPlayerConditions(state);
 assert.equal(state.players[0].pitcherStamina,100);
});
test("legacy players receive a safe default condition",()=>{
 const p={};assert.equal(ensurePlayerCondition(p),72);assert.equal(conditionLabel(p),"狀態普通");
});
