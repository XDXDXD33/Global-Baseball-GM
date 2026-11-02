import { estimatePlayerAbility } from "./rules.js";
const clamp=(n,a=1,b=99)=>Math.max(a,Math.min(b,n));
const PROSPECTS=[
 {id:"overseas-ohtani",name:"大谷翔平",english:"Shohei Ohtani",league:"MLB",team:"Los Angeles Dodgers",country:"日本",position:"DH",age:32,season:2026,stats:{G:135,PA:618,AB:523,H:144,HR:30,RBI:81,SB:11,BB:81,SO:152,AVG:.275,OBP:.377,SLG:.512,OPS:.889},defense:68,arm:82,range:72,marketDemand:420000000,source:"https://www.mlb.com/player/shohei-ohtani-660271"},
 {id:"overseas-harper",name:"Bryce Harper",english:"Bryce Harper",league:"MLB",team:"Philadelphia Phillies",country:"美國",position:"1B",age:34,season:2026,stats:{G:162,PA:693,AB:577,H:155,HR:29,RBI:87,SB:7,BB:107,SO:148,AVG:.269,OBP:.380,SLG:.485,OPS:.865},defense:72,arm:78,range:65,marketDemand:175000000,source:"https://baseballsavant.mlb.com/savant-player/bryce-harper-547180"},
 {id:"overseas-sato",name:"佐藤輝明",english:"Teruaki Sato",league:"NPB",team:"阪神虎",country:"日本",position:"3B",age:27,season:2026,stats:{G:143,PA:614,AB:539,H:165,HR:39,RBI:106,SB:8,BB:68,SO:164,AVG:.306,OBP:.383,SLG:.609,OPS:.992},defense:74,arm:83,range:72,marketDemand:85000000,source:"https://npb.jp/bis/eng/players/41045153.html"},
 {id:"overseas-maki",name:"牧秀悟",english:"Shugo Maki",league:"NPB",team:"橫濱 DeNA 海灣之星",country:"日本",position:"2B",age:28,season:2026,stats:{G:108,PA:474,AB:420,H:119,HR:30,RBI:75,SB:2,BB:41,SO:85,AVG:.283,OBP:.363,SLG:.564,OPS:.927},defense:78,arm:74,range:75,marketDemand:65000000,source:"https://npb.jp/bis/eng/players/13115153.html"},
 {id:"overseas-kim",name:"金倒永",english:"Kim Do-yeong",league:"KBO",team:"起亞虎",country:"韓國",position:"3B",age:23,season:2026,stats:{G:135,PA:593,AB:496,H:153,HR:45,RBI:118,SB:11,BB:85,SO:103,AVG:.308,OBP:.413,SLG:.647,OPS:1.060},defense:82,arm:79,range:88,marketDemand:110000000,source:"https://www.koreabaseball.com/Record/Retire/Hitter.aspx?playerId=52605"}
];

// Translate each league's production into an estimated 600-PA CPBL season.
// These are game-balance estimates, not claims that a player would certainly
// reproduce the projected line after changing leagues.
const CPBL_TRANSLATION={MLB:{power:1.75,avg:.018,ops:.035},NPB:{power:1.28,avg:.012,ops:.025},KBO:{power:1.18,avg:.01,ops:.02}};
function projectCPBLSeason(p){
 const s=p.stats,pa=Math.max(1,s.PA||s.AB||1),f=CPBL_TRANSLATION[p.league]||{power:1.1,avg:.008,ops:.015};
 const projectedPA=600,hr=Math.round((s.HR||0)/pa*projectedPA*f.power);
 const battingAverage=Number(((s.AVG??.25)+f.avg).toFixed(3));
 const projectedAB=Math.round(projectedPA*.88);
 const hits=Math.round(battingAverage*projectedAB);
 const obp=Number(Math.min(.52,(s.OBP??.32)+f.ops*.55).toFixed(3));
 const slg=Number(Math.min(.8,(s.SLG??.4)+f.ops*1.25).toFixed(3));
 const ops=Number((obp+slg).toFixed(3));
 const sb=Math.round((s.SB||0)/pa*projectedPA*1.08);
 const rbi=Math.round((s.RBI||0)/pa*projectedPA*f.power);
 return {G:120,PA:projectedPA,AB:projectedAB,H:hits,HR:hr,RBI:rbi,SB:sb,AVG:battingAverage,OBP:obp,SLG:slg,OPS:ops};
}
function estimateRatings(p,projection){
 const s=p.stats,pa=Math.max(1,s.PA||s.AB||1),hr=projection.HR;
 const contact=clamp(82+(projection.AVG-.25)*180);
 const power=clamp(80+(hr-25)*.55);
 const eye=clamp(80+(projection.OBP-.33)*150);
 const avoidK=clamp(90-Math.max(0,(s.SO||0)/pa-.15)*100);
 const projectedSB=projection.SB;
 const speed=clamp(70+projectedSB*.8),stealing=clamp(68+projectedSB*.9);
 // Defensive grades remain scouting estimates; hitting grades reflect the translated CPBL projection.
 return {contact:Math.round(contact),power:Math.round(power),eye:Math.round(eye),avoidK:Math.round(avoidK),speed:Math.round(speed),stealing:Math.round(stealing),fielding:p.defense,arm:p.arm,range:p.range};
}
function estimateCPBLOverall(p,projection){
 // 20 HR is already elite in the current CPBL environment. A 50-HR projection
 // therefore belongs in the 90+ superstar tier, not the ordinary-import tier.
 return Math.round(clamp(75+(projection.HR-20)*.5+(projection.OPS-.7)*20+(projection.AVG-.25)*40,70,99));
}
export function createOverseasMarket(){
 return PROSPECTS.map(p=>{
  const projectedCPBLStats=projectCPBLSeason(p),ratings=estimateRatings(p,projectedCPBLStats);
  const estimatedCPBLAbility=estimateCPBLOverall(p,projectedCPBLStats);
  return {...p,clubId:null,foreign:true,nationality:p.country,dataKind:"real",identityStatus:"verified",confidence:.9,source:"海外聯賽 "+p.season+" 球季公開成績換算；CPBL 成績為 600 PA 情境推估，守備／臂力／範圍為遊戲估值",sourceUrl:p.source,externalStats:{...p.stats},projectedCPBLStats,ratings,estimatedCPBLAbility,marketDemand:p.marketDemand,rosterLevel:"market",marketType:"overseas"};
 });
}
export const OVERSEAS_MARKET_PROFILES=PROSPECTS.map(p=>({id:p.id,name:p.name,league:p.league,season:p.season,source:p.source}));
