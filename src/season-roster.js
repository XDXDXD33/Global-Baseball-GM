import { LEAGUE } from "./data.js";
import { importHistoryCsv } from "./history.js";
import { generateFictionalPlayer, normalizeCountry } from "./fictional-player-generator.js";

const RAW="https://raw.githubusercontent.com/ldkrsi/cpbl-opendata/master/";
const EMPTY=()=>({players:{},batting:[],pitching:[],fielding:[],standings:[],importedFiles:[]});
const PLAYABLE=new Set(LEAGUE.clubs.map(c=>c.id));
const clamp=(n,a=20,b=95)=>Math.max(a,Math.min(b,Math.round(Number(n)||a)));
const number=v=>Number.isFinite(Number(v))?Number(v):0;
const filesForAllYears=()=>["players.csv","CPBL/standings.csv",...Array.from({length:35},(_,i)=>1990+i).flatMap(y=>["battings","pitchings","fieldings"].map(k=>`CPBL/${k}/${y}.csv`))];

export async function importCompleteHistoricalDatabase(existing=EMPTY(),onProgress=()=>{}){
 let history={...EMPTY(),...existing,players:{...(existing.players||{})},batting:[...(existing.batting||[])],pitching:[...(existing.pitching||[])],fielding:[...(existing.fielding||[])],standings:[...(existing.standings||[])],importedFiles:[...(existing.importedFiles||[])]};
 const paths=filesForAllYears(),done=new Set(history.importedFiles.map(x=>x.path));
 const pending=paths.filter(path=>!done.has(path)),errors=[];let completed=paths.length-pending.length,rows=0;
 onProgress({completed,total:paths.length,rows,message:"檢查歷史資料庫"});
 for(let i=0;i<pending.length;i+=5){
  const batch=pending.slice(i,i+5);
  const results=await Promise.all(batch.map(async path=>{
   try{const response=await fetch(RAW+path,{cache:"force-cache"});if(!response.ok)throw new Error("HTTP "+response.status);return {path,text:await response.text()};}
   catch(error){return {path,error:error.message};}
  }));
  for(const item of results){
   if(item.error){errors.push(item.path+"："+item.error);continue;}
   try{const result=importHistoryCsv({path:item.path,text:item.text},history);history=result.history;rows+=result.added;completed++;}
   catch(error){errors.push(item.path+"："+error.message);}
  }
  onProgress({completed,total:paths.length,rows,message:"正在下載並整理歷史球員資料"});
 }
 return {history,completed,total:paths.length,rows,errors};
}

