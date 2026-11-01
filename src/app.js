import { LEAGUE, DEMO_PLAYERS, RATING_LABELS } from "./data.js";
import { validateForeignLimit } from "./rules.js";

const $ = (s) => document.querySelector(s);
const STORAGE_KEY = "global-baseball-gm-save-v1";
let state = null;
let page = "dashboard";

function club(id){ return LEAGUE.clubs.find(c=>c.id===id); }
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){state=JSON.parse(raw);return true;}}catch(e){console.warn("Save data could not be read",e);}return false;}
function persist(){if(!state)return;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$("#save-indicator").textContent="已儲存 · "+new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"}));}
function setup(){
  $("#team-select").innerHTML=LEAGUE.clubs.map(c=>`<option value="${c.id}">${c.name} · ${c.city}</option>`).join("");
  $("#career-dialog").showModal();
}
function startCareer(e){
  e.preventDefault();
  const team=club($("#team-select").value);
  state={version:1,leagueId:"cpbl",season:2026,month:1,manager:$("#manager-name").value.trim(),clubId:team.id,foreignLimit:validateForeignLimit($("#foreign-limit").value),wins:0,losses:0,budget:120000000,fanbase:8500,players:DEMO_PLAYERS.map(p=>({...p,ratings:{...p.ratings}})),createdAt:new Date().toISOString()};
  $("#career-dialog").close();$("#welcome").hidden=true;$("#game").hidden=false;$("#save-btn").disabled=false;persist();render();
}
function stat(label,value,note=""){return `<div class="stat-card"><small>${label}</small><strong>${value}</strong>${note?`<em>${note}</em>`:""}</div>`;}
function dashboard(){
 const c=club(state.clubId), roster=state.players.filter(p=>p.clubId===c.id);
 return `<div class="panel team-hero"><div class="team-logo">${c.code}</div><div><div class="eyebrow">YOUR FRANCHISE</div><h2>${c.name}</h2><p>${esc(state.manager)} · ${c.city} · ${state.season} 球季</p></div></div>
 <div class="grid" style="margin-top:16px">${stat("勝率",state.wins+state.losses?((state.wins/(state.wins+state.losses))*100).toFixed(1)+"%":"--","賽季尚未開始")}${stat("球團預算","$"+(state.budget/1000000).toFixed(1)+"M","示範初始資金")}${stat("球迷基數",state.fanbase.toLocaleString(),"初始估算")}${stat("洋將名額",state.foreignLimit+" 人","自訂上限 0–13")}</div>
 <div class="panel"><h3>球團控制台</h3><div class="empty-state">球團已建立。第一階段先提供球隊身分、名額規則、示範名單與本機存檔。下一階段將接上正式球員資料、賽程和逐打席比賽引擎。</div></div>
 <div class="panel"><h3>目前名單摘要</h3><div class="table-wrap"><table><thead><tr><th>球員</th><th>守位</th><th>年齡</th><th>資料類型</th></tr></thead><tbody>${roster.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.position}</td><td>${p.age}</td><td><span class="tag fake">虛擬示範</span></td></tr>`).join("")}</tbody></table></div></div>`;
}
function rosterPage(){
 const roster=state.players.filter(p=>p.clubId===state.clubId);
 return `<div class="panel"><h3>一軍球員名單 · ${roster.length} 人</h3><div class="table-wrap"><table><thead><tr><th>球員</th><th>守位</th><th>年齡</th><th>角色</th><th>主要能力</th><th>資料</th></tr></thead><tbody>${roster.map(p=>{const ratings=Object.entries(p.ratings).slice(0,3).map(([k,v])=>`${RATING_LABELS[k]||k} ${v}`).join(" · ");return `<tr><td><b>${esc(p.name)}</b></td><td>${p.position}</td><td>${p.age}</td><td>${p.role}</td><td>${ratings}</td><td><span class="tag fake">虛擬示範</span></td></tr>`;}).join("")}</tbody></table></div><p class="field-help">目前是介面與資料結構測試用的虛擬示範球員，不是真實中職球員，也不代表正式能力評分。</p></div>`;
}
function leaguePage(){
 return `<div class="panel"><h3>${state.season} CPBL 聯盟球隊</h3><div class="table-wrap"><table><thead><tr><th>球隊</th><th>城市</th><th>勝</th><th>敗</th><th>勝率</th></tr></thead><tbody>${LEAGUE.clubs.map(c=>`<tr><td><b>${c.name}</b>${c.id===state.clubId?' <span class="tag fake">我的球隊</span>':''}</td><td>${c.city}</td><td>${c.id===state.clubId?state.wins:0}</td><td>${c.id===state.clubId?state.losses:0}</td><td>${c.id===state.clubId&&state.wins+state.losses?(state.wins/(state.wins+state.losses)).toFixed(3):".000"}</td></tr>`).join("")}</tbody></table></div><p class="field-help">目前顯示聯盟球隊骨架，尚未開始正式賽程模擬。</p></div>`;
}
function settingsPage(){
 return `<div class="panel"><h3>聯盟規則</h3><div class="setting-row"><div><span>聯盟</span><small>第一個可玩版本以 CPBL 為核心</small></div><b>中華職棒</b></div><div class="setting-row"><div><span>洋將名額上限</span><small>開局自訂，允許 0 至 13 人</small></div><b>${state.foreignLimit} 人</b></div><div class="setting-row"><div><span>球員資料模式</span><small>真實資料與虛擬球員並存，清楚標示來源</small></div><b>Mixed</b></div><div class="setting-row"><div><span>歷史資料範圍</span><small>目標涵蓋 1990 年起可取得的球員資料</small></div><b>1990–至今</b></div></div><div class="panel"><h3>存檔管理</h3><p class="field-help">進度目前儲存在這個瀏覽器的 LocalStorage。清除瀏覽器網站資料可能會刪除存檔，後續將加入匯出與匯入功能。</p><button id="export-btn" class="button button-quiet">匯出存檔 JSON</button></div>`;
}
function render(){
 if(!state)return;
 $("#welcome").hidden=true;$("#game").hidden=false;$("#save-btn").disabled=false;
 const titles={dashboard:"球團總覽",roster:"球員名單",league:"聯盟戰況",settings:"聯盟設定"};
 $("#page-title").textContent=titles[page];$("#season-label").textContent=state.season+" 球季";
 $("#page-content").innerHTML=({dashboard,roster:rosterPage,league:leaguePage,settings:settingsPage})[page]();
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 const exportBtn=$("#export-btn");if(exportBtn)exportBtn.addEventListener("click",exportSave);
}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="global-baseball-gm-save.json";a.click();URL.revokeObjectURL(url);}
$("#new-career-btn").addEventListener("click",setup);
$("#cancel-career").addEventListener("click",()=>$("#career-dialog").close());
$("#career-form").addEventListener("submit",startCareer);
$("#foreign-limit").addEventListener("input",e=>$("#foreign-value").textContent=e.target.value+" 人");
$("#save-btn").addEventListener("click",persist);
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{if(!state)return;page=b.dataset.page;render();}));
if(load()){ $("#welcome").hidden=true;$("#game").hidden=false;$("#save-btn").disabled=false;$("#save-indicator").textContent="已載入本機存檔";render(); }
