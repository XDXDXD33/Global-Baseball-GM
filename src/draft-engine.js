import { LEAGUE } from "./data.js";
import { generateFictionalName } from "./fictional-player-generator.js";
import { estimatePlayerAbility, estimatePlayerSalary, countForeignPlayers } from "./rules.js";

const POSITIONS = ["C","1B","2B","3B","SS","LF","CF","RF","SP","RP"];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function potentialFor(ratings){return Math.round(Object.values(ratings).reduce((a,b)=>a+Number(b||0),0)/Math.max(1,Object.keys(ratings).length));}
export function generateDraftClass(season=2027,count=30){
 const random=rng(hash("draft-"+season)),out=[];
 for(let i=0;i<count;i++){
  const position=POSITIONS[Math.floor(random()*POSITIONS.length)],age=18+Math.floor(random()*5);
  const base=38+Math.floor(random()*20),ratings=position==="SP"||position==="RP"
   ?{velocity:clamp(base+(random()*10-5),25,75),control:clamp(base+(random()*10-5),25,75),movement:clamp(base+(random()*10-5),25,75),stamina:clamp(base+(random()*12-6),25,75),fielding:clamp(base-5,20,70)}
   :{contact:clamp(base+(random()*10-5),25,75),power:clamp(base+(random()*12-6),25,75),eye:clamp(base+(random()*10-5),25,75),speed:clamp(base+(random()*14-7),25,75),fielding:clamp(base+(random()*10-5),25,75),range:clamp(base+(random()*10-5),25,75)};
  const ceiling=clamp(base+15+Math.floor(random()*24),45,92);
  out.push({id:"prospect-"+season+"-"+String(i+1).padStart(3,"0"),name:generateFictionalName("TW","draft-"+season+"-"+i),age,position,ratings:Object.fromEntries(Object.entries(ratings).map(([k,v])=>[k,Math.round(v)])),potential:ceiling,scoutingConfidence:Math.round(45+random()*45),source:"虛構新秀",foreign:false,clubId:null,season});
 }
 return out;
}
export function startDraft(state,{count=30,rounds=3}={}){
 if(state.draft?.status==="active"){let guard=0;while(state.draft.status==="active"&&guard++<state.draft.order.length*state.draft.rounds+2)aiPick(state);}
 state.minorLeague??=[];
 const order=LEAGUE.clubs.map(c=>c.id);
 state.draft={season:state.season,round:1,rounds:clamp(Math.floor(rounds),1,5),pickIndex:0,order,available:generateDraftClass(state.season,count),history:[],status:"active"};
 advanceDraftToUserTurn(state);
 return state.draft;
}
function currentTeam(draft){return draft.order[draft.pickIndex%draft.order.length];}
function finishPick(state,prospectIndex){
 const d=state.draft,teamId=currentTeam(d),prospect=d.available[prospectIndex];
 if(!prospect)throw new Error("這名新秀已被選走");
 const selected={...prospect,clubId:teamId,rosterLevel:"minor",signedSeason:state.season,developmentMonths:0};
 state.minorLeague??=[];state.minorLeague.push(selected);
 d.history.push({round:d.round,pick:d.history.length+1,teamId,playerId:selected.id,name:selected.name,position:selected.position});
 d.available.splice(prospectIndex,1);d.pickIndex++;
 if(d.pickIndex>=d.order.length){d.pickIndex=0;d.round++;}
 if(d.round>d.rounds||!d.available.length)d.status="complete";
}
function scoreProspect(p,needIndex=0){
 const ratings=Object.values(p.ratings||{}).map(Number),ability=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:40;
 return ability+(p.potential||50)*.42+(24-(p.age||24))*.8+needIndex;
}
function aiPick(state){
 const d=state.draft,teamId=currentTeam(d),roster=state.players.filter(p=>p.clubId===teamId),prospects=state.minorLeague.filter(p=>p.clubId===teamId);
 const counts={};for(const p of [...roster,...prospects])counts[p.position]=(counts[p.position]||0)+1;
 let best=0,bestScore=-Infinity;
 d.available.forEach((p,i)=>{const need=(counts[p.position]||0)<(p.position==="SP"?6:2)?9:0;const score=scoreProspect(p,need);if(score>bestScore){best=i;bestScore=score;}});
 finishPick(state,best);
}
export function advanceDraftToUserTurn(state){
 const d=state.draft;if(!d||d.status!=="active")return d;
 let guard=0;
 while(d.status==="active"&&currentTeam(d)!==state.clubId&&guard++<d.order.length*d.rounds+2)aiPick(state);
 return d;
}
export function makeDraftPick(state,prospectId){
 const d=state.draft;if(!d||d.status!=="active")throw new Error("目前沒有進行中的選秀會");
 if(currentTeam(d)!==state.clubId)throw new Error("目前不是你的球隊選秀順位");
 const index=d.available.findIndex(p=>p.id===prospectId);if(index<0)throw new Error("這名新秀已被選走");
 finishPick(state,index);advanceDraftToUserTurn(state);return d.history.at(-1);
}
export function promoteProspect(state,prospectId){
 const p=state.minorLeague?.find(x=>x.id===prospectId&&x.clubId===state.clubId);
 if(!p)throw new Error("只能升上一軍的本隊二軍球員");
 if(state.players.filter(x=>x.clubId===state.clubId&&x.rosterLevel!=="minor").length>=30)throw new Error("一軍名單已達 30 人，請先釋出或下放球員");
 if(p.foreign&&countForeignPlayers(state.players.filter(x=>x.clubId===state.clubId&&x.rosterLevel!=="minor"))>=state.foreignLimit)throw new Error("一軍洋將名額已滿，請先下放或釋出洋將。");
 state.minorLeague=state.minorLeague.filter(x=>x.id!==prospectId);
 const promoted={...p,rosterLevel:"major",promotedSeason:state.season};
 delete promoted.potential;delete promoted.scoutingConfidence;delete promoted.developmentMonths;
 state.players.push(promoted);state.contracts??={};state.contracts[promoted.id]={salary:180000,yearsRemaining:2,expirySeason:state.season+1,status:"active",signedSeason:state.season,signingBonus:0};
 const cfg=state.lineups?.[state.clubId];if(cfg){if(["SP","RP"].includes(promoted.position)&&promoted.position==="SP"&&cfg.rotation.length<5)cfg.rotation.push(promoted.id);else if(["RP"].includes(promoted.position))cfg.bullpen.push(promoted.id);else if(!["SP","RP"].includes(promoted.position)&&cfg.lineup.length<9)cfg.lineup.push(promoted.id);}
 return promoted;
}
export function demotePlayer(state,playerId){
 const p=state.players.find(x=>x.id===playerId&&x.clubId===state.clubId);
 if(!p)throw new Error("找不到本隊一軍球員");
 if(state.currentGame?.status==="live"&&state.currentGame.lineups?.[state.clubId]?.includes(playerId))throw new Error("比賽進行中且球員已登錄，請在比賽結束後下放");
 const cfg=state.lineups?.[state.clubId]||{lineup:[],rotation:[],bullpen:[]};
 const remaining=state.players.filter(x=>x.clubId===state.clubId&&x.id!==playerId);
 const battingPositions=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
 if((cfg.lineup||[]).includes(playerId)){
  const index=cfg.lineup.indexOf(playerId),used=new Set(cfg.lineup.filter(id=>id!==playerId));
  let replacement=remaining.find(x=>!["SP","RP","P"].includes(x.position)&&!used.has(x.id)&&({C:["C"],"1B":["1B"],"2B":["2B","SS"],"3B":["3B","1B"],SS:["SS","2B"],LF:["LF","OF","CF","RF"],CF:["CF","OF"],RF:["RF","OF","CF"],DH:["C","1B","2B","3B","SS","LF","CF","RF","OF","DH"]}[battingPositions[index]]||[]).includes(x.position));
  if(!replacement){const flexible=remaining.find(x=>!["SP","RP","P"].includes(x.position)&&!used.has(x.id));if(flexible)replacement=flexible;}
  if(!replacement)throw new Error("目前沒有可用野手替補，請先補足替補球員再下放");
  cfg.lineup[index]=replacement.id;
 }
 if((cfg.rotation||[]).includes(playerId)){
  const index=cfg.rotation.indexOf(playerId),replacement=remaining.find(x=>x.position==="SP"&&!(cfg.rotation||[]).includes(x.id));
  if(!replacement)throw new Error("目前沒有其他先發投手可補入輪值，請先補足先發投手再下放");
  cfg.rotation[index]=replacement.id;
 }
 cfg.bullpen=(cfg.bullpen||[]).filter(id=>id!==playerId);
 state.players=state.players.filter(x=>x.id!==playerId);delete state.contracts?.[playerId];
 state.minorLeague??=[];state.minorLeague.push({...p,rosterLevel:"minor",demotedSeason:state.season});
 return p;
}
export function developProspects(state){
 state.minorLeague??=[];
 state.minorLeague=state.minorLeague.map(p=>{
  const age=Number(p.age)||20,months=(Number(p.developmentMonths)||0)+1,ratings={...(p.ratings||{})};
  let seed=hash(p.id+"-"+state.season+"-"+months),random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const growth=age<=20?.62:age<=22?.4:age<=24?.16:.04;
  for(const [key,value] of Object.entries(ratings)){
   const current=Number(value)||30,ceiling=Number(p.potential)||75;
   if(current<ceiling&&random()<growth)ratings[key]=Math.min(ceiling,current+1);
  }
  return {...p,ratings,developmentMonths:months};
 });
 return state.minorLeague;
}

