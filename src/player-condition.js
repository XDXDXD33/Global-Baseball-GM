const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function ensurePitcherStamina(player){
 if(!player)return 100;
 const value=Number(player.pitcherStamina);
 if(player.pitcherStamina==null||!Number.isFinite(value))player.pitcherStamina=100;
 else player.pitcherStamina=clamp(value,0,100);
 return player.pitcherStamina;
}
export function ensurePlayerCondition(player){
 if(!player)return 70;
 const value=Number(player.condition);
 if(player.condition==null||!Number.isFinite(value))player.condition=72;
 else player.condition=clamp(value,0,100);
 return player.condition;
}
export function conditionMultiplier(player){
 const condition=ensurePlayerCondition(player);
 return clamp(1+(condition-70)*0.0018,.82,1.054);
}
export function applyPlayerGameLoad(state,game){
 const appearances=new Map();
 for(const [id,s] of Object.entries(game.batterStats||{}))if((s.PA||0)>0)appearances.set(id,(appearances.get(id)||0)+Math.max(1,(s.PA||0)*1.15));
 for(const [id,s] of Object.entries(game.fieldingStats||{}))if(s.PO||s.A||s.E||s.DP)appearances.set(id,(appearances.get(id)||0)+.7);
 for(const [id,s] of Object.entries(game.pitcherStats||{}))if(s.pitches>0)appearances.set(id,(appearances.get(id)||0)+Math.max(2,s.pitches*.105)+(s.pitches>=80?3:0));
 for(const [id,load] of appearances){
  const p=state.players.find(x=>x.id===id);
  if(p){p.condition=clamp(ensurePlayerCondition(p)-load,0,100);if(p.position==="SP"||p.position==="RP"||p.position==="P"){const pitches=Number(game.pitcherStats?.[id]?.pitches)||0;p.pitcherStamina=clamp(ensurePitcherStamina(p)-pitches*.22,0,100);}}
 }
}
export function recoverPlayerConditions(state){
 for(const p of state.players||[]){
  const injured=Number(state.injuries?.[p.id]?.daysRemaining||0)>0;
  const recovery=injured?0.35:(p.position==="SP"?3.2:2.5);
  p.condition=clamp(ensurePlayerCondition(p)+recovery,0,100);if(p.position==="SP"||p.position==="RP"||p.position==="P"){const staminaRecovery=injured?1.5:p.position==="SP"?22:28;p.pitcherStamina=clamp(ensurePitcherStamina(p)+staminaRecovery,0,100);}
 }
}
export function conditionLabel(player){
 const value=ensurePlayerCondition(player);
 return value>=90?"狀態火熱":value>=75?"狀態良好":value>=55?"狀態普通":value>=35?"狀態低迷":"疲勞";
}
