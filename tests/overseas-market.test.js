import test from "node:test";
import assert from "node:assert/strict";
import {createOverseasMarket} from "../src/overseas-market.js";
import {contractDemand,signForeignFreeAgent} from "../src/contract-engine.js";
import {LEAGUE} from "../src/data.js";
import {createInitialLeagueRoster,buildDefaultLineup} from "../src/game-engine.js";
import {initializeContracts} from "../src/contract-engine.js";
test("overseas market has data-backed MLB NPB and KBO candidates",()=>{const m=createOverseasMarket();assert.ok(m.some(p=>p.name==="大谷翔平"&&p.league==="MLB"));assert.ok(m.some(p=>p.name==="佐藤輝明"&&p.league==="NPB"));assert.ok(m.some(p=>p.name==="金倒永"&&p.league==="KBO"));assert.ok(m.every(p=>p.dataKind==="real"&&p.sourceUrl&&p.ratings.fielding>=0&&p.ratings.range>=0));});
test("overseas star salary is scaled by franchise fanbase and winning percentage",()=>{const p=createOverseasMarket()[0],poor=contractDemand(p,{fanbase:1000,wins:0,losses:10}),strong=contractDemand(p,{fanbase:50000,wins:20,losses:10});assert.ok(strong<poor);assert.ok(poor>100000000);});
test("a player from the overseas market can be signed from that market",()=>{const players=createInitialLeagueRoster(2026),m=createOverseasMarket(),p=m.find(x=>x.name==="佐藤輝明");const s={season:2026,clubId:"brothers",foreignLimit:8,budget:500000000,players,overseasMarket:m,foreignMarket:[],contracts:initializeContracts(players,2026),lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),contractHistory:[]};const r=signForeignFreeAgent(s,{playerId:p.id,years:2,salary:contractDemand(p,s)});assert.ok(s.players.some(x=>x.name==="佐藤輝明"&&x.clubId==="brothers"));assert.ok(!s.overseasMarket.some(x=>x.id===p.id));assert.equal(s.contracts[r.player.id].yearsRemaining,2);});

test("overseas star estimates use the latest verified season batting lines",()=>{const m=createOverseasMarket(),o=m.find(p=>p.name==="大谷翔平"),h=m.find(p=>p.name==="Bryce Harper"),s=m.find(p=>p.name==="佐藤輝明"),k=m.find(p=>p.name==="金倒永");assert.equal(o.season,2026);assert.equal(o.externalStats.HR,30);assert.equal(h.externalStats.HR,29);assert.equal(h.externalStats.PA,693);assert.equal(s.externalStats.AVG,.306);assert.equal(k.externalStats.HR,45);assert.ok([o,h,s,k].every(p=>p.ratings.fielding>=0&&p.ratings.arm>=0&&p.ratings.range>=0));});
