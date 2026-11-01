export const HISTORY_SOURCE = {
  id:"cpbl-opendata", name:"CPBL Opendata", repository:"https://github.com/ldkrsi/cpbl-opendata",
  license:"MIT (repository license; underlying league data rights should be checked separately)",
  retrievedAt:"2026-11-01", firstSeason:1990, lastVerifiedSeason:2024
};

export const TEAM_ERAS = [
 {id:"dragons-1990",name:"味全龍",from:1990,to:1999,franchiseId:"dragons"},
 {id:"brothers-1990",name:"兄弟象",from:1990,to:2013,franchiseId:"brothers"},
 {id:"lions-1990",name:"統一獅",from:1990,to:2007,franchiseId:"lions"},
 {id:"tigers-1990",name:"三商虎",from:1990,to:1999,franchiseId:"san_shang_tigers"},
 {id:"bears-1993",name:"俊國熊",from:1993,to:1995,franchiseId:"guardians"},
 {id:"eagles-1993",name:"時報鷹",from:1993,to:1997,franchiseId:"times_eagles"},
 {id:"bulls-1996",name:"興農牛",from:1996,to:2012,franchiseId:"guardians"},
 {id:"whales-1997",name:"和信鯨",from:1997,to:2001,franchiseId:"whales"},
 {id:"whales-2002",name:"中信鯨",from:2002,to:2008,franchiseId:"whales"},
 {id:"firstbank-2003",name:"第一金剛",from:2003,to:2003,franchiseId:"monkeys"},
 {id:"sun-2003",name:"誠泰太陽",from:2003,to:2003,franchiseId:"cobras"},
 {id:"cobras-2004",name:"誠泰Cobras",from:2004,to:2007,franchiseId:"cobras"},
 {id:"monkeys-2004",name:"La New熊",from:2004,to:2010,franchiseId:"monkeys"},
 {id:"dragons-2021",name:"味全龍",from:2021,to:2026,franchiseId:"dragons"},
 {id:"brothers-2014",name:"中信兄弟",from:2014,to:2026,franchiseId:"brothers"},
 {id:"lions-2008",name:"統一7-ELEVEn獅",from:2008,to:2026,franchiseId:"lions"},
 {id:"monkeys-2011",name:"Lamigo桃猿",from:2011,to:2019,franchiseId:"monkeys"},
 {id:"bulls-2013",name:"義大犀牛",from:2013,to:2016,franchiseId:"guardians"},
 {id:"guardians-2017",name:"富邦悍將",from:2017,to:2026,franchiseId:"guardians"},
 {id:"monkeys-2020",name:"樂天桃猿",from:2020,to:2026,franchiseId:"monkeys"},
 {id:"dmedia-2008",name:"米迪亞暴龍",from:2008,to:2008,franchiseId:"cobras"},
 {id:"hawks-2024",name:"台鋼雄鷹",from:2024,to:2026,franchiseId:"hawks"}
];

