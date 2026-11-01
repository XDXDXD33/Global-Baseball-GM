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
export function executeMultiPlayerTrade(state,{outgoingIds,incomingIds}){
 const outIds=[...new Set((outgoingIds||[]).filter(Boolean))],inIds=[...new Set((incomingIds||[]).filter(Boolean))];
 if(!outIds.length||!inIds.length||outIds.length>3||inIds.length>3)throw new Error("交易雙方各須選擇 1 至 3 名球員");
 if(state.currentGame?.status==="live")throw new Error("比賽進行中不能進行球員交易");
 const outgoing=outIds.map(id=>state.players.find(p=>p.id===id)),incoming=inIds.map(id=>state.players.find(p=>p.id===id));
 if(outgoing.some(p=>!p||p.clubId!==state.clubId))throw new Error("送出的球員必須全部來自本隊");
 if(incoming.some(p=>!p?.clubId||p.clubId===state.clubId))throw new Error("換入的球員必須來自其他球隊");
 const opponentId=incoming[0].clubId;
 if(incoming.some(p=>p.clubId!==opponentId))throw new Error("一次交易只能與同一支球隊談判");
 const userCfg=state.lineups?.[state.clubId]||{};
 if(outIds.some(id=>(userCfg.lineup||[]).includes(id)||(userCfg.rotation||[]).includes(id)))throw new Error("先發打序或先發輪值球員必須先調整陣容才能交易");
 const userRoster=state.players.filter(p=>p.clubId===state.clubId),opponentRoster=state.players.filter(p=>p.clubId===opponentId);
 if(userRoster.length-outgoing.length+incoming.length>30)throw new Error("交易後本隊名單會超過 30 人");
 if(opponentRoster.length-incoming.length+outgoing.length>30)throw new Error("交易後對方名單會超過 30 人");
 const userForeign=userRoster.filter(p=>!outIds.includes(p.id)&&p.foreign).length+incoming.filter(p=>p.foreign).length;
 const opponentForeign=opponentRoster.filter(p=>!inIds.includes(p.id)&&p.foreign).length+outgoing.filter(p=>p.foreign).length;
 if(userForeign>state.foreignLimit)throw new Error("交易後本隊洋將人數會超過名額上限");
 if(opponentForeign>state.foreignLimit)throw new Error("對方球隊交易後洋將人數會超過名額上限");
 const outValue=outgoing.reduce((sum,p)=>sum+calculateTradeValue(p),0),inValue=incoming.reduce((sum,p)=>sum+calculateTradeValue(p),0);
 if(outValue<inValue*.88)throw new Error("對方球團認為整體交易條件不足，請增加籌碼");
 const moved=new Map([...outgoing.map(p=>[p.id,opponentId]),...incoming.map(p=>[p.id,state.clubId])]);
 state.players=state.players.map(p=>moved.has(p.id)?{...p,clubId:moved.get(p.id)}:p);
 repairTeamLineup(state,state.clubId);repairTeamLineup(state,opponentId);
 const record={season:state.season,matchday:state.matchday,fromTeam:state.clubId,toTeam:opponentId,outgoingIds:outgoing.map(p=>p.id),outgoingId:outgoing.length===1?outgoing[0].id:null,outgoingName:outgoing.map(p=>p.name).join("、"),incomingIds:incoming.map(p=>p.id),incomingId:incoming.length===1?incoming[0].id:null,incomingName:incoming.map(p=>p.name).join("、"),outgoingValue:outValue,incomingValue:inValue,date:new Date().toISOString()};
 state.tradeHistory??=[];state.tradeHistory.push(record);
 return record;
}
export function executeOneForOneTrade(state,{outgoingId,incomingId}){
 return executeMultiPlayerTrade(state,{outgoingIds:[outgoingId],incomingIds:[incomingId]});
}
