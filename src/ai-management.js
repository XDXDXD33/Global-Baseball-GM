import {LEAGUE} from "./data.js";
import {estimatePlayerAbility,estimatePlayerSalary} from "./rules.js";
import {buildDefaultLineup} from "./game-engine.js";

const BAT_POS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
const PITCHER=p=>["SP","RP","P"].includes(p.position);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const money=n=>Math.round(Number(n)||0);
const age=p=>Number(p.age)||27;
const ability=p=>estimatePlayerAbility(p);
const teamRoster=(state,id)=>state.players.filter(p=>p.clubId===id&&!p.retired);
const isAvailable=(state,p)=>Number(state.injuries?.[p.id]?.daysRemaining||0)<=0;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const canPlay=(p,pos)=>({C:["C"],"1B":["1B"],"2B":["2B","SS"],"3B":["3B","1B"],SS:["SS","2B"],LF:["LF","OF","CF","RF"],CF:["CF","OF"],RF:["RF","OF","CF"],DH:["C","1B","2B","3B","SS","LF","CF","RF","OF","DH"]}[pos]||[]).includes(p.position);

export function initializeAIClubFinances(state){
 state.aiClubFinances??={};
 for(const club of LEAGUE.clubs){
  if(club.id===state.clubId)continue;
  state.aiClubFinances[club.id]??={budget:105000000,fanbase:8500,ticketPrice:350,monthlyNet:0,strategy:"balanced",lastReview:0};
 }
 return state.aiClubFinances;
}
function report(state,teamId,type,message){
 state.aiClubReports??=[];
 state.aiClubReports.push({id:teamId+"-"+state.season+"-"+(state.matchday||0)+"-"+state.aiClubReports.length,teamId,season:state.season,matchday:state.matchday||0,type,message});
 if(state.aiClubReports.length>120)state.aiClubReports.splice(0,state.aiClubReports.length-120);
}
function standingsRate(state,teamId){
 const rows=(state.schedule||[]).filter(g=>g.status==="final"&&(g.homeId===teamId||g.awayId===teamId));
 if(!rows.length)return .5;
 const wins=rows.filter(g=>g.winnerId===teamId).length,ties=rows.filter(g=>!g.winnerId).length;
 return (wins+ties*.5)/rows.length;
}
function teamStrategy(state,teamId){
 const pct=standingsRate(state,teamId);
 if((state.matchday||1)>20&&pct>=.57)return "contend";
 if((state.matchday||1)>20&&pct<=.40)return "rebuild";
 return "balanced";
}
function positionNeeds(roster){
 const available=roster;
 const need=[];
 for(const pos of BAT_POS){
  if(!available.some(p=>!PITCHER(p)&&canPlay(p,pos)))need.push(pos);
 }
 const sp=available.filter(p=>p.position==="SP").length,rp=available.filter(p=>["RP","P"].includes(p.position)).length;
 if(sp<5)need.push("SP");
 if(rp<7)need.push("RP");
 if(available.length<26)need.push("DEPTH");
 return {need,sp,rp,hitters:available.filter(p=>!PITCHER(p)).length};
}
function candidateFit(p,needs,strategy){
 let score=ability(p);
 if(needs.need.includes(p.position))score+=24;
 else if(needs.need.includes("DEPTH"))score+=6;
 else score-=12;
 if(strategy==="rebuild")score+=(age(p)<=24?12:age(p)>=31?-8:0);
 if(strategy==="contend")score+=(age(p)>=25&&age(p)<=31?7:age(p)>=35?-8:0);
 if(p.foreign)score-=3;
 return score;
}
function refreshMarket(state){
 state.freeAgents??=[];
 if(state.freeAgents.length>=10)return;
 const seed="ai-market-"+state.season+"-"+(state.matchday||0)+"-"+state.freeAgents.length;
 const used=new Set([...state.players,...state.freeAgents].map(p=>p.id));
 const positions=["C","1B","2B","3B","SS","LF","CF","RF","DH","SP","SP","RP","RP","RP","RP"];
 const generated=positions.map((pos,i)=>{
  const n=hash(seed+"-"+i),r=(k)=>20+(hash(n+"-"+k)%61);
  const pitcher=["SP","RP","P"].includes(pos);
  const ratings=pitcher?{velocity:r("v"),control:r("c"),movement:r("m"),stamina:r("s"),fielding:r("f")}:{contact:r("c"),power:r("p"),eye:r("e"),speed:r("s"),fielding:r("f")};
  const id="ai-fa-"+seed+"-"+i;
  return {id,name:"新自由球員 "+String(i+1).padStart(2,"0"),clubId:null,position:pos,age:22+(n%15),foreign:n%7===0,ratings,dataKind:"fictional",contractStatus:"free-agent"};
 }).filter(p=>!used.has(p.id));
 state.freeAgents.push(...generated);
}
function removeFromTeam(state,teamId,player){
 state.players=state.players.map(p=>p.id===player.id?{...p,clubId:null,contractStatus:"released"}:p);
 delete state.contracts?.[player.id];
 const cfg=state.lineups?.[teamId];
 if(cfg)for(const key of ["lineup","rotation","bullpen"])cfg[key]=(cfg[key]||[]).filter(id=>id!==player.id);
 state.freeAgents??=[];state.freeAgents.push({...player,clubId:null,contractStatus:"free-agent"});
}
function signForAI(state,teamId,player,strategy){
 const finance=state.aiClubFinances[teamId],roster=teamRoster(state,teamId);
 if(roster.length>=30)return false;
 const foreign=roster.filter(p=>p.foreign).length;
 if(player.foreign&&foreign>=state.foreignLimit)return false;
 const annual=money(estimatePlayerSalary(player)* (strategy==="contend"?1.12:1.04));
 const bonus=money(annual*.2);
 if(finance.budget<bonus)return false;
 const signed={...player,clubId:teamId,contractStatus:"signed"};
 const existingIndex=state.players.findIndex(p=>p.id===player.id);
 if(existingIndex>=0)state.players[existingIndex]={...state.players[existingIndex],...signed};else state.players.push(signed);
 state.contracts??={};
 const years=strategy==="rebuild"&&age(player)<=24?3:2;
 state.contracts[player.id]={salary:annual,yearsRemaining:years,expirySeason:state.season+years-1,status:"active",signedSeason:state.season,signingBonus:bonus};
 finance.budget-=bonus;
 state.freeAgents=state.freeAgents.filter(p=>p.id!==player.id);
 report(state,teamId,"sign",teamId+" 簽下 "+player.name+"（"+player.position+"），"+years+" 年合約");
 return true;
}
function renewAIContracts(state,teamId){
 const finance=state.aiClubFinances[teamId];
 for(const p of teamRoster(state,teamId)){
  const contract=state.contracts?.[p.id];
  if(!contract||Number(contract.yearsRemaining)>1)continue;
  const rating=ability(p),playerAge=age(p),strategy=finance.strategy;
  const retain=playerAge<=34&&(rating>=48||playerAge<=25);
  if(!retain)continue;
  const salary=money(estimatePlayerSalary(p)*(strategy==="contend"?1.08:1.02)),bonus=money(salary*.05);
  if(finance.budget<bonus)continue;
  const years=playerAge<=25?3:2;
  state.contracts[p.id]={salary,yearsRemaining:years,expirySeason:state.season+years-1,status:"active",signedSeason:state.season,signingBonus:bonus};
  finance.budget-=bonus;
  report(state,teamId,"renew",teamId+" 與 "+p.name+" 完成 "+years+" 年續約");
 }
}
function optimizeLineup(state,teamId){
 const roster=teamRoster(state,teamId).filter(p=>isAvailable(state,p));
 const hitters=roster.filter(p=>!PITCHER(p)),used=new Set(),lineup=[];
 for(const pos of BAT_POS){
  const options=hitters.filter(p=>!used.has(p.id)&&canPlay(p,pos)).sort((a,b)=>{
   const score=p=>ability(p)+(p.position===pos?4:0)+(p.position==="OF"&&["LF","CF","RF"].includes(pos)?-2:0);
   return score(b)-score(a);
  });
  const chosen=options[0]||hitters.find(p=>!used.has(p.id));
  if(chosen){lineup.push(chosen.id);used.add(chosen.id);}
 }
 const pitchers=roster.filter(p=>p.position==="SP").sort((a,b)=>ability(b)-ability(a));
 const relievers=roster.filter(p=>["RP","P"].includes(p.position)).sort((a,b)=>ability(b)-ability(a));
 const old=state.lineups?.[teamId]||{};
 state.lineups??={};
 state.lineups[teamId]={...old,lineup,rotation:pitchers.slice(0,5).map(p=>p.id),bullpen:relievers.map(p=>p.id)};
 state.tactics??={};
 const strategy=state.aiClubFinances[teamId].strategy;
 state.tactics[teamId]={aggressiveHitting:strategy==="contend"?"yes":"no",stealAggression:strategy==="rebuild"?"aggressive":"normal",bullpenHook:strategy==="contend"?"quick":"normal",defenseStyle:"normal"};
}
function fillRoster(state,teamId){
 const finance=state.aiClubFinances[teamId],strategy=finance.strategy;
 let roster=teamRoster(state,teamId);
 const needs=positionNeeds(roster);
 if(roster.length>=26&&!needs.need.some(n=>n!=="DEPTH"))return;
 refreshMarket(state);
 const market=[...state.freeAgents].sort((a,b)=>candidateFit(b,needs,strategy)-candidateFit(a,needs,strategy));
 for(const p of market){
  roster=teamRoster(state,teamId);
  if(roster.length>=26&&needs.need.length===0)break;
  if(roster.length>=30)break;
  if(p.foreign&&roster.filter(x=>x.foreign).length>=state.foreignLimit)continue;
  const currentNeeds=positionNeeds(roster);
  const score=candidateFit(p,currentNeeds,strategy);
  const weakest=roster.filter(x=>p.position==="SP"?x.position==="SP":p.position==="RP"?["RP","P"].includes(x.position):!PITCHER(x)&&canPlay(x,p.position)).sort((a,b)=>ability(a)-ability(b))[0];
  if(roster.length>=26){
   if(!weakest||score<ability(weakest)+12||finance.budget<1000000)continue;
   const penalty=money((state.contracts?.[weakest.id]?.salary||estimatePlayerSalary(weakest))*(state.contracts?.[weakest.id]?.yearsRemaining||1)*.2);
   if(finance.budget<penalty+money(estimatePlayerSalary(p)*.2))continue;
   finance.budget-=penalty;
   removeFromTeam(state,teamId,weakest);
   report(state,teamId,"release",teamId+" 釋出 "+weakest.name+"，騰出位置補強 "+p.name);
  }
  if(signForAI(state,teamId,p,strategy))report(state,teamId,"recruit",teamId+" 補進 "+p.name+"，補足 "+p.position+" 戰力");
 }
}
export function settleAIClubFinances(state){
 initializeAIClubFinances(state);
 for(const club of LEAGUE.clubs){
  if(club.id===state.clubId)continue;
  const finance=state.aiClubFinances[club.id],roster=teamRoster(state,club.id);
  const payroll=roster.reduce((n,p)=>n+(state.contracts?.[p.id]?.salary||estimatePlayerSalary(p)),0);
  const sponsor=3500000+finance.fanbase*30,maintenance=1800000;
  finance.monthlyNet=sponsor-money(payroll/12)-maintenance;
  finance.budget+=finance.monthlyNet;
  finance.fanbase=Math.max(2500,Math.min(20000,Math.round(finance.fanbase*(standingsRate(state,club.id)>=.5?1.002:.999))));
 }
}
export function runAIClubManagement(state,{phase="monthly"}={}){
 initializeAIClubFinances(state);
 const changed=[];
 for(const club of LEAGUE.clubs){
  const teamId=club.id;if(teamId===state.clubId)continue;
  const finance=state.aiClubFinances[teamId];
  finance.strategy=teamStrategy(state,teamId);
  if(phase==="offseason")renewAIContracts(state,teamId);
  else renewAIContracts(state,teamId);
  fillRoster(state,teamId);
  optimizeLineup(state,teamId);
  finance.lastReview=state.matchday||0;
  changed.push(teamId);
 }
 return changed;
}
export function getAIClubSummary(state){
 initializeAIClubFinances(state);
 return LEAGUE.clubs.filter(c=>c.id!==state.clubId).map(c=>{
  const roster=teamRoster(state,c.id),finance=state.aiClubFinances[c.id],needs=positionNeeds(roster);
  return {teamId:c.id,roster:roster.length,foreign:roster.filter(p=>p.foreign).length,budget:finance.budget,strategy:finance.strategy,needs:needs.need};
 });
}
