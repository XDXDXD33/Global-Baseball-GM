const BEST_OF={semifinal:5,championship:7};
const winsNeeded=series=>Math.ceil(series.bestOf/2);
const seriesWon=series=>series.wins[series.homeTeamId]>=winsNeeded(series)||series.wins[series.awayTeamId]>=winsNeeded(series);
function makeSeries(id,round,homeSeed,awaySeed,{homeWins=0,awayWins=0}={}){
 return {id,round,homeSeed,awaySeed,homeTeamId:homeSeed.teamId,awayTeamId:awaySeed.teamId,bestOf:BEST_OF[round],wins:{[homeSeed.teamId]:homeWins,[awaySeed.teamId]:awayWins},games:[],winnerId:null};
}
export function createPostseasonState({firstHalf,secondHalf,overall},season){
 if(!firstHalf?.length||!secondHalf?.length||!overall?.length)throw new Error("需要完整的上下半季與全年戰績才能建立季後賽");
 const first=firstHalf[0],second=secondHalf[0],sameChampion=first.teamId===second.teamId;
 if(!sameChampion){
  const champs=[first,second].sort((a,b)=>b.winPct-a.winPct||b.wins-a.wins);
  const high=champs[0],low=champs[1],wildcard=overall.find(x=>x.teamId!==first.teamId&&x.teamId!==second.teamId);
  if(!wildcard)throw new Error("找不到外卡球隊");
  return {season,status:"live",format:"different-half-champions",firstHalfChampion:first.teamId,secondHalfChampion:second.teamId,topSeed:high,lowHalfChampion:low,wildcard,round:"semifinal",semifinal:makeSeries("semi","semifinal",low,wildcard,{homeWins:1}),championship:null,championId:null};
 }
 const top=overall[0],secondSeed=overall[1],thirdSeed=overall[2];
 if(!thirdSeed)throw new Error("季後賽至少需要三支球隊");
 return {season,status:"live",format:"same-half-champion",firstHalfChampion:first.teamId,secondHalfChampion:second.teamId,topSeed:top,round:"semifinal",semifinal:makeSeries("semi","semifinal",secondSeed,thirdSeed),championship:null,championId:null};
}
export function getNextPostseasonFixture(state,matchday=121){
 if(!state||state.status!=="live")return null;
 const series=state.round==="semifinal"?state.semifinal:state.championship;
 if(!series||series.winnerId)return null;
 const n=series.games.length+1,home=series.homeTeamId,away=series.awayTeamId;
 let homeId;
 if(series.round==="semifinal"){
  if(state.format==="different-half-champions")homeId=[1,3,4,5].includes(n)?home:away;
  else homeId=[1,2,5].includes(n)?home:away;
 }else homeId=[1,2,5,6,7].includes(n)?home:away;
 return {id:state.season+"-PO-"+series.id+"-"+n,season:state.season,matchday,phase:"postseason",round:series.round,gameNumber:n,bestOf:series.bestOf,homeId,awayId:homeId===home?away:home,status:"scheduled",homeScore:null,awayScore:null};
}
export function recordPostseasonResult(state,fixture,result){
 if(!state||state.status!=="live")throw new Error("季後賽目前沒有進行中的系列賽");
 const series=state.round==="semifinal"?state.semifinal:state.championship;
 if(!series||fixture.round!==series.round||fixture.id!==state.season+"-PO-"+series.id+"-"+(series.games.length+1))throw new Error("季後賽場次順序不正確");
 const winnerId=result.winnerId;
 if(!winnerId||![series.homeTeamId,series.awayTeamId].includes(winnerId))throw new Error("季後賽必須產生勝隊");
 series.wins[winnerId]++;series.games.push({fixture:{...fixture},homeScore:result.homeScore,awayScore:result.awayScore,winnerId});
 if(seriesWon(series)){
  series.winnerId=winnerId;
  if(state.round==="semifinal"){
   const challenger=series.winnerId===state.semifinal.homeTeamId?state.semifinal.homeSeed:state.semifinal.awaySeed;
   const homeSeed=state.topSeed;
   const initialHomeWins=state.format==="same-half-champion"?1:0;
   state.championship=makeSeries("final","championship",homeSeed,challenger,{homeWins:initialHomeWins});state.round="championship";
  }else{state.championId=winnerId;state.status="complete";}
 }
 return state;
}
export function simulatePostseasonGame(state,fixture,game){
 if(game.status!=="final")throw new Error("比賽尚未結束");
 return recordPostseasonResult(state,fixture,game.result);
}
