import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createLeagueSchedule,createGame,advancePitch,simulateGame,calculateStandings,applyGameResult,changePitcher,createFreeAgentPool} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
const players=createInitialLeagueRoster(42);
const lineups=Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)]));
test("initial league roster has 26 fictional players per club",()=>{
 assert.equal(players.length,156);
 for(const c of LEAGUE.clubs){const roster=players.filter(p=>p.clubId===c.id);assert.equal(roster.length,26);assert.ok(roster.filter(p=>p.position==="SP").length>=5);assert.ok(roster.filter(p=>p.position==="RP").length>=8);}
});
test("schedule gives every club 120 games with balanced home and away",()=>{
 const s=createLeagueSchedule(2026);
 assert.equal(s.length,360);
 for(const c of LEAGUE.clubs){const g=s.filter(x=>x.homeId===c.id||x.awayId===c.id);assert.equal(g.length,120);assert.equal(g.filter(x=>x.homeId===c.id).length,60);assert.equal(g.filter(x=>x.awayId===c.id).length,60);}
});
test("a live game advances one pitch and keeps a valid count",()=>{
 const fixture={id:"test",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:123});
 assert.equal(g.status,"live");
 const r=advancePitch(g);assert.ok(r.event);assert.ok(g.pitchCount===1);
});
test("full game resolves, records box score and standings",()=>{
 const fixture={id:"test",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=simulateGame(createGame({fixture,players,lineups,seed:12345}));
 assert.equal(g.status,"final");assert.ok(g.inning>=9);assert.ok(g.pitchCount>0);
 const f=applyGameResult(fixture,g);assert.equal(f.status,"final");assert.equal(typeof f.homeScore,"number");
 const s=calculateStandings([f],["brothers","lions"]);assert.equal(s.reduce((n,x)=>n+x.games,0),2);
 assert.equal(g.lineScore.brothers.reduce((n,x)=>n+x,0),g.score.brothers);
 assert.equal(g.lineScore.lions.reduce((n,x)=>n+x,0),g.score.lions);
 for(const x of Object.values(g.batterStats))assert.ok(x.AB<=x.PA);
});
test("bullpen can replace the active pitcher",()=>{
 const fixture={id:"test2",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:2}),next=lineups.brothers.bullpen[0];
 changePitcher(g,"brothers",next);assert.equal(g.pitcherId.brothers,next);
});

test("free-agent pool is separate from CPBL active rosters",()=>{
 const market=createFreeAgentPool(2026);
 assert.equal(market.length,18);
 assert.ok(market.every(p=>p.clubId===null&&p.dataKind==="fictional"&&p.contractStatus==="free-agent"));
});
test("user-controlled pitcher is not automatically removed by AI bullpen logic",()=>{
 const fixture={id:"user-game",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:55,userTeamId:"brothers"});
 g.pitcherStats[g.pitcherId.brothers]={pitches:200};
 for(let i=0;i<10&&g.status==="live";i++)advancePitch(g);
 assert.equal(g.pitcherId.brothers,lineups.brothers.rotation[0]);
});
