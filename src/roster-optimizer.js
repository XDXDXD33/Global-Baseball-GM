import { estimatePlayerAbility } from "./rules.js";

const GROUPS=[
 ["SP",4,p=>p.position==="SP"],
 ["RP",9,p=>["RP","P"].includes(p.position)],
 ["C",2,p=>p.position==="C"],
 ["1B",2,p=>p.position==="1B"],
 ["2B",2,p=>["2B","SS"].includes(p.position)],
 ["3B",2,p=>["3B","1B"].includes(p.position)],
 ["SS",2,p=>["SS","2B"].includes(p.position)],
 ["OF",5,p=>["LF","CF","RF","OF"].includes(p.position)]
];
const isPitcher=p=>["SP","RP","P"].includes(p.position);
const comparePlayers=(a,b)=>
 (estimatePlayerAbility(b)-estimatePlayerAbility(a))||
 (Number(!!a.foreign)-Number(!!b.foreign))||
 ((Number(a.age)||27)-(Number(b.age)||27));

function uniqueTeamPlayers(state,teamId){
 const byId=new Map();
 for(const p of [...(state.players||[]),...(state.minorLeague||[])]){
  if(p.clubId!==teamId||!p.id||byId.has(p.id))continue;
  byId.set(p.id,p);
 }
 return [...byId.values()];
}

export function calculateBestRoster(state,teamId=state.clubId){
 const pool=uniqueTeamPlayers(state,teamId),used=new Set(),selected=[],shortages=[];
 let selectedForeign=0;
 const foreignLimit=Math.max(0,Number(state.foreignLimit)||0);
 const eligible=p=>!p.foreign||selectedForeign<foreignLimit;
 const take=(group,count,predicate,fallback=()=>false)=>{
  let choices=pool.filter(p=>!used.has(p.id)&&eligible(p)&&predicate(p)).sort(comparePlayers);
  let chosen=choices.slice(0,count);
  if(chosen.length<count){
   const remaining=pool.filter(p=>!used.has(p.id)&&eligible(p)&&fallback(p)).sort(comparePlayers);
   chosen=[...chosen,...remaining.slice(0,count-chosen.length)];
  }
  chosen.forEach(p=>{
   used.add(p.id);
   if(p.foreign)selectedForeign++;
   selected.push({...p,optimizerGroup:group});
  });
  if(chosen.length<count)shortages.push(group+" 缺少 "+(count-chosen.length)+" 人");
 };
 for(const [group,count,match] of GROUPS){
  const fallback=group==="SP"
   ?p=>["RP","P"].includes(p.position)
   :group==="RP"
    ?p=>p.position==="SP"
    :p=>!isPitcher(p);
  take(group,count,match,fallback);
 }
 const groups=Object.fromEntries(GROUPS.map(([g])=>[g,selected.filter(p=>p.optimizerGroup===g).length]));
 return {selected,shortages,required:28,filled:selected.length,groups,available:pool.length};
}

export function applyBestRoster(state,teamId=state.clubId){
 if(state.currentGame?.status==="live")throw new Error("比賽進行中不能調整球員名單");
 const plan=calculateBestRoster(state,teamId);
 const teamPlayers=uniqueTeamPlayers(state,teamId);
 const selectedIds=new Set(plan.selected.map(p=>p.id));
 const selected=teamPlayers.filter(p=>selectedIds.has(p.id)).map(p=>({...p,rosterLevel:"first"}));
 const reserves=teamPlayers.filter(p=>!selectedIds.has(p.id)).map(p=>({...p,rosterLevel:"minor",demotedByOptimizer:true}));

 // 只重新分配既有一、二軍球員。自由球員、合約及其他球隊資料完全不動。
 state.players=[
  ...(state.players||[]).filter(p=>p.clubId!==teamId),
  ...selected
 ];
 state.minorLeague=[
  ...(state.minorLeague||[]).filter(p=>p.clubId!==teamId),
  ...reserves
 ];

 const hitters=selected.filter(p=>!isPitcher(p)).sort(comparePlayers);
 const usedHitters=new Set(),lineup=[];
 const slots=[
  ["C",["C"]],["1B",["1B"]],["2B",["2B","SS"]],["3B",["3B","1B"]],
  ["SS",["SS","2B"]],["LF",["LF","OF","CF","RF"]],["CF",["CF","OF","LF","RF"]],
  ["RF",["RF","OF","CF","LF"]],["DH",["C","1B","2B","3B","SS","LF","CF","RF","OF","DH"]]
 ];
 for(const [,allowed] of slots){
  let p=hitters.filter(x=>allowed.includes(x.position)&&!usedHitters.has(x.id)).sort(comparePlayers)[0];
  if(!p)p=hitters.find(x=>!usedHitters.has(x.id));
  if(p){lineup.push(p.id);usedHitters.add(p.id);}
 }
 const rotation=selected.filter(p=>p.optimizerGroup==="SP").sort(comparePlayers).map(p=>p.id);
 const bullpen=selected.filter(p=>p.optimizerGroup==="RP").sort(comparePlayers).map(p=>p.id);
 state.lineups??={};
 state.lineups[teamId]={...(state.lineups[teamId]||{}),lineup,rotation,bullpen};
 return plan;
}
