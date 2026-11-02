import {estimatePlayerSalary,estimatePlayerAbility,countForeignPlayers} from "./rules.js";
import {buildDefaultLineup} from "./game-engine.js";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rosterOf=(state,teamId)=>state.players.filter(p=>p.clubId===teamId&&!p.retired);
const STAFF_MONTHLY=(state,teamId)=>Object.values(state.staffByClub?.[teamId]||{}).reduce((n,p)=>n+(Number(p.monthlySalary)||0),0);
export function calculateAnnualPayroll(state,teamId=state.clubId){
 return rosterOf(state,teamId).reduce((sum,p)=>sum+(Number(state.contracts?.[p.id]?.salary)||estimatePlayerSalary(p)),0);
}
export function calculateAvailableBudget(state,teamId=state.clubId){
 return (Number(state.budget)||0)-calculateAnnualPayroll(state,teamId)-STAFF_MONTHLY(state,teamId)*12;
}
function requireAffordablePayroll(state,nextAnnualPayroll,upfront,teamId=state.clubId){
 const staffReserve=STAFF_MONTHLY(state,teamId)*12;
 const remaining=(Number(state.budget)||0)-Number(upfront||0)-nextAnnualPayroll-staffReserve;
 if(remaining<0){
  const shortage=Math.abs(Math.round(remaining));
  throw new Error("可用資金不足。簽約金及下一年度球員、教練團薪資預留後，仍短缺 $"+shortage.toLocaleString()+"；請降低年薪或先調整現有薪資結構。");
 }
}
function upsertFreeAgent(state,player){
 state.freeAgents??=[];
 const record={...player,clubId:null,contractStatus:"free-agent"};
 const index=state.freeAgents.findIndex(x=>x.id===record.id);
 if(index>=0)state.freeAgents[index]=record;
 else state.freeAgents.push(record);
 return record;
}
const BATTING_POSITIONS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
const CAN_PLAY={C:["C"],"1B":["1B"],"2B":["2B","SS"],"3B":["3B","1B"],SS:["SS","2B"],LF:["LF","OF","CF","RF"],CF:["CF","OF"],RF:["RF","OF","CF"],DH:["C","1B","2B","3B","SS","LF","CF","RF","OF","DH"]};
const PITCHER=p=>["SP","RP","P"].includes(p.position);
function placeSignedPlayer(state,player){
 state.lineups??={};
 const cfg=state.lineups[state.clubId]||(state.lineups[state.clubId]={lineup:[],rotation:[],bullpen:[]});
 cfg.lineup??=[];cfg.rotation??=[];cfg.bullpen??=[];
 const ability=estimatePlayerAbility(player);
 if(player.position==="SP"){
  if(cfg.rotation.includes(player.id))return;
  if(cfg.rotation.length<5){cfg.rotation.push(player.id);return;}
  let weakest=-1,score=Infinity;
  cfg.rotation.forEach((id,i)=>{const p=state.players.find(x=>x.id===id);if(p&&estimatePlayerAbility(p)<score){score=estimatePlayerAbility(p);weakest=i;}});
  if(weakest>=0&&ability>score)cfg.rotation[weakest]=player.id;
  return;
 }
 if(["RP","P"].includes(player.position)){
  if(!cfg.bullpen.includes(player.id))cfg.bullpen.push(player.id);
  return;
 }
 if(cfg.lineup.includes(player.id))return;
 if(cfg.lineup.length<9){cfg.lineup.push(player.id);return;}
 const compatible=cfg.lineup.map((id,index)=>({id,index,slot:BATTING_POSITIONS[index]}))
  .filter(x=>(CAN_PLAY[x.slot]||[]).includes(player.position));
 let weakest=null,score=Infinity;
 for(const slot of compatible){
  const incumbent=state.players.find(x=>x.id===slot.id);
  if(!incumbent)continue;
  const value=estimatePlayerAbility(incumbent)+(incumbent.position===slot.slot?1.5:0);
  if(value<score){score=value;weakest=slot;}
 }
 if(weakest&&ability>score)cfg.lineup[weakest.index]=player.id;
}
function repairLineup(state,teamId){
 state.lineups??={};
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
export function contractDemand(player,state=null){
 const age=Number(player.age)||27,ageFactor=age<=24?1.12:age<=28?1.08:age<=32?1:.86;
 if(Number(player.marketDemand)>0){const fan=Number(state?.fanbase)||5000,win=state?.wins+state?.losses?(Number(state.wins)||0)/(Number(state.wins||0)+Number(state.losses||0)):.5;const fanDiscount=Math.min(.18,Math.max(0,(fan-5000)/100000)),winDiscount=Math.min(.12,Math.max(0,(win-.5)*.24));return Math.max(100000,Math.round(player.marketDemand*(1-fanDiscount-winDiscount)/100000)*100000);}
 return Math.max(100000,Math.round(estimatePlayerSalary(player)*ageFactor/1000)*1000);
}
export function offerExtension(state,{playerId,salary,years=2}){
 const p=state.players.find(x=>x.id===playerId&&x.clubId===state.clubId);
 if(!p)throw new Error("只能與本隊球員談續約");
 const n=Number(salary),term=Number(years),demand=contractDemand(p,state);
 if(!Number.isFinite(n)||n<100000)throw new Error("年薪至少為 100,000 元");
 if(!Number.isInteger(term)||term<1||term>5)throw new Error("續約年限須為 1 至 5 年");
 if(n<demand*.92)throw new Error("球員拒絕報價，期望年薪約為 $"+demand.toLocaleString());
 const current=state.contracts?.[playerId]||{salary:estimatePlayerSalary(p),yearsRemaining:1};
 const bonus=Math.round(n*.05),currentSalary=Number(current.salary)||estimatePlayerSalary(p);
 const payrollAfter=calculateAnnualPayroll(state)-currentSalary+n;
 requireAffordablePayroll(state,payrollAfter,bonus);
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
 const term=Number(years),annual=Number(salary??contractDemand(p,state));
 if(!Number.isInteger(term)||term<1||term>5)throw new Error("合約年限須為 1 至 5 年");
 if(!Number.isFinite(annual)||annual<100000)throw new Error("年薪至少為 100,000 元");
 const demand=contractDemand(p,state);
 if(annual<demand*.9)throw new Error("球員拒絕合約，期望年薪約為 $"+demand.toLocaleString());
 const bonus=Math.round(annual*.2);
 requireAffordablePayroll(state,calculateAnnualPayroll(state)+annual,bonus);
 const signed={...p,clubId:state.clubId,rosterLevel:"first",source:p.source||"遊戲自由球員市場",contractStatus:"signed"};
 state.players??=[];
 const index=state.players.findIndex(x=>x.id===p.id);
 if(index>=0)state.players[index]=signed;else state.players.push(signed);
 state.contracts??={};
 state.contracts[p.id]={salary:Math.round(annual),yearsRemaining:term,expirySeason:state.season+term-1,status:"active",signedSeason:state.season,signingBonus:bonus};
 state.budget-=bonus;state.freeAgents=state.freeAgents.filter(x=>x.id!==playerId);
 placeSignedPlayer(state,signed);
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
 state.budget-=penalty;
 state.players=state.players.map(x=>x.id===playerId?{...x,clubId:null,contractStatus:"released"}:x);
 delete state.contracts[playerId];
 state.lineups??={};
 const cfg=state.lineups[state.clubId]||(state.lineups[state.clubId]={lineup:[],rotation:[],bullpen:[]});
 for(const key of ["lineup","rotation","bullpen"])cfg[key]=(cfg[key]||[]).filter(id=>id!==playerId);
 repairLineup(state,state.clubId);
 upsertFreeAgent(state,p);
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
  upsertFreeAgent(state,p);
 }
 for(const teamId of Object.keys(state.lineups||{}))repairLineup(state,teamId);
 state.contractHistory??=[];
 state.contractHistory.push(...expired.map(p=>({type:"expiry",playerId:p.id,playerName:p.name,teamId:p.clubId,season:state.season})));
 return expired;
}
export function signForeignFreeAgent(state,{playerId,years=1,salary=null}){
 const overseas=state.overseasMarket?.find(x=>x.id===playerId);
 const historical=state.foreignMarket?.find(x=>x.id===playerId);
 const candidate=overseas||historical;
 if(!candidate||!candidate.foreign)throw new Error("這名外籍球員目前不在招募市場");
 const existingActive=state.players.find(x=>x.clubId&&x.sourcePlayerId&&candidate.sourcePlayerId&&x.sourcePlayerId===candidate.sourcePlayerId);
 if(existingActive||state.players.some(x=>x.clubId&&x.id===candidate.id))throw new Error("這名球員目前仍隸屬其他球團，不能從招募市場直接挖走");
 const freeRecord=candidate.sourcePlayerId?(state.freeAgents||[]).find(x=>x.sourcePlayerId===candidate.sourcePlayerId):null;
 const inactiveRecord=candidate.sourcePlayerId?(state.players||[]).find(x=>!x.clubId&&!x.retired&&x.sourcePlayerId===candidate.sourcePlayerId):null;
 const base=inactiveRecord||freeRecord||candidate;
 const roster=rosterOf(state,state.clubId).filter(x=>x.rosterLevel!=="minor");
 if(roster.length>=30)throw new Error("一軍名單已達 30 人上限，請先釋出或下放球員");
 if(countForeignPlayers(roster)>=state.foreignLimit)throw new Error("一軍洋將名額已滿。請先下放或釋出現有洋將。");
 const term=Number(years),annual=Number(salary??contractDemand(candidate,state)),demand=contractDemand(candidate,state);
 if(!Number.isInteger(term)||term<1||term>5)throw new Error("合約年限須為 1 至 5 年");
 if(!Number.isFinite(annual)||annual<100000)throw new Error("年薪至少為 100,000 元");
 if(annual<demand*.9)throw new Error("球員拒絕報價，期望年薪約為 $"+demand.toLocaleString());
 const bonus=Math.round(annual*.2);
 requireAffordablePayroll(state,calculateAnnualPayroll(state)+annual,bonus);
 const id=base===candidate?"signed-"+candidate.id+"-"+state.season:base.id;
 const signed={...base,id,clubId:state.clubId,rosterLevel:"first",contractStatus:"signed",source:base.source||"國際洋將招募市場",marketType:base.marketType||candidate.marketType};
 state.players??=[];
 const index=state.players.findIndex(x=>x.id===id);
 if(index>=0)state.players[index]=signed;else state.players.push(signed);
 state.contracts??={};
 state.contracts[id]={salary:Math.round(annual),yearsRemaining:term,expirySeason:state.season+term-1,status:"active",signedSeason:state.season,signingBonus:bonus};
 state.budget-=bonus;
 state.freeAgents=(state.freeAgents||[]).filter(x=>x.id!==base.id&&(!candidate.sourcePlayerId||x.sourcePlayerId!==candidate.sourcePlayerId));
 if(overseas)state.overseasMarket=state.overseasMarket.filter(x=>x.id!==candidate.id);
 if(historical)state.foreignMarket=state.foreignMarket.filter(x=>x.id!==candidate.id&&(!candidate.sourcePlayerId||x.sourcePlayerId!==candidate.sourcePlayerId));
 placeSignedPlayer(state,signed);
 state.contractHistory??=[];state.contractHistory.push({type:"foreign-sign",playerId:id,playerName:signed.name,season:state.season,salary:Math.round(annual),years:term,bonus});
 return {player:signed,bonus,demand};
}
