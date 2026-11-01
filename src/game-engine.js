import { LEAGUE } from "./data.js";

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const rating=(p,key,fallback=50)=>Number.isFinite(Number(p?.ratings?.[key]))?Number(p.ratings[key]):fallback;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function makePlayer(id,clubId,position,index,random){
 const age=20+Math.floor(random()*15);
 const ratings=["SP","RP"].includes(position)
 ?{velocity:45+Math.floor(random()*31),control:42+Math.floor(random()*31),movement:42+Math.floor(random()*31),stamina:position==="SP"?58+Math.floor(random()*27):25+Math.floor(random()*35),fielding:40+Math.floor(random()*20),arm:45+Math.floor(random()*30)}
 :{contact:42+Math.floor(random()*31),power:38+Math.floor(random()*36),eye:40+Math.floor(random()*31),speed:38+Math.floor(random()*36),fielding:42+Math.floor(random()*31),arm:40+Math.floor(random()*31),avoidK:40+Math.floor(random()*31),stealing:35+Math.floor(random()*41),range:40+Math.floor(random()*31)};
 return {id,name:"示範球員 "+String(index+1).padStart(2,"0"),clubId,position,age,role:position==="SP"?"先發投手":position==="RP"?"後援投手":position==="DH"?"指定打擊":position+" 野手",foreign:false,dataKind:"fictional",identityStatus:"fictional",source:"遊戲生成示範名單",confidence:1,ratings};
}
export function createInitialLeagueRoster(seed=2026){
 const players=[];
 for(const club of LEAGUE.clubs){
  const random=rng(hash(seed+"-"+club.id));
  const positions=["C","C","1B","2B","3B","SS","LF","CF","RF","OF","DH","OF","SP","SP","SP","SP","SP","RP","RP","RP","RP","RP","RP","RP","RP","RP"];
  positions.forEach((pos,i)=>players.push(makePlayer(club.id+"-demo-"+String(i+1).padStart(2,"0"),club.id,pos,i,random)));
 }
 return players;
}
export const BATTING_POSITIONS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
export function buildDefaultLineup(players,clubId){
 const roster=players.filter(p=>p.clubId===clubId),used=new Set(),lineup=[];
 for(const pos of BATTING_POSITIONS){
  let p=roster.find(x=>x.position===pos&&!used.has(x.id));
  if(!p)p=roster.find(x=>!["SP","RP","P"].includes(x.position)&&!used.has(x.id));
  if(p){lineup.push(p.id);used.add(p.id);}
 }
 return {lineup,rotation:roster.filter(p=>p.position==="SP").slice(0,5).map(p=>p.id),bullpen:roster.filter(p=>p.position==="RP").map(p=>p.id)};
}
export function createFreeAgentPool(seed=2026){
 const random=rng(hash("free-agents-"+seed)),positions=["C","1B","2B","3B","SS","LF","CF","RF","DH","SP","SP","SP","RP","RP","RP","RP","RP","RP"];
 return positions.map((pos,i)=>{const p=makePlayer("fa-"+seed+"-"+String(i+1).padStart(2,"0"),null,pos,i,random);p.name="自由球員 "+String(i+1).padStart(2,"0");p.foreign=i%4===0;p.contractStatus="free-agent";return p;});
}
export function createLeagueSchedule(season=2026,teamIds=LEAGUE.clubs.map(c=>c.id)){
 if(teamIds.length!==6)throw new RangeError("目前 CPBL 排程需要六支球隊");
 const ring=[...teamIds],rounds=[];
 for(let r=0;r<teamIds.length-1;r++){
  const games=[];
  for(let i=0;i<teamIds.length/2;i++)games.push([ring[i],ring[teamIds.length-1-i]]);
  rounds.push(games);ring.splice(1,0,ring.pop());
 }
 const schedule=[];
 for(let cycle=0;cycle<24;cycle++)for(let r=0;r<rounds.length;r++){
  const matchday=cycle*5+r+1;
  for(const [a,b] of rounds[r]){
   const flip=cycle%2===1,homeId=flip?b:a,awayId=flip?a:b;
   schedule.push({id:season+"-"+matchday+"-"+homeId+"-"+awayId,season,matchday,month:Math.floor((matchday-1)/10)+1,homeId,awayId,status:"scheduled",homeScore:null,awayScore:null});
  }
 }
 return schedule.sort((a,b)=>a.matchday-b.matchday||a.homeId.localeCompare(b.homeId));
}
const clonePlayer=p=>({...p,ratings:{...(p.ratings||{})}});
function statsFor(bucket,id){
 if(!id)return {};
 return bucket[id]||(bucket[id]={PA:0,AB:0,H:0,Singles:0,Doubles:0,Triples:0,HR:0,R:0,RBI:0,BB:0,K:0,HBP:0,SB:0,CS:0,pitches:0,outs:0,ER:0});
}
function log(game,message){
 game.lastEvent=message;game.log.push({inning:game.inning,half:game.half,text:message,outs:game.outs,score:{...game.score}});
 if(game.log.length>500)game.log.shift();
}
function teamAtBat(game){return game.half==="top"?game.fixture.awayId:game.fixture.homeId;}
function teamOnField(game){return game.half==="top"?game.fixture.homeId:game.fixture.awayId;}
function currentBatter(game){const id=teamAtBat(game),lineup=game.lineups[id];return game.players[lineup[game.battingIndex[id]%lineup.length]];}
function pitcherFor(game){return game.players[game.pitcherId[teamOnField(game)]];}
function effectivePitchRating(game,pitcher,key){
 const ps=statsFor(game.pitcherStats,pitcher.id),limit=rating(pitcher,"stamina",55)*1.25;
 const fatigue=Math.max(0,ps.pitches-limit)*.22;
 return clamp(rating(pitcher,key)-fatigue,10,100);
}
function recordRun(game,teamId,runnerId){
 game.score[teamId]++;const line=game.lineScore[teamId];
 while(line.length<game.inning)line.push(0);
 line[game.inning-1]++;
 if(runnerId)statsFor(game.batterStats,runnerId).R++;
}
function forceAdvance(game,batter,pitcher,teamId){
 const b=game.bases;
 if(b[0]){
  if(b[1]){
   if(b[2]){recordRun(game,teamId,b[2]);statsFor(game.batterStats,batter.id).RBI++;statsFor(game.pitcherStats,pitcher.id).ER++;}
   b[2]=b[1];
  }
  b[1]=b[0];
 }
 b[0]=batter.id;
}
function walk(game,batter,pitcher,teamId){
 forceAdvance(game,batter,pitcher,teamId);
 statsFor(game.batterStats,batter.id).BB++;statsFor(game.pitcherStats,pitcher.id).BB++;
}
function hit(game,batter,pitcher,teamId,type){
 const old=[...game.bases],bs=statsFor(game.batterStats,batter.id),ps=statsFor(game.pitcherStats,pitcher.id);
 bs.H++;ps.H++;
 if(type==="HR"){
  bs.HR++;for(const runner of old)if(runner){recordRun(game,teamId,runner);bs.RBI++;ps.ER++;}
  recordRun(game,teamId,batter.id);bs.RBI++;ps.ER++;game.bases=[null,null,null];return;
 }
 if(type==="3B"){
  bs.Triples++;for(const runner of old)if(runner){recordRun(game,teamId,runner);bs.RBI++;ps.ER++;}
  game.bases=[null,null,batter.id];return;
 }
 if(type==="2B"){
  bs.Doubles++;for(const runner of [old[2],old[1]])if(runner){recordRun(game,teamId,runner);bs.RBI++;ps.ER++;}
  game.bases=[null,batter.id,old[0]];return;
 }
 bs.Singles++;
 if(old[2]){recordRun(game,teamId,old[2]);bs.RBI++;ps.ER++;}
 game.bases=[batter.id,old[0],old[1]];
}
function finishGame(game,reason){
 game.status="final";
 game.result={homeId:game.fixture.homeId,awayId:game.fixture.awayId,homeScore:game.score[game.fixture.homeId],awayScore:game.score[game.fixture.awayId],winnerId:game.score[game.fixture.homeId]===game.score[game.fixture.awayId]?null:game.score[game.fixture.homeId]>game.score[game.fixture.awayId]?game.fixture.homeId:game.fixture.awayId,reason,innings:game.inning};
 log(game,"比賽結束："+game.score[game.fixture.awayId]+" : "+game.score[game.fixture.homeId]);
}
function nextHalf(game){
 game.outs=0;game.bases=[null,null,null];
 if(game.half==="top"){
  if(game.inning>=9&&game.score[game.fixture.homeId]>game.score[game.fixture.awayId]){finishGame(game,"九局上結束時主隊領先");return;}
  game.half="bottom";
  while(game.lineScore[game.fixture.homeId].length<game.inning)game.lineScore[game.fixture.homeId].push(0);
 }else{
  if(game.inning>=9&&game.score[game.fixture.homeId]!==game.score[game.fixture.awayId]){finishGame(game,"九局後分出勝負");return;}
  if(game.inning>=12){finishGame(game,"十二局上限");return;}
  game.inning++;game.half="top";
  while(game.lineScore[game.fixture.awayId].length<game.inning)game.lineScore[game.fixture.awayId].push(0);
 }
}
function addOut(game,pitcher,kind){
 game.outs++;statsFor(game.pitcherStats,pitcher.id).outs++;
 if(kind==="K")statsFor(game.pitcherStats,pitcher.id).K++;
 if(kind==="DP"&&game.bases[0]&&game.outs<3){game.bases[0]=null;game.outs++;statsFor(game.pitcherStats,pitcher.id).outs++;}
 if(game.outs>=3)nextHalf(game);
}
function checkWalkoff(game){
 if(game.status==="live"&&game.half==="bottom"&&game.inning>=9&&game.score[game.fixture.homeId]>game.score[game.fixture.awayId])finishGame(game,"再見得分");
}
function resolveInPlay(game,batter,pitcher,teamId){
 const offense=game.tactics[teamId]||{},contact=rating(batter,"contact"),power=rating(batter,"power"),speed=rating(batter,"speed");
 const movement=effectivePitchRating(game,pitcher,"movement");
 const fielders=game.lineups[teamOnField(game)].map(id=>game.players[id]).filter(Boolean);
 const defense=fielders.length?fielders.reduce((sum,p)=>sum+rating(p,"fielding"),0)/fielders.length:50;
 const hitChance=clamp(.255+(contact-50)*.0025-(movement-50)*.0015-(defense-50)*.00055+(offense.aggressiveHitting==="yes"?.012:0),.12,.39);
 if(random(game)<hitChance){
  const hr=clamp(.035+(power-50)*.00125,.005,.105),triple=clamp(.012+(speed-50)*.00045,.004,.035),double=clamp(.12+(power-50)*.0012,.06,.22),r=random(game);
  const type=r<hr?"HR":r<hr+triple?"3B":r<hr+triple+double?"2B":"1B";
  hit(game,batter,pitcher,teamId,type);
  log(game,batter.name+" 擊出"+({HR:"全壘打","3B":"三壘安打","2B":"二壘安打","1B":"一壘安打"}[type]));
 }else if(random(game)<clamp(.025-(defense-50)*.00045,.008,.05)){
  const old=[...game.bases];if(old[2])recordRun(game,teamId,old[2]);game.bases=[batter.id,old[0],old[1]];log(game,batter.name+" 上壘，守備發生失誤");
 }else{
  const fly=random(game)<.45;
  if(fly&&game.bases[2]&&game.outs<2){
   const runner=game.bases[2];game.bases[2]=null;recordRun(game,teamId,runner);
   statsFor(game.batterStats,batter.id).RBI++;statsFor(game.pitcherStats,pitcher.id).ER++;
   game.lastPAResult="SF";addOut(game,pitcher,"SF");log(game,batter.name+" 高飛犧牲打，三壘跑者得分");
  }else{
   const dp=!fly&&game.bases[0]&&game.outs<2&&random(game)<.42;
   addOut(game,pitcher,dp?"DP":"OUT");
   log(game,batter.name+(dp?" 擊出雙殺打":fly?" 擊出飛球出局":" 擊出滾地球出局"));
  }
 }
 checkWalkoff(game);
}
function completePA(game,batter,teamId,kind){
 const bs=statsFor(game.batterStats,batter.id);bs.PA++;
 if(!["BB","HBP","SF"].includes(kind)&&game.lastPAResult!=="SF")bs.AB++;
 game.lastPAResult=null;game.battingIndex[teamId]=(game.battingIndex[teamId]+1)%game.lineups[teamId].length;
 game.currentPA=null;
 if(kind==="BB")log(game,batter.name+" 選到四壞保送");
 if(kind==="HBP")log(game,batter.name+" 遭觸身球保送");
}
function random(game){game.rngState=(Math.imul(game.rngState,1664525)+1013904223)>>>0;return game.rngState/4294967296;}
export function createGame({fixture,players,lineups,seed=1,tactics={},userTeamId=null}){
 const byId=Object.fromEntries(players.map(p=>[p.id,clonePlayer(p)]));
 const starter=id=>byId[lineups[id]?.rotation?.[0]]||players.find(p=>p.clubId===id&&p.position==="SP");
 const lineupFor=id=>lineups[id]?.lineup?.filter(pid=>byId[pid]?.clubId===id)||players.filter(p=>p.clubId===id&&!["SP","RP","P"].includes(p.position)).slice(0,9).map(p=>p.id);
 const home=starter(fixture.homeId),away=starter(fixture.awayId);
 if(!home||!away)throw new Error("兩隊都需要至少一名先發投手");
 for(const id of [fixture.homeId,fixture.awayId])if(lineupFor(id).length<9)throw new Error("兩隊都需要至少九名可用打者");
 return {id:fixture.id,fixture:{...fixture},status:"live",inning:1,half:"top",outs:0,bases:[null,null,null],score:{[fixture.homeId]:0,[fixture.awayId]:0},lineScore:{[fixture.homeId]:[0],[fixture.awayId]:[0]},battingIndex:{[fixture.homeId]:0,[fixture.awayId]:0},lineups:{[fixture.homeId]:lineupFor(fixture.homeId),[fixture.awayId]:lineupFor(fixture.awayId)},bullpens:{[fixture.homeId]:[...(lineups[fixture.homeId]?.bullpen||[])],[fixture.awayId]:[...(lineups[fixture.awayId]?.bullpen||[])]},usedPitchers:{[fixture.homeId]:[home.id],[fixture.awayId]:[away.id]},userTeamId,pitcherId:{[fixture.homeId]:home.id,[fixture.awayId]:away.id},pitcherStats:{},batterStats:{},players:byId,currentPA:null,rngState:(seed>>>0)||1,pitchCount:0,log:[],lastEvent:"比賽開始",tactics:{...tactics},result:null};
}
function autoManagePitcher(game,teamId){
 if(game.userTeamId===teamId)return;const current=game.players[game.pitcherId[teamId]],ps=statsFor(game.pitcherStats,current.id),limit=Math.max(55,rating(current,"stamina",50)*1.35);if(ps.pitches<limit)return;const next=(game.bullpens[teamId]||[]).find(id=>!game.usedPitchers[teamId].includes(id));if(next){game.pitcherId[teamId]=next;game.usedPitchers[teamId].push(next);log(game,"AI 牛棚調度："+game.players[next].name+" 接替投球");}
}
function trySteal(game,teamId){
 const runnerId=game.bases[0];if(!runnerId||game.bases[1]||game.outs>=2)return;const tactic=game.tactics[teamId]?.stealAggression||"normal";if(tactic==="conservative")return;const runner=game.players[runnerId],catcher=game.players[game.lineups[teamOnField(game)].find(id=>game.players[id]?.position==="C")],speed=rating(runner,"speed"),arm=rating(catcher,"arm");const attempt=tactic==="aggressive"?.045:.014;if(random(game)>attempt*(.7+speed/100))return;if(random(game)<clamp(.72+(speed-arm)*.004,.48,.9)){game.bases[1]=runnerId;game.bases[0]=null;statsFor(game.batterStats,runnerId).SB++;log(game,runner.name+" 盜上二壘");}else{game.bases[0]=null;statsFor(game.batterStats,runnerId).CS++;game.outs++;statsFor(game.pitcherStats,game.pitcherId[teamOnField(game)]).outs++;log(game,runner.name+" 盜壘失敗遭觸殺");if(game.outs>=3){nextHalf(game);game.currentPA=null;}}
}
export function advancePitch(game){
 if(game.status!=="live")return {done:true,event:"比賽已結束"};
 autoManagePitcher(game,teamOnField(game));
 const offense=teamAtBat(game),batter=currentBatter(game),pitcher=pitcherFor(game),teamId=offense;
 if(!batter||!pitcher)throw new Error("打者或投手資料遺失");
 if(!game.currentPA)game.currentPA={batterId:batter.id,pitcherId:pitcher.id,balls:0,strikes:0,pitches:0};
 const pa=game.currentPA,ps=statsFor(game.pitcherStats,pitcher.id);
 pa.pitches++;game.pitchCount++;ps.pitches++;
 const r=random(game);let result;
 if(r<.0015){
  result="HBP";statsFor(game.batterStats,batter.id).HBP++;forceAdvance(game,batter,pitcher,teamId);completePA(game,batter,teamId,"HBP");
 }else{
  const control=effectivePitchRating(game,pitcher,"control"),eye=rating(batter,"eye");
  const strikeProb=clamp(.605+(control-50)*.0017-(eye-50)*.0008,.43,.73);
  if(r<strikeProb){
   const action=random(game);
   if(action<clamp(.19+(rating(batter,"contact")-50)*.0012,.11,.28)){
    result="IN_PLAY";resolveInPlay(game,batter,pitcher,teamId);completePA(game,batter,teamId,game.lastPAResult==="SF"?"SF":"IN_PLAY");
   }else if(action<.43){result="FOUL";if(pa.strikes<2)pa.strikes++;}
   else{result="STRIKE";pa.strikes++;}
  }else{result="BALL";pa.balls++;}
  if(game.currentPA&&pa.balls>=4){result="WALK";walk(game,batter,pitcher,teamId);completePA(game,batter,teamId,"BB");}
  else if(game.currentPA&&pa.strikes>=3){result="STRIKEOUT";statsFor(game.batterStats,batter.id).K++;addOut(game,pitcher,"K");completePA(game,batter,teamId,"K");}
  if(game.currentPA&&game.status==="live")trySteal(game,teamId);
 }
 checkWalkoff(game);
 const count=game.currentPA?game.currentPA.balls+"-"+game.currentPA.strikes:"";
 const label={HBP:"觸身球",IN_PLAY:"擊球進場",FOUL:"界外球",STRIKE:"好球",BALL:"壞球",WALK:"四壞保送",STRIKEOUT:"三振"}[result]||result;
 log(game,"第 "+pa.pitches+" 球："+label+(count?"（"+count+"）":""));
 return {done:game.status!=="live"||!game.currentPA,event:label,batterId:batter.id,pitcherId:pitcher.id,count,game};
}
export function advancePlateAppearance(game){
 let result;for(let i=0;i<20&&game.status==="live";i++){result=advancePitch(game);if(result.done)break;}return result;
}
export function simulateGame(game,maxPitches=2600){
 let n=0;while(game.status==="live"&&n<maxPitches){advancePitch(game);n++;}
 if(game.status==="live")finishGame(game,"模擬安全上限");
 return game;
}
export function changePitcher(game,teamId,pitcherId){
 if(game.status!=="live")throw new Error("比賽已結束");
 const p=game.players[pitcherId];if(!p||p.clubId!==teamId||!["SP","RP","P"].includes(p.position))throw new Error("只能更換為本隊可用投手");
 if(game.pitcherId[teamId]===pitcherId)throw new Error("該投手已在場上");
 if(game.usedPitchers[teamId]?.includes(pitcherId))throw new Error("該投手已經在本場比賽投過球");
 game.pitcherId[teamId]=pitcherId;game.usedPitchers[teamId].push(pitcherId);log(game,"投手更換："+p.name);return game;
}
export function substituteBatter(game,teamId,outPlayerId,newPlayerId){
 if(game.status!=="live"||game.currentPA)throw new Error("請在打席結束後進行代打");
 const lineup=game.lineups[teamId],idx=lineup.indexOf(outPlayerId),p=game.players[newPlayerId];
 if(idx<0||!p||p.clubId!==teamId||["SP","RP","P"].includes(p.position))throw new Error("代打必須是本隊未上場的野手");
 if(lineup.includes(newPlayerId))throw new Error("該球員已在打序中");
 lineup[idx]=newPlayerId;log(game,"代打："+p.name);return game;
}
export function calculateStandings(schedule,teamIds=LEAGUE.clubs.map(c=>c.id)){
 return teamIds.map(teamId=>{
  const games=schedule.filter(g=>g.status==="final"&&(g.homeId===teamId||g.awayId===teamId));
  const wins=games.filter(g=>g.winnerId===teamId).length,losses=games.filter(g=>g.winnerId&&g.winnerId!==teamId).length,ties=games.length-wins-losses;
  return {teamId,games:games.length,wins,losses,ties,winPct:games.length?(wins+ties*.5)/games.length:0,gb:0};
 }).sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins);
}
export function applyGameResult(fixture,game){
 return {...fixture,status:"final",homeScore:game.score[fixture.homeId],awayScore:game.score[fixture.awayId],winnerId:game.result?.winnerId??null,innings:game.result?.innings??game.inning,boxScore:{batters:game.batterStats,pitchers:game.pitcherStats,lineScore:game.lineScore}};
}
export function gameSituation(game){
 return {inning:game.inning,half:game.half==="top"?"上":"下",outs:game.outs,bases:game.bases.map(Boolean),balls:game.currentPA?.balls??0,strikes:game.currentPA?.strikes??0,score:{...game.score},batter:currentBatter(game)?.name??"—",pitcher:pitcherFor(game)?.name??"—"};
}
