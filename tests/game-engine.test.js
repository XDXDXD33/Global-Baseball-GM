import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createLeagueSchedule,createGame,advancePitch,simulateGame,calculateStandings,applyGameResult,changePitcher,createFreeAgentPool,setGameCommand,attemptStealBase,executeSacrificeBunt,issueIntentionalWalk,substituteRunner,substituteFielder,substituteBatter,placeCPBLExtraInningRunner} from "../src/game-engine.js";
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
 assert.throws(()=>changePitcher(g,"brothers",next),/三名打者/);
 g.pitcherBattersFaced[g.pitcherId.brothers]=3;
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
 assert.equal(g.commands.lions.battingApproach,"power");
 assert.throws(()=>setGameCommand(g,"lions",{pitchType:"slider"}));
 const defense=createGame({fixture,players,lineups,seed:10,userTeamId:"brothers"});
 setGameCommand(defense,"brothers",{pitchType:"slider"});
 assert.equal(defense.commands.brothers.pitchType,"slider");
 assert.throws(()=>setGameCommand(defense,"brothers",{pitchType:"knuckleball"}));
});
test("sacrifice bunt advances a runner and records a plate appearance",()=>{
 const fixture={id:"bunt",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:4,userTeamId:"lions"});
 const runner=g.lineups.lions[1],batter=g.lineups.lions[0];
 g.bases[0]=runner;
 executeSacrificeBunt(g,"lions");
 assert.equal(g.batterStats[batter].PA,1);
 assert.equal(g.batterStats[batter].AB,0);
 assert.equal(g.batterStats[batter].SH,1);
 assert.equal(g.bases[0],null);
 assert.equal(g.bases[1],runner);
 assert.equal(g.outs,1);
});
test("intentional walk is available to the fielding team and forces runners",()=>{
 const fixture={id:"ibb",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:5,userTeamId:"brothers"});
 const offense=g.lineups.lions;
 g.bases=[offense[1],offense[2],offense[3]];
 const batter=offense[0],pitcher=g.pitcherId.brothers;
 issueIntentionalWalk(g,"brothers");
 assert.equal(g.batterStats[batter].BB,1);
 assert.equal(g.pitcherStats[pitcher].BB,1);
 assert.equal(g.bases[0],offense[0]);
 assert.equal(g.bases[1],offense[1]);
 assert.equal(g.bases[2],offense[2]);
 assert.equal(g.score.lions,1);
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

test("starting pitcher follows the configured five-man rotation",()=>{
 const first=createGame({fixture:{id:"rotation-1",season:2026,matchday:1,homeId:"brothers",awayId:"lions"},players,lineups,seed:10});
 const second=createGame({fixture:{id:"rotation-2",season:2026,matchday:2,homeId:"brothers",awayId:"lions"},players,lineups,seed:10});
 assert.equal(first.pitcherId.brothers,lineups.brothers.rotation[0]);
 assert.equal(second.pitcherId.brothers,lineups.brothers.rotation[1]);
});

test("recent pitcher workload can trigger an early bullpen change",()=>{
 const fixture={id:"workload",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const starter=lineups.brothers.rotation[0];
 const g=createGame({fixture,players,lineups,seed:8,workload:{[starter]:180}});
 advancePitch(g);
 assert.equal(g.pitcherId.brothers,starter);
 g.pitcherBattersFaced[starter]=3;advancePitch(g);
 assert.notEqual(g.pitcherId.brothers,starter);
});

test("pinch runner replaces the base runner and cannot re-enter",()=>{
 const fixture={id:"pinch-runner",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:11,userTeamId:"lions"});
 const oldRunner=g.lineups.lions[0],replacement=players.find(p=>p.clubId==="lions"&&!lineups.lions.lineup.includes(p.id)&&!lineups.lions.rotation.includes(p.id));
 g.battingIndex.lions=1;g.bases[0]=oldRunner;
 substituteRunner(g,"lions",0,replacement.id);
 assert.equal(g.bases[0],replacement.id);
 assert.equal(g.lineups.lions[0],replacement.id);
 assert.ok(g.substitutedOut.includes(oldRunner));
 assert.throws(()=>substituteRunner(g,"lions",0,oldRunner));
});
test("defensive substitution updates the batting slot and prevents re-entry",()=>{
 const fixture={id:"defense-sub",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:12,userTeamId:"brothers"});
 const old= g.lineups.brothers.find(id=>g.players[id].position==="LF");
 const replacement=players.find(p=>p.clubId==="brothers"&&p.position==="OF"&&!lineups.brothers.lineup.includes(p.id));
 substituteFielder(g,"brothers",old,replacement.id);
 assert.ok(g.lineups.brothers.includes(replacement.id));
 assert.ok(g.substitutedOut.includes(old));
 assert.throws(()=>substituteFielder(g,"brothers",replacement.id,old));
});
test("pinch hitter is removed from future bench eligibility",()=>{
 const fixture={id:"pinch-hit",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:13,userTeamId:"lions"});
 const old=g.lineups.lions[0],replacement=players.find(p=>p.clubId==="lions"&&!lineups.lions.lineup.includes(p.id)&&!lineups.lions.rotation.includes(p.id));
 substituteBatter(g,"lions",old,replacement.id);
 assert.equal(g.lineups.lions[0],replacement.id);
 assert.ok(g.substitutedOut.includes(old));
 assert.throws(()=>substituteBatter(g,"lions",replacement.id,old));
});

