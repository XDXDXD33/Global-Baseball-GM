import { LEAGUE } from "./data.js";
import { createGame,advancePitch,advancePlateAppearance,simulateGame,changePitcher,substituteBatter,applyGameResult,calculateStandings,gameSituation,setGameCommand,attemptStealBase,executeSacrificeBunt,issueIntentionalWalk } from "./game-engine.js";
import { estimatePlayerSalary } from "./rules.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const club=id=>LEAGUE.clubs.find(c=>c.id===id);
const money=n=>"$"+Math.round(n).toLocaleString();
function fixtureForToday(state){return state.schedule.find(g=>g.matchday===state.matchday&&(g.homeId===state.clubId||g.awayId===state.clubId));}
function scoreTable(game){
 const home=game.fixture.homeId,away=game.fixture.awayId,max=Math.max(game.inning,9);
 const cell=(id,i)=>game.lineScore[id]?.[i]??"—";
 return `<div class="table-wrap"><table class="score-table"><thead><tr><th>球隊</th>${Array.from({length:max},(_,i)=>`<th>${i+1}</th>`).join("")}<th>R</th></tr></thead><tbody><tr><th>${esc(club(away)?.short||away)}</th>${Array.from({length:max},(_,i)=>`<td>${cell(away,i)}</td>`).join("")}<td><b>${game.score[away]}</b></td></tr><tr><th>${esc(club(home)?.short||home)}</th>${Array.from({length:max},(_,i)=>`<td>${cell(home,i)}</td>`).join("")}<td><b>${game.score[home]}</b></td></tr></tbody></table></div>`;
}
function boxScoreHtml(game){
 const batters=Object.entries(game.batterStats).map(([id,x])=>({name:game.players[id]?.name||id,...x})).filter(x=>x.PA>0).sort((a,b)=>b.AB-a.AB);
 const pitchers=Object.entries(game.pitcherStats).map(([id,x])=>({name:game.players[id]?.name||id,...x})).filter(x=>x.pitches>0);
 return `<div class="boxscore-grid"><div><h4>打者成績</h4><div class="table-wrap"><table><thead><tr><th>球員</th><th>PA</th><th>AB</th><th>H</th><th>HR</th><th>RBI</th><th>BB</th><th>K</th></tr></thead><tbody>${batters.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.PA}</td><td>${p.AB}</td><td>${p.H}</td><td>${p.HR}</td><td>${p.RBI}</td><td>${p.BB}</td><td>${p.K}</td></tr>`).join("")}</tbody></table></div></div><div><h4>投手成績</h4><div class="table-wrap"><table><thead><tr><th>投手</th><th>IP</th><th>H</th><th>ER</th><th>BB</th><th>K</th><th>P</th></tr></thead><tbody>${pitchers.map(p=>`<tr><td>${esc(p.name)}</td><td>${Math.floor(p.outs/3)}.${p.outs%3}</td><td>${p.H}</td><td>${p.ER}</td><td>${p.BB}</td><td>${p.K}</td><td>${p.pitches}</td></tr>`).join("")}</tbody></table></div></div></div>`;
}
function currentPitcherOptions(game,state){
 const teamId=game.fixture.homeId===state.clubId?game.fixture.homeId:game.fixture.awayId;
 return state.players.filter(p=>p.clubId===teamId&&["SP","RP","P"].includes(p.position)&&p.id!==game.pitcherId[teamId]&&!(game.usedPitchers[teamId]||[]).includes(p.id));
}
export function renderGamePage(state){
 const fixture=fixtureForToday(state),standings=calculateStandings(state.schedule),completed=state.schedule.filter(g=>g.status==="final").length;
 if(state.currentGame){
  const g=state.currentGame,s=gameSituation(g),userAtBat=g.half==="top"?g.fixture.awayId===state.clubId:g.fixture.homeId===state.clubId;
  const pitcherTeam=g.half==="top"?g.fixture.homeId:g.fixture.awayId,pitchingForUser=pitcherTeam===state.clubId,pitcherOptions=currentPitcherOptions(g,state);
  const used=new Set(g.lineups[state.clubId]),bench=state.players.filter(p=>p.clubId===state.clubId&&!["SP","RP","P"].includes(p.position)&&!used.has(p.id));
  const activeBatter=g.players[g.lineups[state.clubId][g.battingIndex[state.clubId]%g.lineups[state.clubId].length]];
  return `<section class="panel game-score-panel"><div class="game-status">第 ${g.inning} 局 · ${g.half==="top"?"上半局":"下半局"} · ${g.status==="final"?"比賽結束":"LIVE"}</div><div class="game-score"><div><small>${esc(club(g.fixture.awayId).name)}</small><strong>${g.score[g.fixture.awayId]}</strong></div><span>:</span><div><small>${esc(club(g.fixture.homeId).name)}</small><strong>${g.score[g.fixture.homeId]}</strong></div></div>${scoreTable(g)}<div class="diamond-row"><span class="diamond-base ${s.bases[1]?"occupied":""}">二</span><span class="diamond-base ${s.bases[2]?"occupied":""}">三</span><span class="diamond-base ${s.bases[0]?"occupied":""}">一</span><span class="outs-label">出局數：${s.outs}</span></div><div class="game-matchup"><div><small>打者</small><b>${esc(s.batter)}</b></div><div><small>投手</small><b>${esc(s.pitcher)}</b></div><div><small>球數</small><b>${s.balls} - ${s.strikes}</b></div><div><small>總投球數</small><b>${g.pitchCount}</b></div></div></section>
  <section class="panel"><h3>比賽操作</h3>${g.status==="live"?`<div class="game-actions"><button id="pitch-one" class="button button-primary">投下一球</button><button id="finish-pa" class="button button-quiet">完成這個打席</button><button id="quick-game" class="button button-quiet">快速模擬至比賽結束</button></div>
  <div class="in-game-controls">
   ${userAtBat?'<label>打者策略<select id="batting-approach"><option value="balanced" '+((g.commands?.[state.clubId]?.battingApproach||"balanced")==="balanced"?"selected":"")+' >平衡打擊</option><option value="contact" '+(g.commands?.[state.clubId]?.battingApproach==="contact"?"selected":"")+' >確實擊球</option><option value="power" '+(g.commands?.[state.clubId]?.battingApproach==="power"?"selected":"")+' >長打攻擊</option><option value="patient" '+(g.commands?.[state.clubId]?.battingApproach==="patient"?"selected":"")+' >選球等待</option></select></label>':""}
   ${pitchingForUser?'<label>投球球種<select id="pitch-type"><option value="fastball" '+((g.commands?.[state.clubId]?.pitchType||"fastball")==="fastball"?"selected":"")+' >快速球 · 球速取向</option><option value="slider" '+(g.commands?.[state.clubId]?.pitchType==="slider"?"selected":"")+' >滑球 · 橫向位移</option><option value="curve" '+(g.commands?.[state.clubId]?.pitchType==="curve"?"selected":"")+' >曲球 · 垂直位移</option><option value="changeup" '+(g.commands?.[state.clubId]?.pitchType==="changeup"?"selected":"")+' >變速球 · 速度差</option></select></label>':""}
   ${userAtBat&&!g.currentPA&&g.outs<2&&(g.bases[0]||g.bases[1])?'<button id="bunt-action" class="button button-quiet">下達犧牲觸擊</button>':""}
   ${userAtBat&&g.bases[0]&&!g.bases[1]&&g.outs<2?'<button id="steal-action" class="button button-quiet">嘗試盜二壘</button>':""}
   ${pitchingForUser&&!g.currentPA?'<button id="intentional-walk" class="button button-quiet">故意四壞</button>':""}
  </div><p class="field-help">打者策略會改變擊球品質與選球傾向；投球球種會改變控球與位移。短打、盜壘及故意四壞會立即執行並記錄在比賽紀錄中。</p>
  <div class="game-substitutions">${pitchingForUser?`<label>更換投手<select id="change-pitcher"><option value="">選擇牛棚投手</option>${pitcherOptions.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.position}</option>`).join("")}</select></label><button id="apply-pitcher" class="button button-quiet">確認換投</button>`:""}${userAtBat&&!g.currentPA? `<label>代打球員<select id="pinch-hitter"><option value="">選擇替補野手</option>${bench.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.position}</option>`).join("")}</select></label><button id="apply-pinch" class="button button-quiet">確認代打</button>`:""}</div>`:`<div class="game-final"><h3>終場比數</h3><p>${g.result.awayScore} : ${g.result.homeScore} · ${g.result.reason}</p><button id="finish-matchday" class="button button-primary">結束比賽日，進入下一日 →</button></div>`}</section>${g.status==="final"?`<section class="panel"><h3>本場完整 Box Score</h3>${boxScoreHtml(g)}</section>`:""}
  <section class="panel"><h3>即時比賽紀錄</h3><div class="play-log">${g.log.slice(-18).reverse().map(x=>`<div><small>${x.inning}局${x.half==="top"?"上":"下"} · ${x.outs}出局</small><span>${esc(x.text)}</span></div>`).join("")}</div></section>`;
 }
 return `<section class="panel"><div class="panel-heading-row"><div><h3>球季賽程 · 第 ${state.matchday} / 120 個比賽日</h3><p class="field-help">${state.season} 球季 · 第 ${Math.min(12,Math.floor((state.matchday-1)/10)+1)} 月 · 已完成 ${completed} / 360 場比賽</p></div><span class="tag real">每隊 120 場</span></div>${fixture?`<div class="next-game"><div class="next-game-date">MATCHDAY ${state.matchday}</div><div><small>${esc(club(fixture.awayId).name)}（客）</small><strong>VS</strong><small>${esc(club(fixture.homeId).name)}（主）</small></div><p>你將以${fixture.homeId===state.clubId?"主場":"客場"}身份迎戰對手。</p><button id="start-game" class="button button-primary">開始比賽</button><button id="simulate-game" class="button button-quiet">直接模擬整場</button></div>`:'<p class="empty-state">本球季賽程已完成。</p>'}</section>
 <section class="panel"><h3>聯盟戰績</h3><div class="table-wrap"><table><thead><tr><th>排名</th><th>球隊</th><th>場次</th><th>勝</th><th>敗</th><th>和</th><th>勝率</th></tr></thead><tbody>${standings.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(club(x.teamId).name)} ${x.teamId===state.clubId?'<span class="tag real">我的球隊</span>':""}</td><td>${x.games}</td><td>${x.wins}</td><td>${x.losses}</td><td>${x.ties}</td><td>${x.winPct.toFixed(3)}</td></tr>`).join("")}</tbody></table></div></section>
 <section class="panel"><h3>最近賽果</h3><div class="table-wrap"><table><thead><tr><th>比賽日</th><th>客隊</th><th>比數</th><th>主隊</th></tr></thead><tbody>${state.schedule.filter(g=>g.status==="final"&&(g.homeId===state.clubId||g.awayId===state.clubId)).slice(-8).reverse().map(g=>`<tr><td>${g.matchday}</td><td>${esc(club(g.awayId).short)}</td><td>${g.awayScore} : ${g.homeScore}</td><td>${esc(club(g.homeId).short)}</td></tr>`).join("")||'<tr><td colspan="4">尚無比賽紀錄</td></tr>'}</tbody></table></div></section>${state.gameArchive?.length?`<section class="panel"><h3>最近一場完整比賽紀錄</h3><p class="field-help">${esc(club(state.gameArchive.at(-1).fixture.awayId).name)} ${state.gameArchive.at(-1).fixture.awayScore} : ${state.gameArchive.at(-1).fixture.homeScore} ${esc(club(state.gameArchive.at(-1).fixture.homeId).name)}</p><div class="table-wrap"><table><thead><tr><th>球員</th><th>PA</th><th>AB</th><th>H</th><th>HR</th><th>RBI</th></tr></thead><tbody>${Object.entries(state.gameArchive.at(-1).batters).filter(([,x])=>x.PA>0).slice(0,18).map(([id,x])=>`<tr><td>${esc(state.players.find(p=>p.id===id)?.name||id)}</td><td>${x.PA}</td><td>${x.AB}</td><td>${x.H}</td><td>${x.HR}</td><td>${x.RBI}</td></tr>`).join("")}</tbody></table></div></section>`:""}`;
}
function recordStats(state,game){
 for(const [id,stats] of Object.entries(game.batterStats)){const target=state.seasonStats.batters[id]||(state.seasonStats.batters[id]={PA:0,AB:0,H:0,HR:0,RBI:0,BB:0,K:0,R:0});for(const k of Object.keys(target))target[k]+=(stats[k]||0);}
 for(const [id,stats] of Object.entries(game.pitcherStats)){const target=state.seasonStats.pitchers[id]||(state.seasonStats.pitchers[id]={outs:0,ER:0,H:0,BB:0,K:0,pitches:0});for(const k of Object.keys(target))target[k]+=(stats[k]||0);}
}
function settleEconomy(state,fixture,game){
 if(fixture.homeId===state.clubId){
  const wins=state.wins,losses=state.losses,winPct=(wins+losses)?wins/(wins+losses):.5;
  const attendance=Math.min(19000,Math.round(state.fanbase*(.62+winPct*.38)*(state.ticketPrice>500?.82:1)));
  const gate=attendance*state.ticketPrice;
  state.budget+=Math.round(gate*.48);
  state.lastAttendance=attendance;state.lastGateRevenue=Math.round(gate*.48);
  state.fanbase=Math.max(1000,Math.round(state.fanbase*(game.result.winnerId===state.clubId?1.004:.998)));
 }
}
function finishMonth(state){
 const roster=state.players.filter(p=>p.clubId===state.clubId),payroll=roster.reduce((n,p)=>n+(state.contracts?.[p.id]?.salary||estimatePlayerSalary(p)),0);
 const sponsor=3500000+(state.fanbase*30);
 const maintenance=1800000+(state.trainingLevel||1)*250000+(state.scoutingLevel||1)*180000;
 state.budget+=sponsor-Math.round(payroll/12)-maintenance;
 state.monthlyFinance={sponsor,monthlyPayroll:Math.round(payroll/12),maintenance,net:sponsor-Math.round(payroll/12)-maintenance};
}
export function bindGamePage(state,persist,render){
 const start=()=>{
  const fixture=fixtureForToday(state);if(!fixture)return;
  state.currentGame=createGame({fixture,players:state.players,lineups:state.lineups,seed:fixture.id.split("").reduce((n,c)=>n+c.charCodeAt(0),state.season),tactics:state.tactics,userTeamId:state.clubId});
  persist();render();
 };
 document.querySelector("#start-game")?.addEventListener("click",start);
 document.querySelector("#simulate-game")?.addEventListener("click",()=>{start();if(state.currentGame){simulateGame(state.currentGame);persist();render();}});
 document.querySelector("#pitch-one")?.addEventListener("click",()=>{advancePitch(state.currentGame);persist();render();});
 document.querySelector("#batting-approach")?.addEventListener("change",e=>{try{setGameCommand(state.currentGame,state.clubId,{battingApproach:e.target.value});persist();render();}catch(err){alert(err.message);}});
 document.querySelector("#pitch-type")?.addEventListener("change",e=>{try{setGameCommand(state.currentGame,state.clubId,{pitchType:e.target.value});persist();render();}catch(err){alert(err.message);}});
 document.querySelector("#bunt-action")?.addEventListener("click",()=>{try{executeSacrificeBunt(state.currentGame,state.clubId);persist();render();}catch(err){alert(err.message);}});
 document.querySelector("#steal-action")?.addEventListener("click",()=>{try{attemptStealBase(state.currentGame,state.clubId);persist();render();}catch(err){alert(err.message);}});
 document.querySelector("#intentional-walk")?.addEventListener("click",()=>{try{issueIntentionalWalk(state.currentGame,state.clubId);persist();render();}catch(err){alert(err.message);}});
 document.querySelector("#finish-pa")?.addEventListener("click",()=>{advancePlateAppearance(state.currentGame);persist();render();});
 document.querySelector("#quick-game")?.addEventListener("click",()=>{simulateGame(state.currentGame);persist();render();});
 document.querySelector("#apply-pitcher")?.addEventListener("click",()=>{const id=document.querySelector("#change-pitcher")?.value;if(!id)return;try{const team=state.currentGame.fixture.homeId===state.clubId?state.clubId:state.clubId;changePitcher(state.currentGame,team,id);persist();render();}catch(e){alert(e.message);}});
 document.querySelector("#apply-pinch")?.addEventListener("click",()=>{const id=document.querySelector("#pinch-hitter")?.value,g=state.currentGame;if(!id||!g)return;try{const team=state.clubId,batter=g.players[g.lineups[team][g.battingIndex[team]%g.lineups[team].length]];substituteBatter(g,team,batter.id,id);persist();render();}catch(e){alert(e.message);}});
 document.querySelector("#finish-matchday")?.addEventListener("click",()=>{
  const userFixture=state.schedule.find(x=>x.id===state.currentGame.id),game=state.currentGame;
  const userResult=applyGameResult(userFixture,game);const archive={fixture:{...userResult},batters:game.batterStats,pitchers:game.pitcherStats,lineScore:game.lineScore,log:game.log.slice(-100)};delete userResult.boxScore;state.schedule=state.schedule.map(x=>x.id===userFixture.id?userResult:x);recordStats(state,game);settleEconomy(state,userFixture,game);state.gameArchive.push(archive);if(state.gameArchive.length>30)state.gameArchive.shift();
  const today=state.schedule.filter(x=>x.matchday===state.matchday&&x.status==="scheduled");
  for(const fixture of today){const ai=createGame({fixture,players:state.players,lineups:state.lineups,seed:fixture.id.split("").reduce((n,c)=>n+c.charCodeAt(0),state.season),tactics:state.tactics});simulateGame(ai);const result=applyGameResult(fixture,ai);delete result.boxScore;state.schedule=state.schedule.map(x=>x.id===fixture.id?result:x);recordStats(state,ai);settleEconomy(state,fixture,ai);}
  state.currentGame=null;state.matchday++;
  if((state.matchday-1)%10===0)finishMonth(state);
  if(state.matchday>120){state.season++;state.matchday=1;state.schedule=createLeagueSchedule(state.season);state.seasonStats={batters:{},pitchers:{}};state.gameArchive=[];state.players=state.players.map(p=>({...p,age:p.age+1}));}
  state.wins=state.schedule.filter(g=>g.status==="final"&&g.winnerId===state.clubId).length;
  state.losses=state.schedule.filter(g=>g.status==="final"&&g.winnerId&&g.winnerId!==state.clubId&&(g.homeId===state.clubId||g.awayId===state.clubId)).length;
  persist();render();
 });
}
function awaitSchedule(state){return createScheduleForSeason(state.season);}
function createScheduleForSeason(season){return importSchedule(season);}
function importSchedule(season){
 const teams=LEAGUE.clubs.map(c=>c.id),ring=[...teams],rounds=[];
 for(let r=0;r<5;r++){const games=[];for(let i=0;i<3;i++)games.push([ring[i],ring[5-i]]);rounds.push(games);ring.splice(1,0,ring.pop());}
 const schedule=[];for(let cycle=0;cycle<24;cycle++)for(let r=0;r<5;r++){const matchday=cycle*5+r+1;for(const [a,b] of rounds[r]){const flip=cycle%2===1,homeId=flip?b:a,awayId=flip?a:b;schedule.push({id:season+"-"+matchday+"-"+homeId+"-"+awayId,season,matchday,month:Math.floor((matchday-1)/10)+1,homeId,awayId,status:"scheduled",homeScore:null,awayScore:null});}}
 return schedule;
}
