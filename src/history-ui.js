import {HISTORY_SOURCE,importHistoryCsv,searchHistoricalPlayers,getHistoricalSeasonLines,battingRates,pitchingRates} from "./history.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const RAW="https://raw.githubusercontent.com/ldkrsi/cpbl-opendata/master/";
export function renderHistoryPage(history){
 const h=history||{players:{},batting:[],pitching:[],fielding:[],standings:[],importedFiles:[]},years=[...new Set([...h.batting,...h.pitching,...h.fielding].map(x=>x.year))].sort((a,b)=>b-a);
 const count=Object.keys(h.players).length;
 return `<section class="panel"><div class="panel-heading-row"><div><h3>歷史資料庫匯入</h3><p class="field-help">球員 ${count} 位 · 打擊 ${h.batting.length} 筆 · 投球 ${h.pitching.length} 筆 · 守備 ${h.fielding.length} 筆 · 球隊戰績 ${h.standings.length} 筆</p></div><span class="tag real">1990–2024 資料源</span></div>
 <p class="field-help">可直接從 CPBL Opendata 線上匯入 1990–2024 全部年度 CSV，或選擇已下載的資料夾。線上匯入約處理 107 個檔案，資料儲存在此瀏覽器 IndexedDB，不會把第三方 CSV 複製進遊戲 GitHub。</p>
 <div class="history-import-actions"><button id="history-online-import" class="button button-primary">線上匯入 1990–2024 全資料</button><label class="file-picker">選擇本機資料夾 <input id="history-files" type="file" webkitdirectory directory multiple accept=".csv"></label></div>
 <div id="history-import-result" class="field-help" aria-live="polite">${h.importedFiles.length?"已匯入 "+h.importedFiles.length+" 個檔案。":"尚未匯入歷史資料。"}</div></section>
 <section class="panel"><div class="panel-heading-row"><h3>歷史球員查詢</h3><span class="tag fake">本機資料</span></div><div class="history-filters"><label>球員姓名或 ID<input id="history-query" placeholder="搜尋球員、球隊或 ID"></label><label>球季<select id="history-year"><option value="">全部球季</option>${years.map(y=>`<option value="${y}">${y}</option>`).join("")}</select></label><label>成績類型<select id="history-kind"><option value="all">全部</option><option value="batting">打擊</option><option value="pitching">投球</option><option value="fielding">守備</option></select></label></div><div id="history-results"><p class="empty-state">匯入資料後即可搜尋歷史球員。</p></div></section>
 <section class="panel"><h3>資料來源與限制</h3><p class="field-help">來源：<a href="https://github.com/ldkrsi/cpbl-opendata" target="_blank" rel="noopener">CPBL Opendata</a>。該整理專案涵蓋 1990–2024 年打擊、投球、守備與球隊戰績，並記載 2021 年官網改版造成的 ID 轉換問題及部分欄位定義差異。整理專案的 MIT 授權不等於中職原始資料自動可再散布，因此此工具採使用者端匯入，不將第三方 CSV 打包進遊戲。</p></section>`;
}
function sourceFiles(){
 const files=["players.csv","CPBL/standings.csv"];
 for(let year=1990;year<=2024;year++)for(const kind of ["battings","pitchings","fieldings"])files.push(`CPBL/${kind}/${year}.csv`);
 return files;
}
async function onlineImport(state,persist,render){
 const button=document.querySelector("#history-online-import"),report=document.querySelector("#history-import-result");
 if(!button||button.disabled)return;
 const files=sourceFiles(),errors=[];let completed=0,rows=0;
 button.disabled=true;button.textContent="匯入中…";
 try{
  for(let i=0;i<files.length;i+=5){
   const batch=files.slice(i,i+5);
   const fetched=await Promise.all(batch.map(async path=>{
    try{const response=await fetch(RAW+path,{cache:"no-store"});if(!response.ok)throw new Error("HTTP "+response.status);return {path,text:await response.text()};}
    catch(error){return {path,error:error.message};}
   }));
   for(const item of fetched){
    if(item.error){errors.push(item.path+" ("+item.error+")");continue;}
    try{const result=importHistoryCsv({path:item.path,text:item.text},state.history);state.history=result.history;rows+=result.added;}
    catch(error){errors.push(item.path+" ("+error.message+")");}
    completed++;
   }
   if(report)report.textContent="匯入進度 "+Math.min(i+batch.length,files.length)+" / "+files.length+" 個檔案；已讀取 "+completed+" 個；處理 "+rows.toLocaleString()+" 筆紀錄。";
   await persist();
  }
 }finally{
  button.disabled=false;button.textContent="重新匯入／補齊歷史資料";
 }
 render();
 const out=document.querySelector("#history-import-result");
 if(out)out.textContent="完成：讀取 "+completed+" / "+files.length+" 個檔案，處理 "+rows.toLocaleString()+" 筆紀錄；目前球員 "+Object.keys(state.history.players).length+" 位，打擊 "+state.history.batting.length+" 筆、投球 "+state.history.pitching.length+" 筆、守備 "+state.history.fielding.length+" 筆、球隊戰績 "+state.history.standings.length+" 筆。"+(errors.length?" 失敗 "+errors.length+" 個："+errors.slice(0,8).join("；"):" 全部檔案成功。") ;
}
export function bindHistoryPage(state,persist,render){
 document.querySelector("#history-online-import")?.addEventListener("click",()=>onlineImport(state,persist,render));
 const input=document.querySelector("#history-files");
 if(input)input.addEventListener("change",async e=>{
  const files=[...(e.target.files||[])],out=document.querySelector("#history-import-result");let total=0,ok=0,errors=[];
  for(const file of files){let path=file.webkitRelativePath||file.name;let metaPath=path.replace(/^.*?CPBL\//,"CPBL/");if(!/^(CPBL\/)?(battings|pitchings|fieldings)\//.test(metaPath)&&/^(battings|pitchings|fieldings)-\d{4}\.csv$/i.test(file.name))metaPath=file.name;
   try{const result=importHistoryCsv({path:metaPath,name:file.name,text:await file.text()},state.history);state.history=result.history;total+=result.added;ok++;}
   catch(err){errors.push(file.name+"："+err.message);}
  }
  await persist();render();const report=document.querySelector("#history-import-result");
  if(report)report.textContent="成功處理 "+ok+" 個檔案，新增／更新 "+total.toLocaleString()+" 筆。"+(errors.length?" 未處理 "+errors.length+" 個檔案："+errors.slice(0,5).join("；"):"");
  e.target.value="";
 });
 const update=()=>{
  const q=document.querySelector("#history-query")?.value||"",y=document.querySelector("#history-year")?.value||"",k=document.querySelector("#history-kind")?.value||"all",players=searchHistoricalPlayers(state.history,q,y?Number(y):null,k),box=document.querySelector("#history-results");
  if(!box)return;
  box.innerHTML=players.slice(0,100).map(p=>{
   const years=[...new Set(p.seasons||[])].sort((a,b)=>b-a),year=y?Number(y):years[0],lines=getHistoricalSeasonLines(state.history,p.id,year),b=lines.batting[0],pit=lines.pitching[0],field=lines.fielding;let stat="";
   if(b){const r=battingRates(b.stats);stat+="打擊 "+[["AVG",r.avg],["OPS",r.ops]].map(([key,v])=>key+" "+(v===null?"--":v.toFixed(3))).join(" · ")+" · HR "+(b.stats.HR??"--")+" · RBI "+(b.stats.RBI??"--")+"<br>";}
   if(pit){const r=pitchingRates(pit.stats);stat+="投球 ERA "+(r.era===null?"--":r.era.toFixed(2))+" · WHIP "+(r.whip===null?"--":r.whip.toFixed(2))+" · 勝敗 "+(pit.stats.W??"--")+"-"+(pit.stats.L??"--");}
   return `<article class="history-player"><div><b>${esc(p.name)}</b><small>${esc(p.id)} · ${esc(p.country||"國籍未載")} · ${years.join(", ")}</small></div><div class="history-line">${stat||"該年度沒有對應成績"}<small>${esc([b?.teamName,pit?.teamName,...field.map(x=>x.teamName)].filter(Boolean).join(" / "))}</small></div></article>`;
  }).join("")||'<p class="empty-state">沒有符合條件的球員，或尚未匯入該年度資料。</p>';
  if(players.length>100)box.insertAdjacentHTML("beforeend",'<p class="field-help">目前只顯示前 100 位，請縮小搜尋條件。</p>');
 };
 for(const id of ["history-query","history-year","history-kind"])document.querySelector("#"+id)?.addEventListener(id==="history-query"?"input":"change",update);
 update();
}
