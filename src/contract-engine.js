import {estimatePlayerSalary,countForeignPlayers} from "./rules.js";
import {buildDefaultLineup} from "./game-engine.js";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rosterOf=(state,teamId)=>state.players.filter(p=>p.clubId===teamId);
function repairLineup(state,teamId){
 const cfg=state.lineups[teamId]||{lineup:[],rotation:[],bullpen:[]};
 const valid=new Set(rosterOf(state,teamId).map(p=>p.id));
 cfg.lineup=(cfg.lineup||[]).filter(id=>valid.has(id));
 cfg.rotation=(cfg.rotation||[]).filter(id=>valid.has(id));
 cfg.bullpen=(cfg.bullpen||[]).filter(id=>valid.has(id));
 const fresh=buildDefaultLineup(state.players,teamId);
 for(const id of fresh.lineup)if(cfg.lineup.length<9&&!cfg.lineup.includes(id))cfg.lineup.push(id);
 for(const id of fresh.rotation)if(cfg.rotation.length<5&&!cfg.rotation.includes(id))cfg.rotation.push(id);
 for(const id of fresh.bullpen)if(!cfg.bullpen.includes(id))cfg.bullpen.push(id);
 state.lineups[teamId]=cfg;
}
export function initializeContracts(players,season=2026){
 const contracts={};
 for(const p of players){
  if(!p.clubId||p.retired)continue;
  const years=2+(hash(p.id+"-"+season)%3);
  contracts[p.id]={salary:estimatePlayerSalary(p),yearsRemaining:years,expirySeason:season+years-1,status:"active",signedSeason:season,signingBonus:0};
 }
 return contracts;
}
export function contractDemand(player){
 const age=Number(player.age)||27,ageFactor=age<=24?1.12:age<=28?1.08:age<=32?1:.86;
 return Math.max(100000,Math.round(estimatePlayerSalary(player)*ageFactor/1000)*1000);
}
export function offerExtension(state,{playerId,salary,years=2}){
 const p=state.players.find(x=>x.id===playerId&&x.clubId===state.clubId);
 if(!p)throw new Error("只能與本隊球員談續約");
 const n=Number(salary),term=Number(years),demand=contractDemand(p);
 if(!Number.isFinite(n)||n<100000)throw new Error("年薪至少為 100,000 元");
 if(!Number.isInteger(term)||term<1||term>5)throw new Error("續約年限須為 1 至 5 年");
 if(n<demand*.92)throw new Error("球員拒絕報價，期望年薪約為 $"+demand.toLocaleString());
 const current=state.contracts?.[playerId]||{salary:estimatePlayerSalary(p),yearsRemaining:1};
 const bonus=Math.round(n*.05);
 if(state.budget<bonus)throw new Error("可用資金不足，無法支付續約金");
 const yearsRemaining=clamp(Number(current.yearsRemaining)||0,0,5)+term;
 state.budget-=bonus;state.contracts??={};
 state.contracts[playerId]={salary:Math.round(n),yearsRemaining,expirySeason:state.season+yearsRemaining-1,status:"active",signedSeason:state.season,signingBonus:bonus};
 state.contractHistory??=[];state.contractHistory.push({type:"extension",playerId,playerName:p.name,season:state.season,salary:Math.round(n),years:term,bonus});
 return {player:p,contract:state.contracts[playerId],bonus,demand};
}
export function signFreeAgent(state,{playerId,years=2,salary=null}){
 const p=state.freeAgents?.find(x=>x.id===playerId);
 if(!p)throw new Error("這名球員已不在自由球員市場");
 const roster=rosterOf(state,state.clubId);
 if(roster.length>=30)throw new Error("本隊名單已達 30 人上限，請先釋出球員");
 if(p.foreign&&countForeignPlayers(roster)>=state.foreignLimit)throw new Error("洋將名額已滿，無法簽下這名球員");
 const term=Number(years),annual=Number(salary??contractDemand(p));
 if(!Number.isInteger(term)||term<1||term>5)throw new Error("合約年限須為 1 至 5 年");
 if(!Number.isFinite(annual)||annual<100000)throw new Error("年薪至少為 100,000 元");
 const demand=contractDemand(p);
 if(annual<demand*.9)throw new Error("球員拒絕合約，期望年薪約為 $"+demand.toLocaleString());
 const bonus=Math.round(annual*.2);
 if(state.budget<bonus)throw new Error("資金不足，無法支付簽約金");
 const signed={...p,clubId:state.clubId,source:p.source||"遊戲自由球員市場",contractStatus:"signed"};
 state.players.push(signed);state.contracts??={};
 state.contracts[playerId]={salary:Math.round(annual),yearsRemaining:term,expirySeason:state.season+term-1,status:"active",signedSeason:state.season,signingBonus:bonus};
 state.budget-=bonus;state.freeAgents=state.freeAgents.filter(x=>x.id!==playerId);
 const cfg=state.lineups[state.clubId]||(state.lineups[state.clubId]={lineup:[],rotation:[],bullpen:[]});
 if(["RP","P"].includes(signed.position))cfg.bullpen.push(signed.id);
 if(signed.position==="SP"&&cfg.rotation.length<5)cfg.rotation.push(signed.id);
 if(cfg.lineup.length<9&&!["SP","RP","P"].includes(signed.position))cfg.lineup.push(signed.id);
 state.contractHistory??=[];state.contractHistory.push({type:"sign",playerId,playerName:signed.name,season:state.season,salary:Math.round(annual),years:term,bonus});
 return {player:signed,contract:state.contracts[playerId],bonus};
}
export function releasePlayer(state,playerId){
 const p=state.players.find(x=>x.id===playerId&&x.clubId===state.clubId);
 if(!p)throw new Error("只能釋出本隊球員");
 if(state.currentGame?.status==="live"&&state.currentGame.lineups[state.clubId]?.includes(playerId))throw new Error("球員正在比賽中，請比賽結束後再釋出");
 const c=state.contracts?.[playerId]||{salary:estimatePlayerSalary(p),yearsRemaining:1};
 const penalty=Math.round((Number(c.salary)||0)*Math.max(0,Number(c.yearsRemaining)||0)*.2);
 if(state.budget<penalty)throw new Error("資金不足，無法支付合約解約補償 $"+penalty.toLocaleString());
 state.budget-=penalty;state.players=state.players.map(x=>x.id===playerId?{...x,clubId:null,contractStatus:"released"}:x);
 delete state.contracts[playerId];
 state.lineups[state.clubId].lineup=(state.lineups[state.clubId].lineup||[]).filter(id=>id!==playerId);
 state.lineups[state.clubId].rotation=(state.lineups[state.clubId].rotation||[]).filter(id=>id!==playerId);
 state.lineups[state.clubId].bullpen=(state.lineups[state.clubId].bullpen||[]).filter(id=>id!==playerId);
 repairLineup(state,state.clubId);
 state.freeAgents??=[];state.freeAgents.push({...p,clubId:null,contractStatus:"free-agent"});
 state.contractHistory??=[];state.contractHistory.push({type:"release",playerId,playerName:p.name,season:state.season,penalty});
 return {player:p,penalty};
}
export function advanceContractYear(state){
 const expired=[];
 for(const p of [...state.players].filter(x=>x.clubId&&!x.retired)){
  const c=state.contracts?.[p.id]||{salary:estimatePlayerSalary(p),yearsRemaining:1};
  const remaining=Math.max(0,(Number(c.yearsRemaining)||1)-1);
  if(remaining>0){state.contracts[p.id]={...c,yearsRemaining:remaining,expirySeason:state.season+remaining-1};continue;}
  expired.push(p);
  state.players=state.players.map(x=>x.id===p.id?{...x,clubId:null,contractStatus:"free-agent"}:x);
  delete state.contracts[p.id];
  const cfg=state.lineups?.[p.clubId];
  if(cfg)for(const key of ["lineup","rotation","bullpen"])cfg[key]=(cfg[key]||[]).filter(id=>id!==p.id);
  state.freeAgents??=[];
  if(!state.freeAgents.some(x=>x.id===p.id))state.freeAgents.push({...p,clubId:null,contractStatus:"free-agent"});
 }
 for(const teamId of Object.keys(state.lineups||{}))repairLineup(state,teamId);
 state.contractHistory??=[];
 state.contractHistory.push(...expired.map(p=>({type:"expiry",playerId:p.id,playerName:p.name,teamId:p.clubId,season:state.season})));
 return expired;
}
