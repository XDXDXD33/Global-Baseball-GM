import {buildDefaultLineup} from "./game-engine.js";
function repairLineup(state,teamId){
 const fresh=buildDefaultLineup(state.players,teamId),current=state.lineups[teamId]||{lineup:[],rotation:[],bullpen:[]};
 const active=new Set(state.players.filter(p=>p.clubId===teamId&&!p.retired).map(p=>p.id));
 const lineup=(current.lineup||[]).filter(id=>active.has(id));
 for(const id of fresh.lineup)if(lineup.length<9&&!lineup.includes(id))lineup.push(id);
 const rotation=(current.rotation||[]).filter(id=>active.has(id));
 for(const id of fresh.rotation)if(rotation.length<5&&!rotation.includes(id))rotation.push(id);
 const bullpen=(current.bullpen||[]).filter(id=>active.has(id));
 for(const id of fresh.bullpen)if(!bullpen.includes(id))bullpen.push(id);
 state.lineups[teamId]={...current,lineup:lineup.slice(0,9),rotation:rotation.slice(0,5),bullpen};
}
function retire(state,player,reason){
 const retired={...player,clubId:null,retired:true,retiredSeason:state.season,retiredAge:Number(player.age)||0,retirementReason:reason};
 state.players=state.players.map(p=>p.id===player.id?retired:p);
 delete state.contracts?.[player.id];
 state.retiredPlayers??=[];state.retiredPlayers.push({playerId:player.id,name:player.name,teamId:player.clubId,season:state.season,age:retired.retiredAge,reason});
 if(player.clubId)repairLineup(state,player.clubId);
 return retired;
}
export function retirePlayer(state,playerId){
 if(state.currentGame?.status==="live")throw new Error("比賽進行中不能辦理球員退休");
 const player=state.players.find(p=>p.id===playerId&&p.clubId===state.clubId&&!p.retired);
 if(!player)throw new Error("只能辦理本隊現役球員退休");
 if((Number(player.age)||0)<35)throw new Error("球員須年滿 35 歲才能申請退休");
 if(state.retiredPlayers?.some(x=>x.playerId===playerId))throw new Error("這名球員已經退休");
 const retired=retire(state,player,"球員主動退休");
 state.contractHistory??=[];state.contractHistory.push({type:"retirement",playerId,playerName:player.name,season:state.season,age:retired.retiredAge});
 return retired;
}
export function processAiRetirements(state){
 const retired=[];
 for(const player of [...state.players]){
  if(!player.clubId||player.clubId===state.clubId||player.retired)continue;
  const age=Number(player.age)||0;
  if(age<37)continue;
  let seed=0;for(const ch of String(player.id)+state.season+"retire")seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const chance=age>=40?1:age===39?.62:age===38?.34:.14;
  if(seed/4294967296<chance)retired.push(retire(state,player,"電腦球團球員退休"));
 }
 return retired;
}
