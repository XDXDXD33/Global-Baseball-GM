import { renderRosterTools } from "./player-tools.js";
import { estimatePlayerAbility, estimatePlayerSalary, calculateRatingConfidence } from "./rules.js";
const POSITIONS=["SP","RP","C","1B","2B","3B","SS","LF","CF","RF","OF","DH"];
const esc=s=>String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function renderRosterPage(state,getClub,escapeHtml){
 const roster=(state.players||[]).filter(p=>p.clubId===state.clubId);
 const nationalities=[...new Set(roster.map(p=>p.nationality||p.country|| (p.foreign?"外籍未詳":"台灣")).filter(Boolean))].sort();
 const rows=roster.map(p=>{
  const ratings=Object.entries(p.ratings||{}).filter(([,v])=>Number.isFinite(Number(v))).slice(0,4).map(([k,v])=>k+" "+v).join(" · ")||"尚無能力資料";
  const ability=Math.round(estimatePlayerAbility(p)),potential=Number(p.potential??p.potentialRating??ability);
  const confidence=Math.round(calculateRatingConfidence(p)*100),salary=Math.round(estimatePlayerSalary(p,{winPct:.5,fanbase:Number(state.fanbase)||8500,averageSalary:1000000}));
  const nationality=p.nationality||p.country||(p.foreign?"外籍未詳":"台灣"),level=p.rosterLevel==="minor"?"二軍":"一軍";
  return `<tr data-player-row data-name="${esc(p.name)}" data-position="${esc(p.position)}" data-nationality="${esc(nationality)}" data-ability="${ability}" data-potential="${potential}" data-age="${Number(p.age)||0}" data-level="${level}">
   <td><b>${esc(p.name)}</b><small class="sub-cell">${esc(p.id)}</small></td><td>${esc(p.position)}</td><td>${p.age??"?"}</td><td>${esc(nationality)}</td><td>${ability}</td><td>${potential||"—"}</td><td>${confidence}%</td><td>${esc(ratings)}</td><td>${level}</td><td>${p.dataKind==="real"?'<span class="tag real">真實資料</span>':'<span class="tag fake">虛擬球員</span>'}</td><td>$${salary.toLocaleString("zh-TW")}</td><td><button class="button button-quiet button-small" data-release-player="${esc(p.id)}">釋出</button>${level==="一軍"?` <button class="button button-quiet button-small" data-demote-player="${esc(p.id)}">下放二軍</button>`:` <button class="button button-quiet button-small" data-promote-roster-player="${esc(p.id)}">升上一軍</button>`}</td>
  </tr>`;
 }).join("");
 const c=getClub(state.clubId);
 return `<section class="panel"><div class="panel-heading-row"><div><h3>球員名單 · ${roster.length} 人</h3><p class="field-help">目前顯示 <span id="roster-visible-count">${roster.length}</span> / ${roster.length} 人。點擊表格欄位標題即可切換升冪／降冪排序，篩選條件可同時使用。</p></div></div>
 <div class="roster-filters">
  <label>搜尋球員<input id="roster-search" type="search" placeholder="輸入球員姓名"></label>
  <label>國籍<select id="roster-nationality"><option value="">全部國籍</option>${nationalities.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join("")}</select></label>
  <label>守備位置<select id="roster-position"><option value="">全部位置</option>${POSITIONS.map(p=>`<option value="${p}">${p}</option>`).join("")}</select></label>
  <label>名單層級<select id="roster-level"><option value="">一軍＋二軍</option><option>一軍</option><option>二軍</option></select></label>
  <label>能力下限<input id="roster-ability-min" type="number" min="0" max="100" placeholder="0"></label><label>能力上限<input id="roster-ability-max" type="number" min="0" max="100" placeholder="100"></label>
  <label>潛力下限<input id="roster-potential-min" type="number" min="0" max="100" placeholder="0"></label><label>潛力上限<input id="roster-potential-max" type="number" min="0" max="100" placeholder="100"></label>
  <label>年齡下限<input id="roster-age-min" type="number" min="15" max="60" placeholder="不限"></label><label>年齡上限<input id="roster-age-max" type="number" min="15" max="60" placeholder="不限"></label>
  <button id="roster-filter-reset" class="button button-quiet" type="button">清除篩選</button>
 </div>
 <div class="table-wrap"><table id="roster-table"><thead><tr>${[["name","球員"],["position","守位"],["age","年齡"],["nationality","國籍"],["ability","能力"],["potential","潛力"],["confidence","信心"],["ratings","能力項目"],["level","一／二軍"],["data","資料"],["salary","估計年薪"],["action","操作"]].map(([k,n])=>`<th>${["name","position","age","nationality","ability","potential"].includes(k)?`<button type="button" class="sort-header" data-sort-key="${k}">${n} ↕</button>`:n}</th>`).join("")}</tr></thead><tbody>${rows||'<tr><td colspan="12">目前沒有球員</td></tr>'}</tbody></table></div>
 <p class="field-help">能力為 0–100 模擬估值；潛力欄為球員潛力評估（無資料時以目前能力作為參考）；信心反映資料完整度。球隊：${c?escapeHtml(c.name):""}</p></section>${renderRosterTools(state,roster)}`;
}
export function bindRosterPage(){
 const table=document.querySelector("#roster-table");if(!table)return;
 const controls=["roster-search","roster-nationality","roster-position","roster-level","roster-ability-min","roster-ability-max","roster-potential-min","roster-potential-max","roster-age-min","roster-age-max"].map(id=>document.getElementById(id)).filter(Boolean);
 const apply=()=>{const val=id=>document.getElementById(id)?.value??"",min=(id)=>val(id)===""?-Infinity:Number(val(id)),max=(id)=>val(id)===""?Infinity:Number(val(id));let visible=0;
  for(const row of table.querySelectorAll("[data-player-row]")){const ok=(!val("roster-search")||row.dataset.name.toLowerCase().includes(val("roster-search").toLowerCase()))&&(!val("roster-nationality")||row.dataset.nationality===val("roster-nationality"))&&(!val("roster-position")||row.dataset.position===val("roster-position"))&&(!val("roster-level")||row.dataset.level===val("roster-level"))&&Number(row.dataset.ability)>=min("roster-ability-min")&&Number(row.dataset.ability)<=max("roster-ability-max")&&Number(row.dataset.potential)>=min("roster-potential-min")&&Number(row.dataset.potential)<=max("roster-potential-max")&&Number(row.dataset.age)>=min("roster-age-min")&&Number(row.dataset.age)<=max("roster-age-max");row.hidden=!ok;if(ok)visible++;}
  const count=document.querySelector("#roster-visible-count");if(count)count.textContent=visible;
 };
 controls.forEach(el=>el.addEventListener("input",apply));controls.forEach(el=>el.addEventListener("change",apply));
 document.querySelector("#roster-filter-reset")?.addEventListener("click",()=>{controls.forEach(el=>el.value="");apply();});
 let sort={key:"name",dir:1};table.querySelectorAll("[data-sort-key]").forEach(btn=>btn.addEventListener("click",()=>{const key=btn.dataset.sortKey;sort={key,dir:sort.key===key?-sort.dir:1};const body=table.tBodies[0],rows=[...body.querySelectorAll("[data-player-row]")];rows.sort((a,b)=>{const av=a.dataset[key]||"",bv=b.dataset[key]||"";return (Number.isFinite(Number(av))&&Number.isFinite(Number(bv))?Number(av)-Number(bv):av.localeCompare(bv,"zh-Hant"))*sort.dir;});rows.forEach(r=>body.appendChild(r));apply();btn.textContent=btn.textContent.replace(/[↑↓↕]/g,"")+(sort.dir===1?" ↑":" ↓");}));
}