test("injured starter and hitter are excluded from a new game",()=>{
 const fixture={id:"injury-filter",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const injuredHitter=lineups.brothers.lineup[0],injuredStarter=lineups.brothers.rotation[0];
 const g=createGame({fixture,players,lineups,seed:16,injuries:{[injuredHitter]:{daysRemaining:4},[injuredStarter]:{daysRemaining:3}}});
 assert.ok(!g.lineups.brothers.includes(injuredHitter));
 assert.notEqual(g.pitcherId.brothers,injuredStarter);
});
test("postseason fixtures can continue beyond twelve innings",()=>{
 const fixture={id:"extra",season:2026,matchday:121,phase:"postseason",round:"championship",homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:18});
 g.inning=12;g.half="bottom";g.outs=2;g.score.brothers=0;g.score.lions=0;
 const before=g.inning;
 for(let i=0;i<12&&g.status==="live"&&g.inning===before;i++)advancePitch(g);
 assert.ok(g.status==="live"||g.inning>12||g.result?.winnerId);
});

test("CPBL extra innings place the previous batting-order player on second base",()=>{
 const fixture={id:"cpbl-extra-runner",season:2026,matchday:121,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:20});
 g.inning=10;g.battingIndex.lions=4;
 const expected=g.lineups.lions[3];
 const runner=placeCPBLExtraInningRunner(g,"lions");
 assert.equal(runner,expected);
 assert.equal(g.bases[1],expected);
 assert.ok(g.automaticRunnerIds.includes(expected));
});
test("defensive alignment command is only available to the fielding team",()=>{
 const fixture={id:"defense-alignment",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:21,userTeamId:"brothers"});
 setGameCommand(g,"brothers",{defenseAlignment:"infieldIn"});
 assert.equal(g.commands.brothers.defenseAlignment,"infieldIn");
 assert.throws(()=>setGameCommand(g,"lions",{defenseAlignment:"shift"}));
 assert.throws(()=>setGameCommand(g,"brothers",{defenseAlignment:"illegal"}));
});

test("manual pitcher change is blocked during an active plate appearance",()=>{
 const fixture={id:"mid-pa-change",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:31,userTeamId:"brothers"}),next=lineups.brothers.bullpen[0];
 g.pitcherBattersFaced[g.pitcherId.brothers]=3;g.currentPA={balls:1,strikes:0};
 assert.throws(()=>changePitcher(g,"brothers",next),/打席結束/);
});

test("an injured pitcher may be replaced before facing three batters",()=>{
 const fixture={id:"injured-pitcher",season:2026,matchday:1,homeId:"brothers",awayId:"lions"};
 const g=createGame({fixture,players,lineups,seed:41,userTeamId:"brothers"}),old=g.pitcherId.brothers,next=lineups.brothers.bullpen[0];
 g.injuries.push({playerId:old,clubId:"brothers",daysOut:4});g.currentPA={pitcherId:old,balls:1,strikes:0};
 changePitcher(g,"brothers",next);assert.equal(g.pitcherId.brothers,next);
});

test("elite contact and power produce more hits and home runs than league-average ratings",()=>{
 const tunedPlayers=players.map(p=>({...p,ratings:{...(p.ratings||{})}}));
 const strongId=lineups.brothers.lineup[0],averageId=lineups.lions.lineup[0];
 tunedPlayers.find(p=>p.id===strongId).ratings={contact:95,power:99,eye:92,avoidK:92,speed:75,stealing:75,fielding:70,arm:70,range:70};
 tunedPlayers.find(p=>p.id===averageId).ratings={contact:50,power:50,eye:50,avoidK:50,speed:50,stealing:50,fielding:50,arm:50,range:50};
 const totals={[strongId]:{PA:0,H:0,HR:0},[averageId]:{PA:0,H:0,HR:0}};
 for(let i=1;i<=30;i++){
  const fixture={id:"power-balance-"+i,season:2026,matchday:i,homeId:"brothers",awayId:"lions"};
  const game=simulateGame(createGame({fixture,players:tunedPlayers,lineups,seed:i*7919}));
  for(const id of [strongId,averageId]){
   const stats=game.batterStats[id]||{};
   for(const key of ["PA","H","HR"])totals[id][key]+=Number(stats[key]||0);
  }
 }
 const elite=totals[strongId],average=totals[averageId];
 assert.ok(elite.PA>0&&average.PA>0);
 assert.ok(elite.HR>average.HR,"elite power should produce more home runs: "+JSON.stringify({elite,average}));
 assert.ok(elite.H/elite.PA>average.H/average.PA,"elite contact should produce a higher batting average: "+JSON.stringify({elite,average}));
});
