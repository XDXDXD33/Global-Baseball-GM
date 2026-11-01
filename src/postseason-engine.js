const BEST_OF={tiebreaker:1,semifinal:5,championship:7};
const winsNeeded=series=>Math.ceil(series.bestOf/2);
const seriesWon=series=>series.wins[series.homeTeamId]>=winsNeeded(series)||series.wins[series.awayTeamId]>=winsNeeded(series);
function makeSeries(id,round,homeSeed,awaySeed,{homeWins=0,awayWins=0}={}){
 return {id,round,homeSeed,awaySeed,homeTeamId:homeSeed.teamId,awayTeamId:awaySeed.teamId,bestOf:BEST_OF[round],wins:{[homeSeed.teamId]:homeWins,[awaySeed.teamId]:awayWins},games:[],winnerId:null};
}
function headToHead(schedule,a,b){
 const games=(schedule||[]).filter(g=>g.status==="final"&&[g.homeId,g.awayId].includes(a)&&[g.homeId,g.awayId].includes(b));
 let aWins=0,bWins=0;
 for(const g of games){if(g.homeScore===g.awayScore)continue;const winnerId=g.homeScore>g.awayScore?g.homeId:g.awayId;if(winnerId===a)aWins++;else if(winnerId===b)bWins++;}
 return {aWins,bWins};
}
function startDifferentHalfSemifinal(state){
 const homeSeed=state.lowHalfChampion;
 state.semifinal=makeSeries("semi","semifinal",homeSeed,state.wildcard,{homeWins:1});
 state.round="semifinal";
}
export function createPostseasonState({firstHalf,secondHalf,overall,schedule=[]},season){
 if(!firstHalf?.length||!secondHalf?.length||!overall?.length)throw new Error("需要完整的上下半季與全年戰績才能建立季後賽");
 const first=firstHalf[0],second=secondHalf[0],sameChampion=first.teamId===second.teamId;
 if(!sameChampion){
  const wildcard=overall.find(x=>x.teamId!==first.teamId&&x.teamId!==second.teamId);
  if(!wildcard)throw new Error("找不到外卡球隊");
  const state={season,status:"live",format:"different-half-champions",firstHalfChampion:first.teamId,secondHalfChampion:second.teamId,wildcard,round:null,semifinal:null,championship:null,championId:null};
  if(Math.abs(Number(first.winPct)-Number(second.winPct))<1e-9){
   const h2h=headToHead(schedule,first.teamId,second.teamId);
   const firstHome=h2h.aWins>=h2h.bWins;
   const home=firstHome?first:second,away=firstHome?second:first;
   state.round="tiebreaker";state.tieBreaker=makeSeries("tie","tiebreaker",home,away);
  }else{
   const [high,low]=[first,second].sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins);
   state.topSeed=high;state.lowHalfChampion=low;startDifferentHalfSemifinal(state);
  }
  return state;
 }
 const top=overall[0],secondSeed=overall[1],thirdSeed=overall[2];
 if(!thirdSeed)throw new Error("季後賽至少需要三支球隊");
 return {season,status:"live",format:"same-half-champion",firstHalfChampion:first.teamId,secondHalfChampion:second.teamId,topSeed:top,round:"semifinal",semifinal:makeSeries("semi","semifinal",secondSeed,thirdSeed),championship:null,championId:null};
}
export function getNextPostseasonFixture(state,matchday=121){
 if(!state||state.status!=="live")return null;
 const series=state.round==="tiebreaker"?state.tieBreaker:state.round==="semifinal"?state.semifinal:state.championship;
 if(!series||series.winnerId)return null;
 const n=series.games.length+1,home=series.homeTeamId,away=series.awayTeamId;
 let homeId;
 if(series.round==="tiebreaker")homeId=home;
 else if(series.round==="semifinal"){
  if(state.format==="different-half-champions")homeId=[1,3,4,5].includes(n)?home:away;
  else homeId=[1,2,5].includes(n)?home:away;
 }else homeId=[1,2,5,6,7].includes(n)?home:away;
 return {id:state.season+"-PO-"+series.id+"-"+n,season:state.season,matchday,phase:"postseason",round:series.round,gameNumber:n,bestOf:series.bestOf,homeId,awayId:homeId===home?away:home,status:"scheduled",homeScore:null,awayScore:null};
}
export function recordPostseasonResult(state,fixture,result){
 if(!state||state.status!=="live")throw new Error("季後賽目前沒有進行中的系列賽");
 const series=state.round==="tiebreaker"?state.tieBreaker:state.round==="semifinal"?state.semifinal:state.championship;
 if(!series||fixture.round!==series.round||fixture.id!==state.season+"-PO-"+series.id+"-"+(series.games.length+1))throw new Error("季後賽場次順序不正確");
 const winnerId=result.winnerId;
 if(!winnerId||![series.homeTeamId,series.awayTeamId].includes(winnerId))throw new Error("季後賽必須產生勝隊");
 series.wins[winnerId]++;series.games.push({fixture:{...fixture},homeScore:result.homeScore,awayScore:result.awayScore,winnerId});
 if(seriesWon(series)){
  series.winnerId=winnerId;
  if(state.round==="tiebreaker"){
   state.topSeed=winnerId===series.homeTeamId?series.homeSeed:series.awaySeed;
   state.lowHalfChampion=winnerId===series.homeTeamId?series.awaySeed:series.homeSeed;
   startDifferentHalfSemifinal(state);
  }else if(state.round==="semifinal"){
   const challenger=series.winnerId===series.homeTeamId?series.homeSeed:series.awaySeed;
   const initialHomeWins=state.format==="same-half-champion"?1:0;
   state.championship=makeSeries("final","championship",state.topSeed,challenger,{homeWins:initialHomeWins});state.round="championship";
  }else{state.championId=winnerId;state.status="complete";}
 }
 return state;
}
export function simulatePostseasonGame(state,fixture,game){
 if(game.status!=="final")throw new Error("比賽尚未結束");
 return recordPostseasonResult(state,fixture,game.result);
}
