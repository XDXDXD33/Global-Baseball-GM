const BEST_OF={semifinal:5,championship:7};
const winner=(s)=>s.wins>=Math.ceil(s.bestOf/2);
function makeSeries(id,round,homeSeed,awaySeed){
 return {id,round,homeSeed,awaySeed,homeTeamId:homeSeed.teamId,awayTeamId:awaySeed.teamId,bestOf:BEST_OF[round],wins:{[homeSeed.teamId]:0,[awaySeed.teamId]:0},games:[],winnerId:null};
}
export function createPostseasonState(standings,season){
 const seeds=standings.slice(0,3).map((x,i)=>({...x,seed:i+1}));
 if(seeds.length<3)throw new Error("季後賽至少需要三支球隊");
 return {season,status:"live",seeds,round:"semifinal",semifinal:makeSeries("semi","semifinal",seeds[1],seeds[2]),championship:null,championId:null};
}
export function getNextPostseasonFixture(state,matchday=121){
 if(!state||state.status!=="live")return null;
 const series=state.round==="semifinal"?state.semifinal:state.championship;
 if(!series||series.winnerId)return null;
 const n=series.games.length+1,high=series.homeTeamId,low=series.awayTeamId;
 const homeId=series.round==="semifinal"?(n<=2||n===5?high:low):(n<=2||n>=6?high:low);
 return {id:state.season+"-PO-"+series.id+"-"+n,season:state.season,matchday,phase:"postseason",round:series.round,gameNumber:n,bestOf:series.bestOf,homeId,awayId:homeId===high?low:high,status:"scheduled",homeScore:null,awayScore:null};
}
export function recordPostseasonResult(state,fixture,result){
 if(!state||state.status!=="live")throw new Error("季後賽目前沒有進行中的系列賽");
 const series=state.round==="semifinal"?state.semifinal:state.championship;
 if(!series||fixture.round!==series.round||fixture.id!==state.season+"-PO-"+series.id+"-"+(series.games.length+1))throw new Error("季後賽場次順序不正確");
 const winnerId=result.winnerId;
 if(!winnerId||![series.homeTeamId,series.awayTeamId].includes(winnerId))throw new Error("季後賽必須產生勝隊");
 series.wins[winnerId]++;series.games.push({fixture:{...fixture},homeScore:result.homeScore,awayScore:result.awayScore,winnerId});
 if(winner(series)){
  series.winnerId=winnerId;
  if(state.round==="semifinal"){
   const first=state.seeds[0],challenger=state.seeds.find(x=>x.teamId===winnerId);
   state.championship=makeSeries("final","championship",first,challenger);state.round="championship";
  }else{state.championId=winnerId;state.status="complete";}
 }
 return state;
}
export function simulatePostseasonGame(state,fixture,game){
 if(game.status!=="final")throw new Error("比賽尚未結束");
 return recordPostseasonResult(state,fixture,game.result);
}
