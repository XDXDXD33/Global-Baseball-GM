import { getCoachBonus } from "./staff-engine.js";
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function developPlayers(state){
 const focus=state.trainingFocus||"balanced";
 state.players=(state.players||[]).map(p=>{
  const ratings={...(p.ratings||{})},pitcher=["SP","RP","P"].includes(p.position);
  const available=pitcher?["velocity","control","movement","stamina","fielding"]:["contact","power","eye","speed","fielding","range"];
  const keys=focus==="balanced"?(pitcher?["control","movement"]:["contact","eye"]):available.includes(focus)?[focus]:(pitcher?["control","movement"]:["contact","eye"]);
  if(!keys.some(k=>Number.isFinite(Number(ratings[k]))))return p;
  let seed=0;for(const ch of String(p.id)+state.season+"-"+state.month)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const age=Number(p.age)||27,ageRate=age<=22?.42:age<=25?.3:age<=28?.18:age<=31?.08:age<=34?-.025:-.07;
  const facility=p.clubId===state.clubId?1+Math.max(0,(state.trainingLevel||1)-1)*.1:.82;
  for(const key of keys){
   if(!Number.isFinite(Number(ratings[key])))continue;
   const delta=ageRate*facility*(.7+random()*.6)+getCoachBonus(state,p,key);
   ratings[key]=clamp(Math.round((Number(ratings[key])+delta)*10)/10,20,99);
  }
  return {...p,ratings};
 });
 return state.players;
}
