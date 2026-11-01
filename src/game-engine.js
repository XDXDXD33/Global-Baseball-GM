import { LEAGUE } from "./data.js";

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const rating=(p,key,fallback=50)=>Number.isFinite(Number(p?.ratings?.[key]))?Number(p.ratings[key]):fallback;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function makePlayer(id,clubId,position,index,random){
 const age=20+Math.floor(random()*15),foreign=index%13===0;
 const ratings=position==="SP"||position==="RP"
 ?{velocity:45+Math.floor(random()*31),control:42+Math.floor(random()*31),movement:42+Math.floor(random()*31),stamina:position==="SP"?58+Math.floor(random()*27):25+Math.floor(random()*35),fielding:40+Math.floor(random()*20),arm:45+Math.floor(random()*30)}
 :{contact:42+Math.floor(random()*31),power:38+Math.floor(random()*36),eye:40+Math.floor(random()*31),speed:38+Math.floor(random()*36),fielding:42+Math.floor(random()*31),arm:40+Math.floor(random()*31),avoidK:40+Math.floor(random()*31),stealing:35+Math.floor(random()*41),range:40+Math.floor(random()*31)};
 return {id,name:"示範球員 "+String(index+1).padStart(2,"0"),clubId,position,age,role:position==="SP"?"先發投手":position==="RP"?"後援投手":position==="DH"?"指定打擊":position+" 野手",foreign:false,dataKind:"fictional",identityStatus:"fictional",source:"遊戲生成示範名單",confidence:1,ratings};
}
export function createInitialLeagueRoster(seed=2026){
 const players=[];
 for(const club of LEAGUE.clubs){
  const random=rng(hash(seed+"-"+club.id)),positions=["C","C","1B","2B","3B","SS","LF","CF","RF","OF","DH","OF","SP","SP","SP","SP","SP","RP","RP","RP","RP","RP","RP","RP","RP","RP"];
  positions.forEach((pos,i)=>players.push(makePlayer(club.id+"-demo-"+String(i+1).padStart(2,"0"),club.id,pos,i,random)));
 }
 return players;
}
export const BATTING_POSITIONS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
export function buildDefaultLineup(players,clubId){
 const roster=players.filter(p=>p.clubId===clubId),used=new Set(),lineup=[];
 for(const pos of BATTING_POSITIONS){
  let p=roster.find(x=>x.position===pos&&!used.has(x.id));
  if(!p&&pos==="DH")p=roster.find(x=>!["SP","RP","P"].includes(x.position)&&!used.has(x.id));
  if(!p)p=roster.find(x=>!["SP","RP","P"].includes(x.position)&&!used.has(x.id));
  if(p){lineup.push(p.id);used.add(p.id);}
 }
 const rotation=roster.filter(p=>p.position==="SP").slice(0,5).map(p=>p.id);
 const bullpen=roster.filter(p=>p.position==="RP").map(p=>p.id);
 return {lineup,rotation,bullpen};
}
export function createLeagueSchedule(season=2026,teamIds=LEAGUE.clubs.map(c=>c.id)){
 if(teamIds.length!==6)throw new RangeError("目前 CPBL 排程需要六支球隊");
 const ring=[...teamIds],rounds=[];
 for(let r=0;r<teamIds.length-1;r++){
  const games=[];
  for(let i=0;i<teamIds.length/2;i++){
   const a=ring[i],b=ring[teamIds.length-1-i];
   games.push([a,b]);
  }
  rounds.push(games);
  ring.splice(1,0,ring.pop());
 }
 const schedule=[];
 for(let cycle=0;cycle<24;cycle++)for(let r=0;r<rounds.length;r++){
  const matchday=cycle*5+r+1;
  for(const [a,b] of rounds[r]){
   const flip=(cycle%2)===1;
   const homeId=flip?b:a,awayId=flip?a:b;
   schedule.push({id:season+"-"+matchday+"-"+homeId+"-"+awayId,season,matchday,month:Math.floor((matchday-1)/10)+1,homeId,awayId,status:"scheduled",homeScore:null,awayScore:null});
  }
 }
 return schedule.sort((a,b)=>a.matchday-b.matchday||a.homeId.localeCompare(b.homeId));
}
function clonePlayer(p){return {...p,ratings:{...(p.ratings||{})}};}
export function createGame({fixture,players,lineups,seed=1,tactics={}}){
 const byId=Object.fromEntries(players.map(p=>[p.id,clonePlayer(p)]));
 const home=byId[lineups[fixture.homeId]?.rotation?.[0]]||players.find(p=>p.clubId===fixture.homeId&&p.position==="SP");
 const away=byId[lineups[fixture.awayId]?.rotation?.[0]]||players.find(p=>p.clubId===fixture.awayId&&p.position==="SP");
 const lineupFor=id=>lineups[id]?.lineup?.filter(pid=>byId[pid]?.clubId===id)||players.filter(p=>p.clubId===id&&!["SP","RP","P"].includes(p.position)).slice(0,9).map(p=>p.id);
 if(!home||!away)throw new Error("兩隊都需要至少一名先發投手");
 for(const id of [fixture.homeId,fixture.awayId])if(lineupFor(id).length<9)throw new Error("兩隊都需要至少九名可用打者");
 return {id:fixture.id,fixture:{...fixture},status:"live",inning:1,half:"top",outs:0,bases:[null,null,null],score:{[fixture.homeId]:0,[fixture.awayId]:0},lineScore:{[fixture.homeId]:[],[fixture.awayId]:[]},battingIndex:{[fixture.homeId]:0,[fixture.awayId]:0},lineups:{[fixture.homeId]:lineupFor(fixture.homeId),[fixture.awayId]:lineupFor(fixture.awayId)},pitcherId:{[fixture.homeId]:home.id,[fixture.awayId]:away.id},pitcherStats:{},batterStats:{},players:byId,currentPA:null,rngState:(seed>>>0)||1,pitchCount:0,log:[],lastEvent:"比賽開始",tactics:{...tactics},result:null};
}
function random(game){game.rngState=(Math.imul(game.rngState,1664525)+1013904223)>>>0;return game.rngState/4294967296;}
function teamAtBat(game){return game.half==="top"?game.fixture.awayId:game.fixture.homeId;}
function teamOnField(game){return game.half==="top"?game.fixture.homeId:game.fixture.awayId;}
function currentBatter(game){const id=teamAtBat(game),lineup=game.lineups[id];return game.players[lineup[game.battingIndex[id]%lineup.length]];}
function pitcherFor(game){return game.players[game.pitcherId[teamOnField(game)]];}
function statsFor(bucket,id){return bucket[id]||(bucket[id]={PA:0,AB:0,H:0,Singles:0,Doubles:0,Triples:0,HR:0,R:0,RBI:0,BB:0,K:0,HBP:0,SB:0,CS:0,pitches:0,outs:0,ER:0});}
function log(game,message){game.lastEvent=message;game.log.push({inning:game.inning,half:game.half,text:message,outs:game.outs,score:{...game.score}});if(game.log.length>500)game.log.shift();}
function addRun(game,teamId,batterId,pitcherId,earned=true){game.score[teamId]++;const batter=statsFor(game.batterStats,batterId);batter.RBI++;statsFor(game.batterStats,game.bases[2]).R++;const pitcher=statsFor(game.pitcherStats,pitcherId);if(earned)pitcher.ER++;}
function walk(game,batter,pitcher,team){
 const b=game.bases;
 if(b[0]){if(b[1]){if(b[2])addRun(game,team,batter.id,pitcher.id);b[2]=b[1];}b[1]=b[0];}
 b[0]=batter.id;
 statsFor(game.batterStats,batter.id).BB++;statsFor(game.pitcherStats,pitcher.id).BB++;
}
function hit(game,batter,pitcher,team,type){
 const old=[...game.bases],bs=statsFor(game.batterStats,batter.id),ps=statsFor(game.pitcherStats,pitcher.id);
 bs.H++;ps.H++;
 if(type==="HR"){bs.HR++;for(const runner of old)if(runner){game.score[team]++;statsFor(game.batterStats,runner).R++;bs.RBI++;ps.ER++;}game.score[team]++;bs.R++;bs.RBI++;ps.ER++;game.bases=[null,null,null];return;}
 if(type==="3B"){bs.Triples++;for(const runner of old)if(runner){game.score[team]++;statsFor(game.batterStats,runner).R++;bs.RBI++;ps.ER++;}game.bases=[null,null,batter.id];return;}
 if(type==="2B"){bs.Doubles++;for(const runner of [old[2],old[1]])if(runner){game.score[team]++;statsFor(game.batterStats,runner).R++;bs.RBI++;ps.ER++;}game.bases=[null,old[0],batter.id];return;}
 bs.Singles++;
 if(old[2]){game.score[team]++;statsFor(game.batterStats,old[2]).R++;bs.RBI++;ps.ER++;}
 game.bases=[old[0]?null:null,old[0]?old[0]:null,batter.id];
 if(old[1]){game.bases[2]=old[1];}
 if(old[0])game.bases[1]=batter.id;
 game.bases[0]=batter.id;
}
function finishGame(game,reason){
 game.status="final";game.result={homeId:game.fixture.homeId,awayId:game.fixture.awayId,homeScore:game.score[game.fixture.homeId],awayScore:game.score[game.fixture.awayId],winnerId:game.score[game.fixture.homeId]===game.score[game.fixture.awayId]?null:game.score[game.fixture.homeId]>game.score[game.fixture.awayId]?game.fixture.homeId:game.fixture.awayId,reason,innings:game.inning};
 log(game,"比賽結束："+game.score[game.fixture.awayId]+" : "+game.score[game.fixture.homeId]);
}
function nextHalf(game){
 const batting=teamAtBat(game);
 game.outs=0;game.bases=[null,null,null];
 if(game.half==="top"){game.half="bottom";if(game.lineScore[game.fixture.homeId].length<game.inning)game.lineScore[game.fixture.homeId].push(0);}
 else{
  if(game.lineScore[game.fixture.awayId].length<game.inning)game.lineScore[game.fixture.awayId].push(0);
  if(game.inning>=9&&game.score[game.fixture.homeId]!==game.score[game.fixture.awayId]){finishGame(game,"九局後領先");return;}
  if(game.inning>=12){finishGame(game,"十二局上限");return;}
  game.inning++;game.half="top";
  if(game.lineScore[game.fixture.awayId].length<game.inning)game.lineScore[game.fixture.awayId].push(0);
 }
}
function addOut(game,batter,pitcher,kind){
 game.outs++;statsFor(game.batterStats,batter.id).AB++;statsFor(game.pitcherStats,pitcher.id).outs++;
 if(kind==="K"){statsFor(game.batterStats,batter.id).K++;statsFor(game.pitcherStats,pitcher.id).K++;}
 if(kind==="DP"&&game.bases[0]&&game.outs<3){game.bases[0]=null;game.outs++;statsFor(game.pitcherStats,pitcher.id).outs++;}
 if(game.outs>=3)nextHalf(game);
}
function resolveInPlay(game,batter,pitcher,team){
 const offense=game.tactics[team]||{},defense=game.tactics[teamOnField(game)]||{};
 const contact=rating(batter,"contact"),power=rating(batter,"power"),speed=rating(batter,"speed"),movement=rating(pitcher,"movement");
 const hitChance=clamp(.255+(contact-50)*.0025-(movement-50)*.0015+(offense.aggressiveHitting==="yes"?.012:0),.12,.39);
 if(random(game)<hitChance){
  const hr=clamp(.035+(power-50)*.00125,.005,.105),triple=clamp(.012+(speed-50)*.00045,.004,.035),double=clamp(.12+(power-50)*.0012,.06,.22),r=random(game);
  hit(game,batter,pitcher,team,r<hr?"HR":r<hr+triple?"3B":r<hr+triple+double?"2B":"1B");
  log(game,batter.name+" 擊出"+({HR:"全壘打",3B:"三壘安打",2B:"二壘安打","1B":"一壘安打"}[game.batterStats[batter.id].HR?"HR":game.batterStats[batter.id].Triples?"3B":game.batterStats[batter.id].Doubles?"2B":"1B"]));
 }else if(random(game)<.018+(100-rating({ratings:{fielding:50}},"fielding") )*.0001){
  game.bases[0]=batter.id;statsFor(game.batterStats,batter.id).AB++;log(game,batter.name+" 上壘，守備發生失誤");
 }else{
  const fly=random(game)<.45;
  if(fly&&game.bases[2]&&game.outs<2){const runner=game.bases[2];game.bases[2]=null;game.score[team]++;statsFor(game.batterStats,runner).R++;statsFor(game.batterStats,batter.id).RBI++;statsFor(game.pitcherStats,pitcher.id).ER++;addOut(game,batter,pitcher,"SF");log(game,batter.name+" 高飛犧牲打，三壘跑者得分");}
  else{const dp=!fly&&game.bases[0]&&game.outs<2&&random(game)<.42;addOut(game,batter,pitcher,dp?"DP":"OUT");log(game,batter.name+(dp?" 擊出雙殺打":fly?" 擊出飛球出局":" 擊出滾地球出局"));}
 }
 if(game.half==="bottom"&&game.inning>=9&&game.score[game.fixture.homeId]>game.score[game.fixture.awayId]&&game.status==="live")finishGame(game,"再見得分");
}
function completePA(game,batter,pitcher,team,kind){
 const bs=statsFor(game.batterStats,batter.id);bs.PA++;
 if(kind==="BB"||kind==="HBP"){}else if(kind!=="SF")bs.AB++;
 game.battingIndex[team]=(game.battingIndex[team]+1)%game.lineups[team].length;
 game.currentPA=null;
 if(kind==="BB")log(game,batter.name+" 選到四壞保送");
 if(kind==="HBP")log(game,batter.name+" 遭觸身球保送");
}
export function advancePitch(game){
 if(game.status!=="live")return {done:true,event:"比賽已結束"};
 const offense=teamAtBat(game),batter=currentBatter(game),pitcher=pitcherFor(game),team=offense;
 if(!batter||!pitcher)throw new Error("打者或投手資料遺失");
 if(!game.currentPA)game.currentPA={batterId:batter.id,pitcherId:pitcher.id,balls:0,strikes:0,pitches:0};
 const pa=game.currentPA,ps=statsFor(game.pitcherStats,pitcher.id),bs=statsFor(game.batterStats,batter.id);
 pa.pitches++;game.pitchCount++;ps.pitches++;
 const r=random(game),control=rating(pitcher,"control"),eye=rating(batter,"eye");
 let result;
 if(r<.0015){result="HBP";bs.HBP++;walk(game,batter,pitcher,team);completePA(game,batter,pitcher,team,"HBP");}
 else{
  const strikeProb=clamp(.605+(control-50)*.0017-(eye-50)*.0008,.43,.73);
  if(r<strikeProb){
   const action=random(game);
   if(action<clamp(.19+(rating(batter,"contact")-50)*.0012,.11,.28)){
    result="IN_PLAY";resolveInPlay(game,batter,pitcher,team);completePA(game,batter,pitcher,team,"IN_PLAY");
   }else if(action<.43){result="FOUL";if(pa.strikes<2)pa.strikes++;}
   else{result="STRIKE";pa.strikes++;}
  }else{result="BALL";pa.balls++;}
  if(game.currentPA&&pa.balls>=4){result="WALK";walk(game,batter,pitcher,team);completePA(game,batter,pitcher,team,"BB");}
  else if(game.currentPA&&pa.strikes>=3){result="STRIKEOUT";addOut(game,batter,pitcher,"K");completePA(game,batter,pitcher,team,"K");}
 }
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
 game.pitcherId[teamId]=pitcherId;log(game,"投手更換："+p.name);return game;
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