export function parseCsv(text){
 const rows=[];let row=[],cell="",quoted=false;const s=String(text??"").replace(/^\uFEFF/,"");
 for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(c==='"'&&quoted&&n==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
 if(quoted)throw new Error("CSV 引號未正確配對");row.push(cell);if(row.some(v=>v.trim()))rows.push(row);if(!rows.length)return [];
 const headers=rows.shift().map(h=>h.trim());return rows.map((r,index)=>{if(r.length!==headers.length)throw new Error("CSV 第 "+(index+2)+" 列欄位數量不一致");return Object.fromEntries(headers.map((h,i)=>[h,r[i].trim()]));});
}
const num=v=>v===""||v===undefined||v===null?null:(Number.isFinite(Number(v))?Number(v):null);
const slug=s=>String(s||"unknown").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"");
const TEAM_ID_FRANCHISE = {AAA:"dragons",ACC:"brothers",ADD:"lions",ABB:"san_shang_tigers",AEE:"guardians",AFF:"times_eagles",AEG:"guardians",AHH:"whales",AJJ:"monkeys",AII:"cobras",AJK:"monkeys",AIL:"cobras",AEM:"guardians",ACN:"brothers",AEO:"guardians",AJL:"monkeys",AKP:"hawks"};
const TEAM_NAME_FRANCHISE = {"味全":"dragons","味全龍":"dragons","兄弟":"brothers","兄弟象":"brothers","中信兄弟":"brothers","統一":"lions","統一獅":"lions","統一7-ELEVEn":"lions","統一7-ELEVEn獅":"lions","三商":"san_shang_tigers","三商虎":"san_shang_tigers","俊國":"guardians","俊國熊":"guardians","興農":"guardians","興農牛":"guardians","義大":"guardians","義大犀牛":"guardians","富邦":"guardians","富邦悍將":"guardians","時報":"times_eagles","時報鷹":"times_eagles","和信":"whales","和信鯨":"whales","中信鯨":"whales","第一金剛":"monkeys","La New":"monkeys","La New熊":"monkeys","Lamigo":"monkeys","Lamigo桃猿":"monkeys","樂天":"monkeys","樂天桃猿":"monkeys","誠泰":"cobras","誠泰太陽":"cobras","誠泰Cobras":"cobras","米迪亞":"cobras","米迪亞暴龍":"cobras","台鋼":"hawks","台鋼雄鷹":"hawks"};
export function resolveHistoricalTeam(name,year,teamId=""){
 const clean=String(name||"").trim(),franchiseId=TEAM_ID_FRANCHISE[teamId]||TEAM_NAME_FRANCHISE[clean]||null;
 const found=franchiseId?TEAM_ERAS.find(t=>t.franchiseId===franchiseId&&year>=t.from&&year<=t.to):TEAM_ERAS.find(t=>t.name===clean&&year>=t.from&&year<=t.to);
 return found?{teamEraId:found.id,franchiseId:found.franchiseId,teamName:clean||found.name,canonicalEraName:found.name}:{teamEraId:"unmapped-"+slug(clean)+"-"+year,franchiseId:null,teamName:clean||"未知球隊",canonicalEraName:null};
}
export function inningsToNumber(value){
 if(value===null||value===undefined||value==="")return null;const s=String(value);const m=s.match(/^(\d+)(?:\.(\d))?$/);if(!m)return num(value);const outs=Number(m[2]||0);if(outs>2)return null;return Number(m[1])+outs/3;
}
export function battingRates(s){
 const ab=num(s.AB),h=num(s.H),tb=num(s.TB),bb=num(s.BB)||0,ibb=num(s.IBB)||0,hbp=num(s.HBP)||0,sf=num(s.SF)||0;
 const avg=ab>0?h/ab:null,obpDen=ab+bb+ibb+hbp+sf,obp=obpDen>0?(h+bb+ibb+hbp)/obpDen:null,slg=ab>0&&tb!==null?tb/ab:null;
 return {avg,obp,slg,ops:obp!==null&&slg!==null?obp+slg:null};
}
export function pitchingRates(s){
 const ip=inningsToNumber(s.IP),er=num(s.ER),h=num(s.H),bb=num(s.BB)||0,ibb=num(s.IBB)||0;
 return {era:ip>0&&er!==null?er*9/ip:null,whip:ip>0&&h!==null?(h+bb+ibb)/ip:null,innings:ip};
}
export function detectHistoryFile(path){
 const p=String(path||"").replace(/\\/g,"/");
 if(/(^|\/)players\.csv$/i.test(p))return {kind:"players"};
 if(/(^|\/)standings\.csv$/i.test(p))return {kind:"standings"};
 const m=p.match(/(?:^|\/)(battings|pitchings|fieldings)\/(\d{4})\.csv$/i)||p.match(/(?:^|\/)(battings|pitchings|fieldings)[-_](\d{4})\.csv$/i);
 if(m)return {kind:m[1].toLowerCase().replace(/s$/,""),year:Number(m[2])};
 return null;
}
const numFields={batting:["G","PA","AB","RBI","R","H","1B","2B","3B","HR","TB","SO","SB","GIDP","SH","SF","BB","IBB","HBP","CS","GO","FO"],pitching:["G","GS","GR","CG","SHO","NBB","W","L","SV","BS","HLD","BF","NP","H","HR","BB","IBB","HBP","SO","WP","BK","R","ER","GO","FO"],fielding:["G","TC","PO","A","E","DP","TP","PB","CS","SB"]};
export function importHistoryCsv({path,name,text},history){
 const meta=detectHistoryFile(path||name);if(!meta)throw new Error("無法辨識檔案。請保留 CPBL/battings/1990.csv 等資料夾結構，或命名為 battings-1990.csv。");
 const rows=parseCsv(text);if(!rows.length)throw new Error("CSV 沒有資料");
 const next={players:{...(history?.players||{})},batting:[...(history?.batting||[])],pitching:[...(history?.pitching||[])],fielding:[...(history?.fielding||[])],standings:[...(history?.standings||[])],importedFiles:[...(history?.importedFiles||[])]};
 let added=0;
 if(meta.kind==="players"){
  for(const r of rows){if(!r.ID||!r.Name)continue;const prior=next.players[r.ID]||{};next.players[r.ID]={...prior,id:r.ID,name:r.Name,handedness:r.Handedness||prior.handedness||"",birthday:r.Birthday||prior.birthday||"",country:r.Country||prior.country||"",fullName:r["Full Name"]||prior.fullName||"",source:HISTORY_SOURCE.id};added++;}
 }else if(meta.kind==="standings"){
  for(const r of rows){const year=num(r.Year);if(!year)continue;const team=resolveHistoricalTeam(r.Team,year,r["Team ID"]);next.standings.push({year,teamId:r["Team ID"],oldTeamId:r["Old ID"]||"",teamName:r.Team,teamNickname:r["Team Nickname"],wins:num(r.Win),losses:num(r.Lose),ties:num(r.Tie),...team,source:HISTORY_SOURCE.id});added++;}
 }else{
  if(!Number.isInteger(meta.year)||meta.year<1990||meta.year>2026)throw new Error("球季年份必須介於 1990 至 2026");
  const target=next[meta.kind];
  for(const r of rows){if(!r.ID||!r.Name)continue;const team=resolveHistoricalTeam(r["Team Name"],meta.year),stats={};for(const k of numFields[meta.kind])stats[k]=num(r[k]);if(meta.kind==="fielding")stats.POS=r.POS||"";
   const record={playerId:r.ID,playerName:r.Name,year:meta.year,teamId:r["Team ID"]||"",...team,stats,source:HISTORY_SOURCE.id};
   const key=meta.kind==="fielding"?[record.playerId,record.year,record.teamId,stats.POS].join("|"):[record.playerId,record.year,record.teamId].join("|");
   const idx=target.findIndex(x=>(meta.kind==="fielding"?[x.playerId,x.year,x.teamId,x.stats.POS]:[x.playerId,x.year,x.teamId]).join("|")===key);
   if(idx>=0)target[idx]=record;else target.push(record);added++;
   const profile=next.players[record.playerId]||{id:record.playerId,name:r.Name,source:HISTORY_SOURCE.id};profile.name=r.Name;profile.seasons=[...(profile.seasons||[])];if(!profile.seasons.includes(meta.year))profile.seasons.push(meta.year);next.players[record.playerId]=profile;
  }
 }
 next.importedFiles=next.importedFiles.filter(f=>f.path!==(path||name));next.importedFiles.push({path:path||name,kind:meta.kind,year:meta.year||null,rows:added,importedAt:new Date().toISOString(),source:HISTORY_SOURCE.id});
 return {history:next,added,kind:meta.kind,year:meta.year||null};
}
export function searchHistoricalPlayers(history,query="",year=null,kind="all"){
 const q=String(query||"").trim().toLowerCase(),ids=new Set();
 for(const type of ["batting","pitching","fielding"]){if(kind!=="all"&&kind!==type)continue;for(const r of history?.[type]||[])if((year===null||r.year===Number(year))&&(!q||r.playerName.toLowerCase().includes(q)||r.playerId.includes(q)||r.teamName.toLowerCase().includes(q)))ids.add(r.playerId);}
 return [...ids].map(id=>history.players?.[id]).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"zh-Hant"));
}
export function getHistoricalSeasonLines(history,playerId,year){
 const find=type=>(history?.[type]||[]).filter(r=>r.playerId===playerId&&r.year===Number(year));
 return {batting:find("batting"),pitching:find("pitching"),fielding:find("fielding")};
}
