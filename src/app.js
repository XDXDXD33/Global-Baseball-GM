import { LEAGUE, DEMO_PLAYERS, RATING_LABELS } from "./data.js";
import { validateForeignLimit, estimatePlayerAbility, estimatePlayerSalary, calculateRatingConfidence } from "./rules.js";
import { bindRosterTools } from "./player-tools.js";
import { renderRosterPage } from "./roster-ui.js";
import { renderHistoryPage, bindHistoryPage } from "./history-ui.js";
import { renderStarMarket, bindStarMarket } from "./star-market.js";
import { createInitialLeagueRoster, buildDefaultLineup, createLeagueSchedule, createFreeAgentPool, calculateStandings } from "./game-engine.js";
import { renderLineupPage, bindLineupPage, renderOperationsPage, bindOperationsPage } from "./management-ui.js";
import { renderGamePage, bindGamePage } from "./game-ui.js";
import { initializeContracts } from "./contract-engine.js";
import { initializeAIClubFinances,runAIClubManagement } from "./ai-management.js";
import { initializeStaff } from "./staff-engine.js";
import { importCompleteHistoricalDatabase, createHistoricalSeasonRoster, buildHistoricalForeignMarket } from "./season-roster.js";

const $ = (s) => document.querySelector(s);
const STORAGE_KEY = "global-baseball-gm-save-v1";
const HISTORY_DB = "global-baseball-gm-history-v1";
const emptyHistory = () => ({players:{},batting:[],pitching:[],fielding:[],standings:[],importedFiles:[]});
function historyDb(){return new Promise((resolve,reject)=>{if(!("indexedDB" in window)){reject(new Error("瀏覽器不支援 IndexedDB"));return;}const req=indexedDB.open(HISTORY_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("records"))req.result.createObjectStore("records");};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function saveHistoryDB(data){const db=await historyDb();await new Promise((resolve,reject)=>{const tx=db.transaction("records","readwrite");tx.objectStore("records").put(data,"history");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}
async function readHistoryDB(){try{const db=await historyDb();const value=await new Promise((resolve,reject)=>{const req=db.transaction("records","readonly").objectStore("records").get("history");req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});db.close();return value||emptyHistory();}catch(e){console.warn("Historical database could not be loaded",e);return emptyHistory();}}
let state = null;
let page = "dashboard";
let starSeason = 2026;
let saveStatus = "";

function club(id){ return LEAGUE.clubs.find(c=>c.id===id); }
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function load(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return false;
  const parsed=JSON.parse(raw);
  if(!parsed||!Array.isArray(parsed.players)||!parsed.clubId||!club(parsed.clubId))throw new Error("存檔格式不完整或球隊資料無效");
  state=parsed;state.history=emptyHistory();
  // Backward-compatible defaults for saves created by earlier builds.
  state.season=Number.isFinite(Number(state.season))?Number(state.season):2026;
  state.month=Number.isFinite(Number(state.month))?Number(state.month):1;
  state.manager=String(state.manager||"未命名球團");
  state.budget=Number.isFinite(Number(state.budget))?Number(state.budget):120000000;
  state.fanbase=Number.isFinite(Number(state.fanbase))?Number(state.fanbase):8500;
  state.foreignLimit=validateForeignLimit(state.foreignLimit??4);
  state.wins=Number.isFinite(Number(state.wins))?Number(state.wins):0;
  state.losses=Number.isFinite(Number(state.losses))?Number(state.losses):0;
  if(!Array.isArray(state.players))throw new Error("球員名單格式錯誤");
  if(!Array.isArray(state.schedule))state.schedule=createLeagueSchedule(state.season);
  if(!state.lineups||typeof state.lineups!=="object")state.lineups=Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(state.players,c.id)]));
  if(!state.schedule||!state.lineups){
   const custom=(state.players||[]).filter(p=>!String(p.id).startsWith("demo-"));
   state.players=[...createInitialLeagueRoster(state.season||2026),...custom];
   state.lineups=Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(state.players,c.id)]));
   state.schedule=createLeagueSchedule(state.season||2026);state.matchday=1;state.currentGame=null;
   state.freeAgents=createFreeAgentPool(state.season||2026);state.tactics={};state.contracts={};state.seasonStats={batters:{},pitchers:{}};state.gameArchive=[];
   state.ticketPrice=350;state.trainingLevel=1;state.scoutingLevel=1;
  }
  state.freeAgents??=createFreeAgentPool(state.season);if(!state.contracts||!Object.keys(state.contracts).length)state.contracts=initializeContracts(state.players,state.season);for(const p of state.players){const c=state.contracts[p.id];if(c&&c.yearsRemaining==null){c.yearsRemaining=Number(c.years)||1;c.expirySeason=state.season+c.yearsRemaining-1;c.status="active";}}state.injuries??={};state.retiredPlayers??=[];state.minorLeague??=[];if(state.currentGame){state.currentGame.injuries??=[];state.currentGame.automaticRunnerIds??=[];state.currentGame.fieldingStats??={};state.currentGame.unavailable??={};state.currentGame.substitutedOut??=[];state.currentGame.commands??={};}state.phase??="regular";state.tradeHistory??=[];state.pitcherWorkload??={};state.trainingFocus??="balanced";state.tactics??={};state.contracts??={};state.seasonStats??={batters:{},pitchers:{}};state.gameArchive??=[];state.ticketPrice??=350;state.trainingLevel??=1;state.scoutingLevel??=1;state.matchday??=1;state.aiClubReports??=[];state.aiTradeProposals??=[];initializeStaff(state);if(!state.aiClubFinances){initializeAIClubFinances(state);initializeStaff(state);runAIClubManagement(state,{phase:"preseason"});}
  saveStatus="存檔讀取成功";return true;
 }catch(e){console.warn("Save data could not be read",e);state=null;saveStatus="存檔無法讀取："+e.message;return false;}
}
function persist(){if(!state)return Promise.resolve();const save={...state};delete save.history;localStorage.setItem(STORAGE_KEY,JSON.stringify(save));const saved=state.history?saveHistoryDB(state.history):Promise.resolve();$("#save-indicator").textContent="已儲存 · "+new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"});return saved;}
function showGame(){
 $("#welcome").hidden=true;$("#game").hidden=false;$("#save-btn").disabled=false;
 $("#save-indicator").textContent="已載入本機存檔";render();
 readHistoryDB().then(async data=>{
  if(!state)return;
  let history=data;
  try{
   if((history.importedFiles||[]).length<107){
    $("#save-indicator").textContent="同步歷史球員資料…";
    const result=await importCompleteHistoricalDatabase(history,progress=>{$("#save-indicator").textContent="歷史資料 "+progress.completed+"/"+progress.total;});
    history=result.history;await saveHistoryDB(history);
   }
  }catch(error){console.warn("Historical database background sync failed:",error);}
  if(!state)return;
  state.history=history;
  if(!Array.isArray(state.foreignMarket)||state.foreignMarketSeason!==state.season){
   state.foreignMarket=buildHistoricalForeignMarket(history,state.season,state.players,state.season,state.clubId);
   state.foreignMarketSeason=state.season;
  }
  persist();render();
 });
}
function refreshWelcome(){
 const raw=localStorage.getItem(STORAGE_KEY),info=$("#save-info"),continueBtn=$("#continue-btn");
 let parsed=null,valid=false;
 if(raw){try{parsed=JSON.parse(raw);valid=!!parsed&&Array.isArray(parsed.players)&&!!club(parsed.clubId);}catch{valid=false;}}
 continueBtn.hidden=!valid;
 if(valid)info.textContent=`找到存檔：${parsed.manager||"未命名球團"} · ${club(parsed.clubId).name} · ${parsed.season||"未知"} 球季`;
 else if(raw)info.textContent="偵測到無法辨識的存檔。原始資料仍保留，可匯入備份或建立新球團。";
 else info.textContent="目前沒有本機存檔。你可以建立新球團，或匯入先前匯出的 JSON 存檔。";
}
function setup(){
  $("#team-select").innerHTML=LEAGUE.clubs.map(c=>`<option value="${c.id}">${c.name} · ${c.city}</option>`).join("");
  $("#season-select").innerHTML=Array.from({length:35},(_,i)=>2024-i).map(y=>`<option value="${y}" ${y===2024?"selected":""}>${y} 球季</option>`).join("");
  $("#career-status").textContent="選擇歷史球季後，系統會自動準備對應球員資料。";
  $("#career-dialog").showModal();
}
async function startCareer(e){
  e.preventDefault();
  const submit=$("#career-form button[type='submit']"),status=$("#career-status");
  if(submit.disabled)return;
  submit.disabled=true;submit.textContent="正在建立球團…";
  try{
    const year=Number($("#season-select").value);
    if(!Number.isInteger(year)||year<1990||year>2024)throw new Error("目前可選年份為 1990–2024。");
    const existing=localStorage.getItem(STORAGE_KEY);
    if(existing){if(!confirm("目前已有球團存檔。建立新球團會先備份舊存檔，再開始新遊戲。要繼續嗎？"))return;localStorage.setItem(STORAGE_KEY+"-backup-"+Date.now(),existing);}
    status.textContent="正在讀取本機歷史資料…";
    let history=await readHistoryDB(),importResult;
    try{
      importResult=await importCompleteHistoricalDatabase(history,progress=>{
        status.textContent=progress.message+" · "+progress.completed+" / "+progress.total+" 個檔案，"+progress.rows.toLocaleString()+" 筆資料";
      });
      history=importResult.history;
      await saveHistoryDB(history);
    }catch(error){
      console.warn("Historical auto-import failed:",error);
      status.textContent="線上資料匯入遇到問題，正在使用已保存的歷史資料或虛構球員備援名單…";
    }
    const team=club($("#team-select").value);
    const foreignLimit=validateForeignLimit($("#foreign-limit").value);
    const historical=createHistoricalSeasonRoster(history,year,foreignLimit);
    const hasSeasonData=historical.realCount>0;
    const players=hasSeasonData?historical.players:createInitialLeagueRoster(year);
    const minorLeague=hasSeasonData?historical.minorLeague:[];
    const foreignMarket=buildHistoricalForeignMarket(history,year,players,year,team.id);
    state={version:3,leagueId:"cpbl",season:year,month:1,matchday:1,pitcherWorkload:{},tradeHistory:[],minorLeague,draft:null,trainingFocus:"balanced",manager:$("#manager-name").value.trim(),clubId:team.id,foreignLimit,wins:0,losses:0,budget:120000000,fanbase:8500,players,history,lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),schedule:createLeagueSchedule(year),currentGame:null,freeAgents:createFreeAgentPool(year),foreignMarket,tactics:{},contracts:initializeContracts(players,year),injuries:{},phase:"regular",seasonStats:{batters:{},pitchers:{}},gameArchive:[],ticketPrice:350,trainingLevel:1,scoutingLevel:1,createdAt:new Date().toISOString(),dataImport:{source:"CPBL Opendata",season:year,completeFiles:importResult?.completed||0,totalFiles:importResult?.total||107,errors:importResult?.errors||[]}};
    initializeAIClubFinances(state);initializeStaff(state);runAIClubManagement(state,{phase:"preseason"});
    $("#career-dialog").close();persist();showGame();
    if(!hasSeasonData)alert("已建立球團，但目前沒有成功取得所選年份的歷史球員統計，已使用依國籍生成的虛構球員作為備援。可稍後到歷史資料庫重新匯入。");
  }catch(error){
    console.error("Career setup failed:",error);
    status.textContent="建立失敗："+error.message;
    alert("建立球團失敗："+error.message);
  }finally{
    submit.disabled=false;submit.textContent="開始經營 →";
  }
}
function stat(label,value,note=""){return `<div class="stat-card"><small>${label}</small><strong>${value}</strong>${note?`<em>${note}</em>`:""}</div>`;}
function dashboard(){
 const c=club(state.clubId),roster=state.players.filter(p=>p.clubId===c.id),played=state.schedule?.filter(g=>g.status==="final"&&(g.homeId===c.id||g.awayId===c.id)).length||0,next=state.schedule?.find(g=>g.matchday===state.matchday&&(g.homeId===c.id||g.awayId===c.id));
 const standings=calculateStandings(state.schedule||[]),rank=standings.findIndex(x=>x.teamId===c.id)+1;
 return `<div class="panel team-hero"><div class="team-logo">${c.code}</div><div><div class="eyebrow">YOUR FRANCHISE</div><h2>${c.name}</h2><p>${esc(state.manager)} · ${c.city} · ${state.season} 球季</p></div></div>
 <div class="grid" style="margin-top:16px">${stat("戰績",state.wins+" 勝 / "+state.losses+" 敗",played+" 場已完成")}${stat("聯盟排名",rank+" / 6","依目前勝率")}${stat("球團資金","$"+(state.budget/1000000).toFixed(1)+"M","含票房、薪資與設施支出")}${stat("球迷基數",(Number(state.fanbase)||8500).toLocaleString(),"影響主場票房")}</div>
 <div class="panel"><div class="panel-heading-row"><div><h3>下一場比賽</h3><p class="field-help">第 ${state.matchday} / 120 個比賽日 · 每隊 120 場例行賽</p></div><button class="button button-primary" data-go-page="games">前往比賽中心 →</button></div>${next?`<div class="next-game compact"><div><small>${esc(club(next.awayId).name)}（客）</small><strong>VS</strong><small>${esc(club(next.homeId).name)}（主）</small></div><p>你的球隊是${next.homeId===c.id?"主場":"客場"}球隊。</p></div>`:'<p class="empty-state">球季賽程已完成。</p>'}</div>
 <div class="panel"><h3>球團管理快捷入口</h3><div class="quick-actions"><button class="button button-quiet" data-go-page="lineup">陣容與戰術</button><button class="button button-quiet" data-go-page="operations">球團營運與自由球員</button><button class="button button-quiet" data-go-page="roster">完整球員名單</button></div></div>
 <div class="panel"><h3>目前球員名單摘要</h3><div class="table-wrap"><table><thead><tr><th>球員</th><th>守位</th><th>年齡</th><th>資料類型</th></tr></thead><tbody>${roster.slice(0,12).map(p=>`<tr><td>${esc(p.name)}</td><td>${p.position}</td><td>${p.age}</td><td><span class="tag ${p.dataKind==="real"?"real":"fake"}">${p.dataKind==="real"?"真實球員":"虛構球員"}</span></td></tr>`).join("")}</tbody></table></div><p class="field-help">真實球員依所選球季歷史資料及球隊 ID 歸隊；歷史資料未涵蓋的球隊與名額缺口，使用依國籍規則生成並明確標記的虛構球員。</p></div>`;
}function leaguePage(){
 const rows=calculateStandings(state.schedule||[]);
 return `<div class="panel"><h3>${state.season} CPBL 聯盟戰績</h3><div class="table-wrap"><table><thead><tr><th>排名</th><th>球隊</th><th>場次</th><th>勝</th><th>敗</th><th>和</th><th>勝率</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td><b>${club(x.teamId).name}</b>${x.teamId===state.clubId?' <span class="tag fake">我的球隊</span>':''}</td><td>${x.games}</td><td>${x.wins}</td><td>${x.losses}</td><td>${x.ties}</td><td>${x.winPct.toFixed(3)}</td></tr>`).join("")}</tbody></table></div><p class="field-help">六隊循環賽程，每隊 120 場。比賽由同一套引擎逐球結算，AI 球隊也會實際模擬。</p></div>`;
}

function rosterPage(){return renderRosterPage(state,club,esc);}
function historyPage(){return renderHistoryPage(state.history);}
function starPage(){return renderStarMarket(state.history,starSeason);}
function lineupPage(){return renderLineupPage(state);}
function operationsPage(){return renderOperationsPage(state);}
function gamesPage(){return renderGamePage(state);}
function settingsPage(){
 return `<div class="panel"><h3>聯盟規則</h3><div class="setting-row"><div><span>聯盟</span><small>第一個可玩版本以 CPBL 為核心</small></div><b>中華職棒</b></div><div class="setting-row"><div><span>洋將名額上限</span><small>開局自訂，允許 0 至 13 人</small></div><b>${state.foreignLimit} 人</b></div><div class="setting-row"><div><span>球季賽程</span><small>六隊循環賽，每隊 120 場</small></div><b>360 場</b></div><div class="setting-row"><div><span>比賽模式</span><small>逐球操作、逐打席操作、快速模擬共用引擎</small></div><b>Live + Sim</b></div></div><div class="panel"><h3>存檔管理</h3><p class="field-help">球團經營進度儲存在此瀏覽器。歷史資料另存 IndexedDB。建議定期匯出 JSON 備份。</p><button id="export-btn" class="button button-quiet">匯出存檔 JSON</button></div>`;
}
function render(){
 if(!state)return;
 if(page==="operations"&&state.foreignMarketSeason!==state.season){state.foreignMarket=buildHistoricalForeignMarket(state.history||emptyHistory(),state.season,state.players,state.season,state.clubId);state.foreignMarketSeason=state.season;}
 $("#welcome").hidden=true;$("#game").hidden=false;$("#save-btn").disabled=false;
 const titles={dashboard:"球團總覽",roster:"球員名單",lineup:"陣容與戰術",games:"賽程與比賽",operations:"球團營運",history:"歷史資料庫",stars:"經典球星",league:"聯盟戰況",settings:"聯盟設定"};
 $("#page-title").textContent=titles[page]||"球團總覽";$("#season-label").textContent=state.season+" 球季";
 try{
  // Build the page registry inside the guarded block so a missing renderer
  // cannot abort the entire app before the recovery UI is available.
  const pages={dashboard,roster:rosterPage,lineup:lineupPage,games:gamesPage,operations:operationsPage,history:historyPage,stars:starPage,league:leaguePage,settings:settingsPage};
  $("#page-content").innerHTML=(pages[page]||dashboard)();
 }catch(error){
  console.error("Page render failed:",error);
  $("#page-content").innerHTML=`<div class="panel render-error"><h3>這個頁面暫時無法顯示</h3><p>存檔已載入，但頁面資料有缺漏或格式不相容。你的原始存檔不會因為這個提示而被刪除。</p><p class="field-help">錯誤資訊：${esc(error?.message||error)}</p><div class="quick-actions"><button class="button button-quiet" id="retry-render-btn">重新載入頁面</button><button class="button button-quiet" id="export-recovery-btn">匯出目前存檔備份</button></div></div>`;
  $("#retry-render-btn")?.addEventListener("click",()=>render());
  $("#export-recovery-btn")?.addEventListener("click",exportSave);
 }
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 const exportBtn=$("#export-btn");if(exportBtn)exportBtn.addEventListener("click",exportSave);
 document.querySelectorAll("[data-go-page]").forEach(b=>b.addEventListener("click",()=>{page=b.dataset.goPage;render();}));
 if(page==="roster")bindRosterTools(state,persist,render);
 if(page==="lineup")bindLineupPage(state,persist,render);
 if(page==="games")bindGamePage(state,persist,render);
 if(page==="operations")bindOperationsPage(state,persist,render);
 if(page==="history")bindHistoryPage(state,persist,render);
 if(page==="stars")bindStarMarket(y=>{starSeason=y;render();});
}
function exportSave(){
 const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="global-baseball-gm-save.json";a.click();URL.revokeObjectURL(url);
}
$("#new-career-btn").addEventListener("click",setup);
$("#continue-btn").addEventListener("click",()=>{if(load())showGame();else{refreshWelcome();alert("讀取失敗："+(saveStatus||"存檔資料有誤"));}});
$("#import-save-btn").addEventListener("click",()=>$("#import-save-file").click());
$("#import-save-file").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!imported||!Array.isArray(imported.players)||!imported.clubId||!club(imported.clubId))throw new Error("檔案不是有效的 Global Baseball GM 存檔");if(localStorage.getItem(STORAGE_KEY))localStorage.setItem(STORAGE_KEY+"-backup-"+Date.now(),localStorage.getItem(STORAGE_KEY));localStorage.setItem(STORAGE_KEY,JSON.stringify(imported));if(load())showGame();else throw new Error(saveStatus||"讀檔失敗");}catch(error){alert("匯入失敗："+error.message);}finally{e.target.value="";refreshWelcome();}});
$("#cancel-career").addEventListener("click",()=>$("#career-dialog").close());
$("#career-form").addEventListener("submit",startCareer);
$("#foreign-limit").addEventListener("input",e=>$("#foreign-value").textContent=e.target.value+" 人");
$("#save-btn").addEventListener("click",persist);
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{if(!state)return;page=b.dataset.page;render();}));
refreshWelcome();
window.addEventListener("error",event=>{const info=$("#save-info");if(info)info.textContent="遊戲初始化發生錯誤："+(event.message||"未知錯誤")+"。請重新整理頁面或匯入存檔。";});
window.addEventListener("unhandledrejection",event=>{const info=$("#save-info");if(info)info.textContent="遊戲載入失敗："+String(event.reason?.message||event.reason||"未知錯誤");});
