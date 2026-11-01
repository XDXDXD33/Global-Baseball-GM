export const FEATURED_IMPORTS = [
 {id:"0000000175",name:"湯尼・梅托耶",english:"Tony Metoyer",decade:"1990s",years:"1990、1993–1996",position:"投手／外野手",country:"美國",note:"早期中職代表性洋將之一，跨投打兩端留下紀錄",evidence:"CPBL Opendata 球員名冊與年度成績",source:"https://github.com/ldkrsi/cpbl-opendata"},
 {id:"0000003759",name:"鷹俠",english:"Luis Iglesias",decade:"1990s",years:"1990、1993–1996",position:"內野手",country:"巴拿馬",note:"早期中職知名外籍打者，年度打擊紀錄可供查核",evidence:"CPBL Opendata 球員名冊與年度成績",source:"https://github.com/ldkrsi/cpbl-opendata"},
 {id:"0000000566",name:"帝波",english:"Tiburcio Domingo",decade:"1990s",years:"1990年代",position:"外野手",country:"多明尼加",note:"兄弟象早期外籍野手代表人物",evidence:"CPBL Opendata 球員名冊與年度成績",source:"https://github.com/ldkrsi/cpbl-opendata"},
 {id:"0000002488",name:"王漢",english:"Jose Nunez",decade:"1990s",years:"1993–1995",position:"投手",country:"多明尼加",note:"曾效力統一獅，亦有 MLB、NPB、KBO 職業經歷",evidence:"CPBL Opendata 與跨聯盟履歷整理",source:"https://cpblstats.com/pro-ball-grand-slam-played-in-cpbl-mlb-npb-kbo/"},
 {id:"0000000594",name:"巴比諾",english:"Balvino Galvez",decade:"1990s",years:"1994–1995",position:"投手",country:"多明尼加",note:"兄弟象知名洋投，之後曾效力讀賣巨人",evidence:"CPBL Opendata 與跨聯盟履歷整理",source:"https://cpblstats.com/pro-ball-grand-slam-played-in-cpbl-mlb-npb-kbo/"},
 {id:"0000000570",name:"路易士",english:"Luis Santos",decade:"1990s",years:"1994–1996",position:"內野手",country:"美國",note:"兄弟象代表性外籍打者，另有 NPB、KBO 與 TML 經歷",evidence:"CPBL Opendata 與跨聯盟履歷整理",source:"https://cpblstats.com/pro-ball-grand-slam-played-in-cpbl-mlb-npb-kbo/"},
 {id:"0000000209",name:"勇壯",english:"Osvaldo Martinez",decade:"1990s–2000s",years:"1997–2000年代初",position:"投手",country:"多明尼加",note:"興農牛時期知名洋投，屬於跨季長期貢獻型球員",evidence:"CPBL Opendata 球員名冊與年度成績",source:"https://github.com/ldkrsi/cpbl-opendata"},
 {id:"0000003828",name:"風神",english:"Jonathan Hurst",decade:"2000s",years:"1998–2000年代初",position:"投手",country:"美國",note:"兄弟象時期具代表性的長局數先發洋投",evidence:"CPBL Opendata 球員名冊與年度成績",source:"https://github.com/ldkrsi/cpbl-opendata"},
 {id:"0000000331",name:"曼尼・拉米瑞茲",english:"Manny Ramirez",decade:"2010s",years:"2013",position:"外野手",country:"多明尼加",note:"12 次 MLB 全明星，2013 年效力義大犀牛",evidence:"MLB 官方回顧與 CPBL Opendata 球員名冊",source:"https://www.mlb.com/news/featured/taiwan-baseball-history"},
 {id:"external-mike-fiers",name:"Mike Fiers",english:"Mike Fiers",decade:"2020s",years:"2022",position:"投手",country:"美國",note:"曾在 MLB 長期先發，MLB 回顧文章提及其來台參賽",evidence:"MLB 官方台灣棒球史回顧；需補齊本地年度成績連結",source:"https://www.mlb.com/news/featured/taiwan-baseball-history"}
];

const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function renderStarMarket(history, season=2026) {
 const h=history||{players:{},batting:[],pitching:[]};
 const cards=FEATURED_IMPORTS.map(p=>{
  const profile=h.players?.[p.id];
  const batting=(h.batting||[]).filter(x=>x.playerId===p.id);
  const pitching=(h.pitching||[]).filter(x=>x.playerId===p.id);
  const all=[...batting,...pitching].sort((a,b)=>a.year-b.year);
  const latest=all.at(-1);
  const status=p.id.startsWith("external-")?"待匯入本地年度成績":profile?"已連結歷史球員":"等待匯入歷史資料";
  const active=all.some(x=>x.year===Number(season));
  return `<article class="star-card">
   <div class="star-card-top"><span class="tag real">${esc(p.decade)}</span><span class="tag">${esc(status)}</span></div>
   <h4>${esc(p.name)}</h4><p class="star-english">${esc(p.english)} · ${esc(p.country)} · ${esc(p.position)}</p>
   <p class="star-note">${esc(p.note)}</p>
   <div class="star-meta"><span>中職紀錄：${esc(p.years)}</span><span>${active?"本球季有登錄成績":latest?"資料庫已有歷史成績":"尚未連結成績"}</span></div>
   <div class="star-evidence">${esc(p.evidence)} · <a href="${esc(p.source)}" target="_blank" rel="noopener">來源</a></div>
  </article>`;
 }).join("");
 return `<section class="panel"><div class="panel-heading-row"><div><h3>跨年代經典洋將資料庫</h3><p class="field-help">以可查證的中職登場紀錄為主。這是歷史球員索引，不會自動把退役球員當成當季自由球員，也不會憑空生成能力值。</p></div><span class="tag real">${FEATURED_IMPORTS.length} 位候選球星</span></div>
 <div class="history-filters"><label>查看球季<select id="star-season">${[1990,1995,2000,2005,2010,2013,2015,2020,2022,2024,2026].map(y=>`<option value="${y}" ${y===Number(season)?"selected":""}>${y}</option>`).join("")}</select></label></div>
 <div class="star-grid">${cards}</div></section>
 <section class="panel"><h3>球星資料使用原則</h3><p class="field-help">有中職登錄紀錄者優先連結歷史球員 ID 與實際年度成績。跨聯盟履歷只作為知名度與經歷註記，不直接換算成中職能力值。未找到足夠原始數據者會標示待查，不會用印象填入 0–100 能力。</p></section>`;
}
export function bindStarMarket(render) {
 document.querySelector("#star-season")?.addEventListener("change",e=>render(Number(e.target.value)));
}
