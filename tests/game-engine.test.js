import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createLeagueSchedule,createGame,advancePitch,simulateGame,calculateStandings,applyGameResult,changePitcher,createFreeAgentPool,setGameCommand,attemptStealBase,executeSacrificeBunt,issueIntentionalWalk} from "../src/game-engine.js";
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

test("player can set a batting approach and pitch type",()=>{
 const fixture={id:"commands",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:9,userTeamId:"lions"});
 setGameCommand(g,"lions",{battingApproach:"power"});
 setGameCommand(g,"lions",{pitchType:"slider"});
 assert.equal(g.commands.lions.battingApproach,"power");
 assert.equal(g.commands.lions.pitchType,"slider");
 assert.throws(()=>setGameCommand(g,"brothers",{pitchType:"curve"}));
 assert.throws(()=>setGameCommand(g,"lions",{pitchType:"knuckleball"}));
});
test("sacrifice bunt advances a runner and records a plate appearance",()=>{
 const fixture={id:"bunt",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:4,userTeamId:"lions"});
 const runner=g.lineups.lions[1],batter=g.lineups.lions[0];
 g.bases[0]=runner;
 executeSacrificeBunt(g,"lions");
 assert.equal(g.batterStats[batter].PA,1);
 assert.equal(g.batterStats[batter].AB,1);
 assert.ok(g.batterStats[batter].SH===0||g.batterStats[batter].SH===1);
 assert.equal(g.bases[0],null);
 assert.equal(g.bases[1],runner);
 assert.equal(g.outs,1);
});
test("intentional walk is available to the fielding team and forces runners",()=>{
 const fixture={id:"ibb",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:5,userTeamId:"brothers"});
 const offense=g.lineups.lions;
 g.bases=[offense[0],offense[1],offense[2]];
 const batter=offense[0],pitcher=g.pitcherId.brothers;
 issueIntentionalWalk(g,"brothers");
 assert.equal(g.batterStats[batter].BB,1);
 assert.equal(g.pitcherStats[pitcher].BB,1);
 assert.equal(g.bases[0],offense[3]);
 assert.equal(g.bases[1],offense[1]);
 assert.equal(g.bases[2],offense[2]);
});
test("manual steal attempt records either a steal or caught stealing",()=>{
 const fixture={id:"steal",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:6,userTeamId:"lions"});
 const runner=g.lineups.lions[0];g.bases[0]=runner;
 attemptStealBase(g,"lions");
 assert.equal((g.batterStats[runner]?.SB||0)+(g.batterStats[runner]?.CS||0),1);
});
test("quick simulation allows automatic bullpen management for the user team",()=>{
 const fixture={id:"auto-bullpen",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:55,userTeamId:"brothers"});
 const starter=g.pitcherId.brothers;
 g.pitcherStats[starter]={pitches:250,outs:0,ER:0,H:0,BB:0,K:0};
 simulateGame(g);
 assert.notEqual(g.pitcherId.brothers,starter);
});
