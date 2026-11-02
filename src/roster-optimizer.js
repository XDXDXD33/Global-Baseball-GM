import { estimatePlayerAbility } from "./rules.js";
const GROUPS=[["SP",4,p=>p.position==="SP"],["RP",9,p=>["RP","P"].includes(p.position)],["C",2,p=>p.position==="C"],["1B",2,p=>p.position==="1B"],["2B",2,p=>p.position==="2B"],["3B",2,p=>p.position==="3B"],["SS",2,p=>p.position==="SS"],["OF",5,p=>["LF","CF","RF","OF"].includes(p.position)]];
export function calculateBestRoster(state,teamId=state.clubId){
 const active=(state.players||[]).filter(p=>p.clubId===teamId),farm=(state.minorLeague||[]).filter(p=>p.clubId===teamId),free=(state.freeAgents||[]).filter(p=>!p.foreign);
 const pool=[...active,...farm,...free],used=new Set(),selected=[],shortages=[];
 for(const [group,count,match] of GROUPS){
  const choices=pool.filter(p=>match(p)&&!used.has(p.id)).sort((a,b)=>estimatePlayerAbility(b)-estimatePlayerAbility(a));
  const chosen=choices.slice(0,count);chosen.forEach(p=>{used.add(p.id);selected.push({...p,optimizerGroup:group});});
  if(chosen.length<count)shortages.push(group+" 尚缺 "+(count-chosen.length)+" 人");
 }
 return {selected,shortages,required:28,filled:selected.length,groups:Object.fromEntries(GROUPS.map(([g,n])=>[g,selected.filter(p=>p.optimizerGroup===g).length]))};
}
export function applyBestRoster(state,teamId=state.clubId){
 const plan=calculateBestRoster(state,teamId);
 if(plan.shortages.length)throw new Error("目前可用球員無法組成完整 28 人名單："+plan.shortages.join("、")+"。請先透過自由球員或二軍補足位置。");
 if(state.currentGame?.status==="live")throw new Error("比賽進行中不能調整球員名單");
 const selectedIds=new Set(plan.selected.map(p=>p.id));
 const selectedFree=plan.selected.filter(p=>state.freeAgents?.some(x=>x.id===p.id));
 state.players=(state.players||[]).filter(p=>p.clubId!==teamId||selectedIds.has(p.id)).map(p=>p.clubId===teamId?{...p,rosterLevel:"first"}:p);
 for(const p of selectedFree){state.players.push({...p,clubId:teamId,rosterLevel:"first",contractStatus:"signed"});state.freeAgents=state.freeAgents.filter(x=>x.id!==p.id);state.contracts??={};state.contracts[p.id]={salary:Math.round((p.marketDemand||2500000)*.08),yearsRemaining:2,expirySeason:state.season+1,status:"active",signedSeason:state.season,signingBonus:0};}
 state.minorLeague??=[];
 state.minorLeague=state.minorLeague.filter(p=>p.clubId!==teamId||!selectedIds.has(p.id));
 for(const p of plan.selected){const active=state.players.find(x=>x.id===p.id);if(active)active.rosterLevel="first";}
 for(const p of [...state.players].filter(p=>p.clubId===teamId&&!selectedIds.has(p.id))){state.players=state.players.filter(x=>x.id!==p.id);state.minorLeague.push({...p,rosterLevel:"minor",demotedByOptimizer:true});}
 state.lineups??={};const chosen=state.players.filter(p=>p.clubId===teamId),used=new Set(),lineup=[];
 const slots=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
 for(const pos of slots){const allowed=pos==="DH"?["C","1B","2B","3B","SS","LF","CF","RF","OF","DH"]:(pos==="LF"?["LF","OF","CF","RF"]:pos==="CF"?["CF","OF","LF","RF"]:pos==="RF"?["RF","OF","CF","LF"]:[pos]);const p=chosen.filter(x=>allowed.includes(x.position)&&!["SP","RP","P"].includes(x.position)&&!used.has(x.id)).sort((a,b)=>estimatePlayerAbility(b)-estimatePlayerAbility(a))[0];if(p){lineup.push(p.id);used.add(p.id);}}
 if(lineup.length!==9)throw new Error("28 人名單已完成，但無法組成九個不重複的先發守位，請調整野手守位。");
 const rotation=chosen.filter(p=>p.position==="SP").sort((a,b)=>estimatePlayerAbility(b)-estimatePlayerAbility(a)).slice(0,4).map(p=>p.id);
 const bullpen=chosen.filter(p=>["RP","P"].includes(p.position)).sort((a,b)=>estimatePlayerAbility(b)-estimatePlayerAbility(a)).map(p=>p.id);
 state.lineups[teamId]={...(state.lineups[teamId]||{}),lineup,rotation,bullpen};
 return plan;
}