export function manageAIProspects(state,teamId){
 if(!teamId||teamId===state.clubId)return [];
 state.minorLeague??=[];
 const promoted=[];
 const roster=state.players.filter(p=>p.clubId===teamId&&!p.retired);
 if(roster.length>=30)return promoted;
 const cfg=state.lineups?.[teamId]||{lineup:[],rotation:[],bullpen:[]};
 const protectedIds=new Set([...(cfg.lineup||[]),...(cfg.rotation||[])]);
 const prospects=state.minorLeague.filter(p=>p.clubId===teamId).sort((a,b)=>{
  const score=p=>estimatePlayerAbility(p)+(Number(p.potential)||50)*.12+(Number(p.age)<=21?3:0);
  return score(b)-score(a);
 });
 for(const prospect of prospects){
  if(state.players.filter(p=>p.clubId===teamId).length>=30)break;
  const samePosition=state.players.filter(p=>p.clubId===teamId&&p.position===prospect.position&&!p.retired);
  const replaceable=samePosition.filter(p=>!protectedIds.has(p.id)).sort((a,b)=>estimatePlayerAbility(a)-estimatePlayerAbility(b))[0];
  if(!replaceable)continue;
  const prospectScore=estimatePlayerAbility(prospect)+(Number(prospect.potential)||50)*.12+(Number(prospect.age)<=21?3:0);
  if(prospectScore<estimatePlayerAbility(replaceable)+9)continue;
  state.players=state.players.filter(p=>p.id!==replaceable.id);
  state.freeAgents??=[];
  state.freeAgents.push({...replaceable,clubId:null,contractStatus:"released"});
  delete state.contracts?.[replaceable.id];
  for(const key of ["lineup","rotation","bullpen"])cfg[key]=(cfg[key]||[]).filter(id=>id!==replaceable.id);
  state.minorLeague=state.minorLeague.filter(p=>p.id!==prospect.id);
  const player={...prospect,rosterLevel:"major",promotedSeason:state.season};
  delete player.potential;delete player.scoutingConfidence;delete player.developmentMonths;
  state.players.push(player);
  state.contracts??={};
  state.contracts[player.id]={salary:Math.max(180000,Math.round(estimatePlayerSalary(player))),yearsRemaining:2,expirySeason:state.season+1,status:"active",signedSeason:state.season,signingBonus:0};
  promoted.push(player);
  state.aiClubReports??=[];
  state.aiClubReports.push({id:"prospect-"+teamId+"-"+player.id,teamId,season:state.season,matchday:state.matchday||0,type:"promotion",message:teamId+" 將二軍新秀 "+player.name+" 升上一軍，取代 "+replaceable.name});
  if(state.aiClubReports.length>120)state.aiClubReports.splice(0,state.aiClubReports.length-120);
  break;
 }
 return promoted;
}

export function getDraftStatus(state){
 const d=state.draft;if(!d)return {status:"not-started",available:[],history:[]};
 return {...d,currentTeamId:d.status==="active"?currentTeam(d):null,userTurn:d.status==="active"&&currentTeam(d)===state.clubId};
}