function countryIsForeign(country){
 if(!String(country||"").trim())return false;
 return normalizeCountry(country)!=="TW";
}
function ageAt(profile,year){
 const match=String(profile?.birthday||"").match(/^(\d{4})/);
 return match?Math.max(16,Math.min(55,year-Number(match[1]))):27;
}
function fieldPosition(lines){
 const counts=new Map();
 for(const line of lines){const pos=String(line.stats?.POS||"").toUpperCase();if(pos)counts.set(pos,(counts.get(pos)||0)+number(line.stats?.G));}
 const best=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
 const map={"P":"SP","投手":"SP","C":"C","捕手":"C","1B":"1B","一壘":"1B","2B":"2B","二壘":"2B","3B":"3B","三壘":"3B","SS":"SS","游擊":"SS","LF":"LF","左外野":"LF","CF":"CF","中外野":"CF","RF":"RF","右外野":"RF","OF":"OF","外野":"OF","DH":"DH"};
 return map[best]||"OF";
}
function ratingsFromStats(bat,pit,field){
 const r={};
 if(pit){
  const ip=number(pit.IP?.replace?.(/(\d)\.([12])$/,(m,a,b)=>String(Number(a)+Number(b)/3))||pit.IP);
  const era=ip>0?number(pit.ER)*9/ip:4.5,whip=ip>0?(number(pit.H)+number(pit.BB)+number(pit.IBB))/ip:1.4,k9=ip>0?number(pit.SO)*9/ip:7;
  r.velocity=clamp(42+k9*3.2);r.control=clamp(92-whip*23);r.movement=clamp(88-era*7);r.stamina=clamp(48+number(pit.GS)*1.8);const chances=number(field?.PO)+number(field?.A),errors=number(field?.E),games=number(field?.G)||1;r.fielding=clamp(50+(chances/games-1.8)*4-errors/games*8);r.arm=clamp(45+number(field?.A)/games*.25);r.range=clamp(48+number(field?.PO)/games*.3-errors/games*4);
 }else if(bat){
  const ab=number(bat.AB),avg=ab?number(bat.H)/ab:.23,pa=number(bat.PA)||ab||1,hr=number(bat.HR),bb=number(bat.BB),sb=number(bat.SB);
  r.contact=clamp(32+avg*115);r.power=clamp(36+hr*1.25);r.eye=clamp(35+bb/pa*210);r.speed=clamp(42+sb*.9);const chances=number(field?.PO)+number(field?.A),errors=number(field?.E),games=number(field?.G)||1;r.fielding=clamp(52+(chances/games-2.2)*4.5-errors/games*9);r.arm=clamp(46+number(field?.A)/games*.35);r.range=clamp(48+number(field?.PO)/games*.4-errors/games*5);
 }else{
  r.contact=45;r.power=42;r.eye=45;r.speed=45;r.fielding=clamp(50-number(field?.E)*1.5);
 }
 return r;
}
function appearances(bat,pit,field){return Math.max(number(bat?.G),number(pit?.G),number(field?.G));}
function historicalPlayer(profile,year,clubId,group){
 const bat=group.batting?.stats,pit=group.pitching?.stats,field=group.fielding?.stats;
 const isPitcher=!!pit&&(!bat||number(pit.GS)>0||number(pit.G)>=number(bat.G));
 const position=isPitcher?(number(pit?.GS)>0?"SP":"RP"):fieldPosition(group.fielding?[group.fielding]:[]);
 const country=profile?.country||"";
 return {
  id:"cpbl-"+year+"-"+group.playerId+"-"+clubId,
  sourcePlayerId:group.playerId,name:profile?.name||group.name,clubId,position,
  age:ageAt(profile,year),foreign:countryIsForeign(country),country:country||"未知",nationality:country||"未知",
  role:position==="SP"?"先發投手":position==="RP"?"後援投手":position==="C"?"捕手":position+" 野手",
  dataKind:"real",identityStatus:"verified",source:"CPBL Opendata · "+year+" 球季",
  sourceUrl:"https://github.com/ldkrsi/cpbl-opendata",confidence:.68,
  seasons:[year],historicalStats:{year,batting:bat||null,pitching:pit||null,fielding:field||null},
  ratings:ratingsFromStats(bat,pit,field),rosterLevel:"first",foreignMarketEligible:countryIsForeign(country)
 };
}
export function createHistoricalSeasonRoster(history,year,foreignLimit=4){
 const groups=new Map();
 for(const kind of ["batting","pitching","fielding"]){
  for(const line of history?.[kind]||[]){
   if(line.year!==Number(year)||!PLAYABLE.has(line.franchiseId))continue;
   const key=line.playerId+"|"+line.franchiseId;
   const group=groups.get(key)||{playerId:line.playerId,clubId:line.franchiseId,name:line.playerName};
   group[kind]=line;groups.set(key,group);
  }
 }
 const byClub=new Map(LEAGUE.clubs.map(c=>[c.id,[]]));
 for(const group of groups.values()){
  const profile=history.players?.[group.playerId]||{name:group.name};
  const p=historicalPlayer(profile,Number(year),group.clubId,group);
  byClub.get(group.clubId).push({...p,appearanceCount:appearances(group.batting?.stats,group.pitching?.stats,group.fielding?.stats)});
 }
 const players=[],minorLeague=[],usedNames=new Set();
 for(const club of LEAGUE.clubs){
  const candidates=(byClub.get(club.id)||[]).sort((a,b)=>b.appearanceCount-a.appearanceCount);
  let foreign=0,first=[];
  for(const p of candidates){
   if(p.foreign&&foreign>=foreignLimit){minorLeague.push({...p,rosterLevel:"minor",minorReason:"一軍洋將名額限制"});continue;}
   if(p.foreign)foreign++;
   if(first.length<30)first.push(p);
   else minorLeague.push({...p,rosterLevel:"minor",minorReason:"歷史年度名單深度"});
  }
  players.push(...first);
  const positions=["C","C","1B","2B","3B","SS","LF","CF","RF","OF","DH","OF","SP","SP","SP","SP","SP","RP","RP","RP","RP","RP","RP","RP","RP","RP"];
  let index=0;
  while(first.length<26){
   const position=positions[index%positions.length],id="fictional-"+year+"-"+club.id+"-"+String(index+1).padStart(3,"0");
   const p=generateFictionalPlayer({id,clubId:club.id,position,seed:year+"|"+club.id+"|"+index,country:"TW",rosterLevel:"first"});
   while(usedNames.has(p.name)){index++;p.name=generateFictionalPlayer({id:id+"-"+index,clubId:club.id,position,seed:year+"|"+club.id+"|"+index,country:"TW"}).name;}
   usedNames.add(p.name);players.push(p);first.push(p);index++;
  }
 }
 return {players,minorLeague,realCount:players.filter(p=>p.dataKind==="real").length,fictionalCount:players.filter(p=>p.dataKind==="fictional").length};
}
export function buildHistoricalForeignMarket(history,year,activePlayers=[],seed=2026,userClubId=null){
 const activeIds=new Set(activePlayers.filter(p=>!userClubId||p.clubId===userClubId).map(p=>p.sourcePlayerId).filter(Boolean));
 const grouped=new Map();
 for(const kind of ["batting","pitching","fielding"]){
  for(const line of history?.[kind]||[]){
   if(line.year>Number(year))continue;
   const profile=history.players?.[line.playerId];
   if(!profile||!countryIsForeign(profile.country))continue;
   const key=line.playerId+"|"+line.year+"|"+line.franchiseId;
   const group=grouped.get(key)||{playerId:line.playerId,year:line.year,clubId:line.franchiseId,name:line.playerName};
   group[kind]=line;grouped.set(key,group);
  }
 }
 const latest=new Map();
 for(const g of grouped.values()){
  const prior=latest.get(g.playerId);
  if(!prior||g.year>prior.year)latest.set(g.playerId,g);
 }
 const real=[];
 for(const g of latest.values()){
  if(activeIds.has(g.playerId))continue;
  const profile=history.players[g.playerId],p=historicalPlayer(profile,g.year,null,g);
  p.id="foreign-real-"+g.playerId;p.clubId=null;p.rosterLevel="market";p.contractStatus="free-agent";
  const careerYears=(profile.seasons||[]).map(Number).filter(y=>y<=Number(year));
  const debut=careerYears.length?Math.min(...careerYears):g.year;
  p.marketEra=Math.floor(debut/10)*10;p.marketSeason=g.year;
  p.careerSeasons=careerYears.length;
  p.careerGames=[...(history.batting||[]),...(history.pitching||[])].filter(x=>x.playerId===g.playerId&&x.year<=Number(year)).reduce((sum,x)=>sum+number(x.stats?.G),0);
  p.source="CPBL Opendata · "+g.year+" 球季歷史成績";
  real.push(p);
 }
 const used=new Set(real.map(p=>p.name)),fictional=[];
 const countries=["US","DOM","VEN","PR","CUB","JPN","KOR","MEX","PAN","COL"];
 for(let i=0;i<36;i++){
  const country=countries[i%countries.length],position=["SP","RP","SP","CF","1B","SS","RP","C"][i%8],id="foreign-fictional-"+seed+"-"+i;
  const p=generateFictionalPlayer({id,clubId:null,position,seed:seed+"|market|"+i,country,age:23+(i%13),rosterLevel:"market"});
  if(used.has(p.name))p.name=generateFictionalPlayer({id:id+"-unique",seed:seed+"|unique",country}).name;
  used.add(p.name);p.contractStatus="free-agent";p.marketEra=Math.floor(Number(year)/10)*10;p.marketSeason=Number(year);p.source="虛構國際洋將市場";p.confidence=0;fictional.push(p);
 }
 return [...real.sort((a,b)=>(b.careerSeasons||0)-(a.careerSeasons||0)||(b.careerGames||0)-(a.careerGames||0)),...fictional].sort((a,b)=>(b.dataKind==="real")-(a.dataKind==="real")||(b.careerSeasons||0)-(a.careerSeasons||0)||(b.careerGames||0)-(a.careerGames||0)||a.name.localeCompare(b.name));
}
