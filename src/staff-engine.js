import { LEAGUE } from "./data.js";
import { calculateAvailableBudget } from "./contract-engine.js";
const ROLES=["hitting","pitching","fielding","scout","medical"];
const LABELS={hitting:"打擊教練",pitching:"投手教練",fielding:"守備教練",scout:"球探",medical:"防護員"};
const NAMES=["林","陳","張","王","李","黃","吳","劉","蔡","楊","周","鄭","許","謝","郭","洪"];
const GIVEN=["冠宇","承翰","柏廷","子翔","昱廷","俊豪","家豪","宇軒","品睿","奕辰","哲瑋","彥廷","凱翔","皓宇","承恩","宥廷"];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function makeCandidate(seed,role,index,season){
 const h=hash(seed+"-"+role+"-"+index),skill=48+h%43;
 return {id:"staff-"+season+"-"+role+"-"+index,name:NAMES[h%NAMES.length]+GIVEN[(h>>>5)%GIVEN.length],role,skill,specialty:role==="hitting"?["contact","power","eye"][h%3]:role==="pitching"?["velocity","control","movement","stamina"][h%4]:role==="fielding"?["fielding","range"][h%2]:role==="scout"?"evaluation":"recovery",monthlySalary:90000+skill*2300,clubId:null,experience:2+h%19};
}
export function generateStaffMarket(season=2026){
 return ROLES.flatMap(role=>Array.from({length:4},(_,i)=>makeCandidate("market",role,i,season)));
}
export function initializeStaff(state){
 state.staffByClub??={};
 state.staffMarket??=generateStaffMarket(state.season||2026);
 for(const club of LEAGUE.clubs){
  state.staffByClub[club.id]??={};
  for(const role of ROLES){
   if(!state.staffByClub[club.id][role]){
    const h=hash((state.season||2026)+"-"+club.id+"-"+role);
    state.staffByClub[club.id][role]={id:"staff-default-"+club.id+"-"+role,name:"球團聘任"+LABELS[role],role,skill:52+h%13,specialty:role==="hitting"?"contact":role==="pitching"?"control":role==="fielding"?"fielding":role==="scout"?"evaluation":"recovery",monthlySalary:100000,clubId:club.id,experience:3,default:true};
   }
  }
 }
 state.scoutingReports??=[];
 return state.staffByClub;
}
export function getStaffSummary(state,teamId=state.clubId){
 initializeStaff(state);
 return ROLES.map(role=>({...state.staffByClub[teamId][role],label:LABELS[role]}));
}
export function hireStaff(state,{candidateId,role}){
 initializeStaff(state);
 const candidate=state.staffMarket.find(x=>x.id===candidateId&&x.role===role);
 if(!candidate)throw new Error("這位人才已不在市場，請重新整理名單");
 const signingFee=Math.round(candidate.monthlySalary*2);
 const old=state.staffByClub[state.clubId][role];
 const availableAfter=calculateAvailableBudget(state)+(Number(old?.monthlySalary)||0)*12-(Number(candidate.monthlySalary)||0)*12-signingFee;
 if(availableAfter<0)throw new Error("扣除下一年度薪資預留後，可用資金不足，無法聘任這位人才。");
 if(old)state.staffMarket.push({...old,clubId:null,availableSeason:state.season});
 state.staffByClub[state.clubId][role]={...candidate,clubId:state.clubId,hiredSeason:state.season,signingFee};
 state.staffMarket=state.staffMarket.filter(x=>x.id!==candidateId);
 state.budget-=signingFee;
 return state.staffByClub[state.clubId][role];
}
function teamBudget(state){return Number(state.budget)||0;}
export function staffFor(state,teamId){
 initializeStaff(state);
 return state.staffByClub[teamId]||{};
}
export function getCoachBonus(state,player,attribute){
 const team=staffFor(state,player.clubId);
 const role=["contact","power","eye"].includes(attribute)?"hitting":["velocity","control","movement","stamina"].includes(attribute)?"pitching":"fielding";
 const coach=team[role];if(!coach)return 0;
 const match=coach.specialty===attribute?1.25:1;
 return Math.max(0,Number(coach.skill||50)-45)*.0018*match;
}
export function scoutingAccuracy(state,teamId=state.clubId){
 const scout=staffFor(state,teamId).scout;
 return clamp(42+(Number(scout?.skill)||50)*.42+(Number(state.scoutingLevel)||1)*2,55,92);
}
export function createScoutingReport(state,playerId){
 initializeStaff(state);
 const player=[...state.players,...(state.minorLeague||[]),...(state.freeAgents||[])].find(p=>p.id===playerId);
 if(!player)throw new Error("找不到要評估的球員");
 const accuracy=scoutingAccuracy(state),radius=clamp(Math.round((100-accuracy)*.22),2,12);
 const ratings=Object.fromEntries(Object.entries(player.ratings||{}).map(([key,value])=>[key,{low:clamp(Math.round(Number(value)-radius),20,99),high:clamp(Math.round(Number(value)+radius),20,99)}]));
 const report={id:"scout-"+state.season+"-"+(state.matchday||0)+"-"+player.id+"-"+(state.scoutingReports.length+1),playerId:player.id,playerName:player.name,position:player.position,age:player.age,teamId:player.clubId||null,accuracy,ratings,createdSeason:state.season,createdMatchday:state.matchday||0,summary:accuracy>=82?"高可信度評估":accuracy>=68?"中等可信度評估":"初步觀察，仍有較大誤差"};
 state.scoutingReports.unshift(report);state.scoutingReports=state.scoutingReports.slice(0,30);
 return report;
}
export function recoverInjuries(state){
 initializeStaff(state);
 for(const [id,injury] of Object.entries(state.injuries||{})){
  if(injury.createdMatchday===state.matchday)continue;
  const clubId=injury.clubId||state.players.find(p=>p.id===id)?.clubId;
  const skill=Number(state.staffByClub[clubId]?.medical?.skill)||50;
  const recovery=skill>=85?2:1;
  injury.daysRemaining=Math.max(0,(Number(injury.daysRemaining)||0)-recovery);
  if(!injury.daysRemaining)delete state.injuries[id];
 }
 return state.injuries;
}
export function settleStaffPayroll(state){
 initializeStaff(state);
 const result={};
 for(const club of LEAGUE.clubs){
  const monthly=Object.values(state.staffByClub[club.id]||{}).reduce((sum,p)=>sum+(Number(p.monthlySalary)||0),0);
  result[club.id]=monthly;
  if(club.id===state.clubId)state.budget=(Number(state.budget)||0)-monthly;
  else if(state.aiClubFinances?.[club.id])state.aiClubFinances[club.id].budget-=monthly;
 }
 state.staffPayroll=result;
 return result;
}
export const STAFF_ROLES=ROLES;
export const STAFF_LABELS=LABELS;
