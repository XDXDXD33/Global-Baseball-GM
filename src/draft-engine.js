import { LEAGUE } from "./data.js";

const POSITIONS = ["C","1B","2B","3B","SS","LF","CF","RF","SP","RP"];
const GIVEN = ["林","陳","張","王","李","黃","吳","劉","蔡","楊","周","鄭","許","謝","郭","洪","曾","邱"];
const NAMES = ["冠宇","承翰","柏廷","子翔","昱廷","俊豪","家豪","宇軒","品睿","奕辰","哲瑋","彥廷","凱翔","皓宇","承恩","宥廷","柏翰","志豪"];
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
  out.push({id:"prospect-"+season+"-"+String(i+1).padStart(3,"0"),name:GIVEN[Math.floor(random()*GIVEN.length)]+NAMES[Math.floor(random()*NAMES.length)],age,position,ratings:Object.fromEntries(Object.entries(ratings).map(([k,v])=>[k,Math.round(v)])),potential:ceiling,scoutingConfidence:Math.round(45+random()*45),source:"虛構新秀",foreign:false,clubId:null,season});
 }
 return out;
}
export function startDraft(state,{count=30,rounds=3}={}){
 if(state.draft?.status==="active")throw new Error("目前已有進行中的選秀會");
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
 if(state.players.filter(x=>x.clubId===state.clubId).length>=30)throw new Error("一軍名單已達 30 人，請先釋出或下放球員");
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
 if(state.currentGame?.status==="live"&&state.currentGame.lineups?.[state.clubId]?.includes(playerId))throw new Error("球員正在比賽中，無法下放");
 const cfg=state.lineups?.[state.clubId]||{};
 if((cfg.lineup||[]).includes(playerId)||(cfg.rotation||[]).includes(playerId))throw new Error("請先將球員移出先發打序與輪值，再下放二軍");
 state.players=state.players.filter(x=>x.id!==playerId);delete state.contracts?.[playerId];
 if(cfg.bullpen)cfg.bullpen=cfg.bullpen.filter(id=>id!==playerId);
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
export function getDraftStatus(state){
 const d=state.draft;if(!d)return {status:"not-started",available:[],history:[]};
 return {...d,currentTeamId:d.status==="active"?currentTeam(d):null,userTurn:d.status==="active"&&currentTeam(d)===state.clubId};
}
