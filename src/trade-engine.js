import {estimatePlayerAbility,countForeignPlayers} from "./rules.js";
const POSITIONS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
const canPlay=(p,pos)=>({C:["C"],"1B":["1B"],"2B":["2B","SS"],"3B":["3B","1B"],SS:["SS","2B"],LF:["LF","OF","CF","RF"],CF:["CF","OF"],RF:["RF","OF","CF"],DH:["C","1B","2B","3B","SS","LF","CF","RF","OF","DH"]}[pos]||[]).includes(p.position);
const pitcher=p=>["SP","RP","P"].includes(p.position);
export function calculateTradeValue(player){
 const age=Number(player.age)||27,factor=age<=24?1.12:age<=27?1.05:age<=30?1:age<=33?.9:.78;
 return Math.round(estimatePlayerAbility(player)*factor*10)/10;
}
function repairTeamLineup(state,teamId){
 const roster=state.players.filter(p=>p.clubId===teamId),cfg=state.lineups[teamId]||{lineup:[],rotation:[],bullpen:[]},used=new Set();
 const lineup=POSITIONS.map((pos,i)=>{
  const current=roster.find(p=>p.id===cfg.lineup?.[i]);
  let chosen=current&&!pitcher(current)&&canPlay(current,pos)&&!used.has(current.id)?current:roster.find(p=>!pitcher(p)&&!used.has(p.id)&&canPlay(p,pos));
  if(!chosen)chosen=roster.find(p=>!pitcher(p)&&!used.has(p.id));
  if(chosen)used.add(chosen.id);
  return chosen?.id||null;
 }).filter(Boolean);
 const rotation=[];
 for(const id of cfg.rotation||[]){const p=roster.find(x=>x.id===id&&x.position==="SP");if(p&&!rotation.includes(id)&&rotation.length<5)rotation.push(id);}
 for(const p of roster.filter(x=>x.position==="SP"))if(rotation.length<5&&!rotation.includes(p.id))rotation.push(p.id);
 const bullpen=roster.filter(p=>["RP","P"].includes(p.position)).map(p=>p.id);
 state.lineups[teamId]={...cfg,lineup,rotation,bullpen};
}
export function executeOneForOneTrade(state,{outgoingId,incomingId}){
 const outgoing=state.players.find(p=>p.id===outgoingId),incoming=state.players.find(p=>p.id===incomingId);
 if(!outgoing||outgoing.clubId!==state.clubId)throw new Error("請選擇自己球隊的球員作為交易籌碼");
 if(!incoming||!incoming.clubId||incoming.clubId===state.clubId)throw new Error("請選擇其他球隊的球員");
 const opponentId=incoming.clubId,userCfg=state.lineups?.[state.clubId]||{};
 if((userCfg.lineup||[]).includes(outgoing.id)||(userCfg.rotation||[]).includes(outgoing.id))throw new Error("這名球員目前在先發打序或先發輪值，請先調整陣容再交易");
 const userRoster=state.players.filter(p=>p.clubId===state.clubId),opponentRoster=state.players.filter(p=>p.clubId===opponentId);
 const userForeign=userRoster.filter(p=>p.id!==outgoing.id&&p.foreign).length+(incoming.foreign?1:0);
 const opponentForeign=opponentRoster.filter(p=>p.id!==incoming.id&&p.foreign).length+(outgoing.foreign?1:0);
 if(userForeign>state.foreignLimit)throw new Error("交易後本隊洋將人數會超過名額上限");
 if(opponentForeign>state.foreignLimit)throw new Error("對方球隊交易後會超過洋將名額，無法完成交易");
 const outValue=calculateTradeValue(outgoing),inValue=calculateTradeValue(incoming);
 if(outValue<inValue*.88)throw new Error("對方球團認為交易條件不足，請提高交易籌碼");
 state.players=state.players.map(p=>p.id===outgoing.id?{...p,clubId:opponentId}:p.id===incoming.id?{...p,clubId:state.clubId}:p);
 state.lineups[state.clubId]??={lineup:[],rotation:[],bullpen:[]};
 state.lineups[state.clubId].bullpen=(state.lineups[state.clubId].bullpen||[]).filter(id=>id!==outgoing.id);
 if(["RP","P"].includes(incoming.position))state.lineups[state.clubId].bullpen.push(incoming.id);
 if(incoming.position==="SP"&&(state.lineups[state.clubId].rotation||[]).length<5)state.lineups[state.clubId].rotation.push(incoming.id);
 repairTeamLineup(state,opponentId);
 const record={season:state.season,matchday:state.matchday,fromTeam:state.clubId,toTeam:opponentId,outgoingId:outgoing.id,outgoingName:outgoing.name,incomingId:incoming.id,incomingName:incoming.name,outgoingValue:outValue,incomingValue:inValue,date:new Date().toISOString()};
 state.tradeHistory??=[];state.tradeHistory.push(record);
 return record;
}
