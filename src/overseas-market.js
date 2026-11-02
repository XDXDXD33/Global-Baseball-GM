import { estimatePlayerAbility } from "./rules.js";
const clamp=(n,a=1,b=99)=>Math.max(a,Math.min(b,n));
const PROSPECTS=[
 {id:"overseas-ohtani",name:"大谷翔平",english:"Shohei Ohtani",league:"MLB",team:"Los Angeles Dodgers",country:"日本",position:"DH",age:32,season:2026,stats:{G:135,PA:618,AB:523,H:144,HR:30,RBI:81,SB:11,BB:81,SO:152,AVG:.275,OBP:.377,SLG:.512,OPS:.889},defense:68,arm:82,range:72,marketDemand:420000000,source:"https://www.mlb.com/player/shohei-ohtani-660271"},
 {id:"overseas-harper",name:"Bryce Harper",english:"Bryce Harper",league:"MLB",team:"Philadelphia Phillies",country:"美國",position:"1B",age:34,season:2026,stats:{G:162,PA:693,AB:577,H:155,HR:29,RBI:87,SB:7,BB:107,SO:148,AVG:.269,OBP:.384,SLG:.485,OPS:.869},defense:72,arm:78,range:65,marketDemand:175000000,source:"https://baseballsavant.mlb.com/savant-player/bryce-harper-547180"},
 {id:"overseas-sato",name:"佐藤輝明",english:"Teruaki Sato",league:"NPB",team:"阪神虎",country:"日本",position:"3B",age:27,season:2026,stats:{G:143,PA:614,AB:539,H:165,HR:39,RBI:106,SB:8,BB:68,SO:164,AVG:.306,OBP:.383,SLG:.609,OPS:.992},defense:74,arm:83,range:72,marketDemand:85000000,source:"https://npb.jp/bis/eng/players/41045153.html"},
 {id:"overseas-maki",name:"牧秀悟",english:"Shugo Maki",league:"NPB",team:"橫濱 DeNA 海灣之星",country:"日本",position:"2B",age:28,season:2026,stats:{G:108,PA:474,AB:420,H:119,HR:30,RBI:75,SB:2,BB:41,SO:85,AVG:.283,OBP:.363,SLG:.564,OPS:.927},defense:78,arm:74,range:75,marketDemand:65000000,source:"https://npb.jp/bis/eng/players/13115153.html"},
 {id:"overseas-kim",name:"金倒永",english:"Kim Do-yeong",league:"KBO",team:"起亞虎",country:"韓國",position:"3B",age:23,season:2026,stats:{G:122,PA:533,AB:447,H:137,HR:40,RBI:99,SB:10,BB:76,SO:90,AVG:.306,OBP:.411,SLG:.635,OPS:1.046},defense:82,arm:79,range:88,marketDemand:110000000,source:"https://www.koreabaseball.com/Record/Retire/Hitter.aspx?playerId=52605"}
];
function estimateRatings(p){
 const s=p.stats,pa=Math.max(1,s.PA||s.AB||1),avg=s.AVG??(s.AB?s.H/s.AB:.25),ops=s.OPS??((s.OBP||.32)+(s.SLG||.4)),hrRate=(s.HR||0)/pa;
 const scale={MLB:1,NPB:.94,KBO:.91}[p.league]||.9;
 const contact=clamp(44+(avg-.25)*190*scale),power=clamp(45+(ops-.7)*100+hrRate*160),eye=clamp(43+((s.BB||0)/pa)*190+((s.OBP||.32)-.32)*55),speed=clamp(45+(s.SB||0)*.7+(p.league==="KBO"?2:0));
 const avoidK=clamp(72-((s.SO||0)/pa)*95);
 // Public season batting lines do not provide a consistent cross-league defensive metric.
 // Fielding, arm and range are scouting estimates, not official grades.
 return {contact:Math.round(contact),power:Math.round(power),eye:Math.round(eye),avoidK:Math.round(avoidK),speed:Math.round(speed),stealing:Math.round(clamp(40+(s.SB||0)*1.1)),fielding:p.defense,arm:p.arm,range:p.range};
}
export function createOverseasMarket(){
 return PROSPECTS.map(p=>{const ratings=estimateRatings(p);return {...p,clubId:null,foreign:true,nationality:p.country,country:p.country,dataKind:"real",identityStatus:"verified",confidence:.9,source:"海外聯賽 "+p.season+" 球季公開成績換算；守備／臂力／範圍為遊戲估值",sourceUrl:p.source,externalStats:{...p.stats},ratings,marketDemand:p.marketDemand,rosterLevel:"market",marketType:"overseas",estimatedCPBLAbility:Math.round(estimatePlayerAbility({position:p.position,ratings}))};});
}
export const OVERSEAS_MARKET_PROFILES=PROSPECTS.map(p=>({id:p.id,name:p.name,league:p.league,season:p.season,source:p.source}));
