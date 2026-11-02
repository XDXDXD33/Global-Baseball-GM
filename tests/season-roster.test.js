import test from "node:test";
import assert from "node:assert/strict";
import { createHistoricalSeasonRoster, buildHistoricalForeignMarket } from "../src/season-roster.js";

test("historical roster imports real player names and keeps franchise assignment",()=>{
 const history={players:{p1:{id:"p1",name:"歷史真實球員",country:"Taiwan",birthday:"1990-01-01"}},batting:[{playerId:"p1",playerName:"歷史真實球員",year:2020,franchiseId:"brothers",teamName:"中信兄弟",stats:{G:100,AB:350,H:105,HR:12,BB:30,PA:390,SB:5}}],pitching:[],fielding:[]};
 const result=createHistoricalSeasonRoster(history,2020,4);
 const player=result.players.find(p=>p.sourcePlayerId==="p1");
 assert.ok(player);
 assert.equal(player.name,"歷史真實球員");
 assert.equal(player.clubId,"brothers");
 assert.equal(player.dataKind,"real");
 assert.ok(result.players.filter(p=>p.clubId==="lions").length>=26);
});
test("foreign recruitment pool includes real historical foreign players not on current roster",()=>{
 const history={players:{f1:{id:"f1",name:"Juan Diaz",country:"Dominican Republic",birthday:"1985-01-01"}},batting:[{playerId:"f1",playerName:"Juan Diaz",year:2019,franchiseId:"dragons",teamName:"味全龍",stats:{G:80,AB:280,H:80,HR:10,BB:22,PA:310}}],pitching:[],fielding:[]};
 const market=buildHistoricalForeignMarket(history,2020,[],2020);
 const real=market.find(p=>p.sourcePlayerId==="f1");
 assert.ok(real);
 assert.equal(real.foreign,true);
 assert.equal(real.dataKind,"real");
 assert.ok(market.some(p=>p.dataKind==="fictional"));
});
