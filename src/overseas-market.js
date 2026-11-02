import { estimatePlayerAbility } from "./rules.js";
const clamp=(n,a=1,b=99)=>Math.max(a,Math.min(b,n));
const MLB_SOURCE="https://www.baseball-reference.com/leagues/majors/2026-batting-leaders.shtml";
const NPB_SOURCE="https://en.baseball-data.jp/stats/batting/";
const KBO_SOURCE="https://eng.koreabaseball.com/stats/BattingLeaders.aspx";
const row=(id,name,english,league,team,country,position,age,stats,defense,arm,range,marketDemand,sourceUrl)=>({id:"overseas-"+id,name,english,league,team,country,position,age,season:2026,stats,defense,arm,range,marketDemand,sourceUrl});
const PROSPECTS=[
 row("ohtani","大谷翔平","Shohei Ohtani","MLB","Los Angeles Dodgers","日本","DH",32,{G:135,PA:618,AB:523,H:144,HR:30,RBI:81,SB:11,BB:81,SO:152,AVG:.275,OBP:.377,SLG:.512,OPS:.889},68,82,72,420000000,MLB_SOURCE),
 row("harper","Bryce Harper","Bryce Harper","MLB","Philadelphia Phillies","美國","1B",34,{G:162,PA:693,AB:577,H:155,HR:29,RBI:87,SB:7,BB:107,SO:148,AVG:.269,OBP:.380,SLG:.485,OPS:.865},72,78,65,175000000,MLB_SOURCE),
 row("schwarber","Kyle Schwarber","Kyle Schwarber","MLB","Philadelphia Phillies","美國","DH",33,{G:156,PA:701,AB:581,H:135,HR:45,RBI:97,SB:3,BB:105,SO:220,AVG:.232,OBP:.365,SLG:.524,OPS:.889},55,70,48,190000000,MLB_SOURCE),
 row("crow-armstrong","Pete Crow-Armstrong","Pete Crow-Armstrong","MLB","Chicago Cubs","美國","CF",24,{G:162,PA:726,AB:626,H:175,HR:45,RBI:107,SB:41,BB:72,SO:187,AVG:.280,OBP:.343,SLG:.600,OPS:.943},96,91,98,210000000,MLB_SOURCE),
 row("alonso","Pete Alonso","Pete Alonso","MLB","Baltimore Orioles","美國","1B",31,{G:161,PA:700,AB:602,H:161,HR:43,RBI:113,SB:5,BB:83,SO:158,AVG:.267,OBP:.355,SLG:.529,OPS:.884},70,73,62,180000000,MLB_SOURCE),
 row("caminero","Junior Caminero","Junior Caminero","MLB","Tampa Bay Rays","多明尼加","3B",23,{G:162,PA:702,AB:616,H:170,HR:42,RBI:101,SB:3,BB:68,SO:139,AVG:.276,OBP:.361,SLG:.524,OPS:.885},78,88,76,230000000,MLB_SOURCE),
 row("yordan","Yordan Alvarez","Yordan Alvarez","MLB","Houston Astros","古巴","DH",29,{G:158,PA:692,AB:567,H:179,HR:42,RBI:106,SB:1,BB:109,SO:130,AVG:.316,OBP:.432,SLG:.601,OPS:1.033},60,72,55,240000000,MLB_SOURCE),
 row("olson","Matt Olson","Matt Olson","MLB","Atlanta Braves","美國","1B",32,{G:162,PA:690,AB:590,H:151,HR:41,RBI:98,SB:1,BB:82,SO:169,AVG:.256,OBP:.348,SLG:.520,OPS:.868},85,84,77,160000000,MLB_SOURCE),
 row("devers","Rafael Devers","Rafael Devers","MLB","San Francisco Giants","多明尼加","3B",30,{G:155,PA:670,AB:574,H:151,HR:37,RBI:98,SB:2,BB:83,SO:155,AVG:.263,OBP:.356,SLG:.525,OPS:.881},68,79,64,175000000,MLB_SOURCE),
 row("murakami","村上宗隆","Munetaka Murakami","MLB","Chicago White Sox","日本","3B",26,{G:125,PA:520,AB:445,H:105,HR:35,RBI:82,SB:2,BB:65,SO:196,AVG:.236,OBP:.337,SLG:.510,OPS:.847},65,82,58,145000000,MLB_SOURCE),
 row("sato","佐藤輝明","Teruaki Sato","NPB","阪神虎","日本","3B",27,{G:143,PA:614,AB:539,H:165,HR:39,RBI:106,SB:8,BB:68,SO:164,AVG:.306,OBP:.383,SLG:.609,OPS:.992},74,83,72,85000000,NPB_SOURCE),
 row("maki","牧秀悟","Shugo Maki","NPB","橫濱 DeNA 海灣之星","日本","2B",28,{G:108,PA:474,AB:420,H:119,HR:30,RBI:75,SB:2,BB:41,SO:85,AVG:.283,OBP:.363,SLG:.564,OPS:.927},78,74,75,65000000,NPB_SOURCE),
 row("kondo","近藤健介","Kensuke Kondo","NPB","福岡軟銀鷹","日本","LF",33,{G:147,PA:634,AB:514,H:158,HR:32,RBI:110,SB:2,BB:105,SO:72,AVG:.307,OBP:.429,SLG:.557,OPS:.986},82,73,70,80000000,NPB_SOURCE),
 row("morishita","森下翔太","Shota Morishita","NPB","阪神虎","日本","RF",26,{G:146,PA:630,AB:533,H:155,HR:37,RBI:86,SB:3,BB:76,SO:95,AVG:.291,OBP:.395,SLG:.562,OPS:.957},84,86,82,78000000,NPB_SOURCE),
 row("yamaguchi","山口航輝","Koki Yamaguchi","NPB","千葉羅德海洋","日本","RF",26,{G:113,PA:448,AB:405,H:114,HR:38,RBI:81,SB:1,BB:34,SO:112,AVG:.277,OBP:.329,SLG:.602,OPS:.931},70,85,69,62000000,NPB_SOURCE),
 row("reyes","弗蘭米爾·雷耶斯","Franmil Reyes","NPB","北海道日本火腿鬥士","多明尼加","DH",31,{G:134,PA:555,AB:498,H:154,HR:32,RBI:82,SB:1,BB:48,SO:112,AVG:.309,OBP:.371,SLG:.556,OPS:.927},58,72,52,70000000,NPB_SOURCE),
 row("kurihara","栗原陵矢","Ryoya Kurihara","NPB","福岡軟銀鷹","日本","1B",30,{G:150,PA:662,AB:560,H:152,HR:41,RBI:122,SB:0,BB:75,SO:116,AVG:.270,OBP:.368,SLG:.551,OPS:.920},79,81,73,82000000,NPB_SOURCE),
 row("masaki","正木智也","Tomoya Masaki","NPB","福岡軟銀鷹","日本","LF",27,{G:108,PA:512,AB:437,H:123,HR:31,RBI:65,SB:2,BB:60,SO:94,AVG:.281,OBP:.379,SLG:.531,OPS:.910},74,77,72,58000000,NPB_SOURCE),
 row("nishikawa","西川龍馬","Ryoma Nishikawa","NPB","歐力士猛牛","日本","LF",32,{G:143,PA:612,AB:573,H:155,HR:13,RBI:54,SB:1,BB:31,SO:33,AVG:.271,OBP:.309,SLG:.393,OPS:.702},81,70,77,48000000,NPB_SOURCE),
 row("hosokawa","細川成也","Seiya Hosokawa","NPB","中日龍","日本","RF",28,{G:143,PA:604,AB:499,H:113,HR:25,RBI:71,SB:3,BB:92,SO:155,AVG:.226,OBP:.354,SLG:.417,OPS:.771},75,87,73,52000000,NPB_SOURCE),
 row("kim-doyoung","金倒永","Kim Do-yeong","KBO","起亞虎","韓國","3B",23,{G:135,PA:593,AB:496,H:153,HR:45,RBI:118,SB:11,BB:85,SO:103,AVG:.308,OBP:.413,SLG:.647,OPS:1.060},82,79,88,110000000,KBO_SOURCE),
 row("koo","具滋昱","Koo Ja-wook","KBO","三星獅","韓國","LF",33,{G:114,PA:497,AB:420,H:156,HR:15,RBI:102,SB:6,BB:65,SO:72,AVG:.371,OBP:.438,SLG:.581,OPS:1.019},82,78,80,68000000,KBO_SOURCE),
 row("victor-reyes","維克多·雷耶斯","Victor Reyes","KBO","樂天巨人","委內瑞拉","CF",31,{G:144,PA:636,AB:582,H:211,HR:18,RBI:109,SB:1,BB:44,SO:78,AVG:.363,OBP:.405,SLG:.527,OPS:.932},76,82,78,72000000,KBO_SOURCE),
 row("choi-wonjun","崔元俊","Choi Won-jun","KBO","KT巫師","韓國","CF",29,{G:140,PA:676,AB:585,H:208,HR:9,RBI:74,SB:28,BB:70,SO:88,AVG:.356,OBP:.421,SLG:.485,OPS:.906},88,79,91,60000000,KBO_SOURCE),
 row("austin-dean","奧斯汀·迪恩","Austin Dean","KBO","LG雙子","美國","1B",33,{G:144,PA:640,AB:543,H:180,HR:41,RBI:127,SB:5,BB:80,SO:121,AVG:.331,OBP:.420,SLG:.635,OPS:1.055},76,82,70,105000000,KBO_SOURCE),
 row("park-seonghan","朴成韓","Park Seong-han","KBO","SSG登陸者","韓國","SS",28,{G:144,PA:627,AB:530,H:175,HR:5,RBI:71,SB:5,BB:78,SO:90,AVG:.330,OBP:.410,SLG:.425,OPS:.835},91,83,93,62000000,KBO_SOURCE),
 row("park-minwoo","朴旻宇","Park Min-woo","KBO","NC恐龍","韓國","2B",33,{G:138,PA:561,AB:484,H:155,HR:7,RBI:72,SB:50,BB:63,SO:61,AVG:.320,OBP:.405,SLG:.450,OPS:.855},88,75,90,65000000,KBO_SOURCE),
 row("kim-jichan","金智燦","Kim Ji-chan","KBO","三星獅","韓國","2B",25,{G:134,PA:530,AB:448,H:141,HR:0,RBI:38,SB:22,BB:62,SO:48,AVG:.315,OBP:.405,SLG:.359,OPS:.764},87,72,96,54000000,KBO_SOURCE),
 row("kim-minseok","金珉奭","Kim Min-seok","KBO","斗山熊","韓國","CF",27,{G:135,PA:519,AB:455,H:141,HR:5,RBI:57,SB:3,BB:52,SO:72,AVG:.310,OBP:.380,SLG:.404,OPS:.784},83,77,85,50000000,KBO_SOURCE),
 row("han-donghui","韓東熙","Han Dong-hee","KBO","樂天巨人","韓國","3B",27,{G:109,PA:461,AB:412,H:126,HR:25,RBI:81,SB:1,BB:42,SO:93,AVG:.306,OBP:.376,SLG:.568,OPS:.944},73,84,70,60000000,KBO_SOURCE)
];
const LEAGUE_STRENGTH={MLB:{bonus:8,power:1.75,avg:.018,ops:.035},NPB:{bonus:5,power:1.28,avg:.012,ops:.025},KBO:{bonus:2,power:1.18,avg:.01,ops:.02}};
function projectCPBLSeason(p){
 const s=p.stats,pa=Math.max(1,s.PA||s.AB||1),f=LEAGUE_STRENGTH[p.league];
 const projectedPA=600,hr=Math.round((s.HR||0)/pa*projectedPA*f.power);
 const battingAverage=Number(((s.AVG??.25)+f.avg).toFixed(3));
 const projectedAB=Math.round(projectedPA*.88),hits=Math.round(battingAverage*projectedAB);
 const obp=Number(Math.min(.52,(s.OBP??.32)+f.ops*.55).toFixed(3));
 const slg=Number(Math.min(.8,(s.SLG??.4)+f.ops*1.25).toFixed(3));
 const ops=Number((obp+slg).toFixed(3));
 const sb=Math.round((s.SB||0)/pa*projectedPA*1.08);
 const rbi=Math.round((s.RBI||0)/pa*projectedPA*f.power);
 return {G:120,PA:projectedPA,AB:projectedAB,H:hits,HR:hr,RBI:rbi,SB:sb,AVG:battingAverage,OBP:obp,SLG:slg,OPS:ops};
}
function estimateRatings(p,projection){
 const s=p.stats,pa=Math.max(1,s.PA||s.AB||1),bonus=LEAGUE_STRENGTH[p.league].bonus;
 const contact=clamp(82+(projection.AVG-.25)*180+bonus*.35);
 const power=clamp(80+(projection.HR-25)*.55+bonus*.45);
 const eye=clamp(80+(projection.OBP-.33)*150+bonus*.35);
 const avoidK=clamp(90-Math.max(0,(s.SO||0)/pa-.15)*100+bonus*.2);
 const projectedSB=projection.SB;
 const speed=clamp(70+projectedSB*.8+bonus*.25),stealing=clamp(68+projectedSB*.9+bonus*.25);
 return {contact:Math.round(contact),power:Math.round(power),eye:Math.round(eye),avoidK:Math.round(avoidK),speed:Math.round(speed),stealing:Math.round(stealing),fielding:clamp(p.defense+bonus*.2),arm:clamp(p.arm+bonus*.2),range:clamp(p.range+bonus*.2)};
}
function estimateCPBLOverall(p,projection){
 return Math.round(clamp(75+(projection.HR-20)*.5+(projection.OPS-.7)*20+(projection.AVG-.25)*40+LEAGUE_STRENGTH[p.league].bonus,70,99));
}
export function createOverseasMarket(){
 return PROSPECTS.map(p=>{
  const projectedCPBLStats=projectCPBLSeason(p),ratings=estimateRatings(p,projectedCPBLStats);
  const estimatedCPBLAbility=estimateCPBLOverall(p,projectedCPBLStats);
  return {...p,clubId:null,foreign:true,nationality:p.country,dataKind:"real",identityStatus:"verified",confidence:.9,source:"2026 "+p.league+" 公開打擊數據換算；CPBL 成績為 600 PA 情境推估，聯盟加成為遊戲平衡參數，守備／臂力／範圍為遊戲估值",externalStats:{...p.stats},projectedCPBLStats,ratings,estimatedCPBLAbility,leagueStrengthBonus:LEAGUE_STRENGTH[p.league].bonus,marketDemand:p.marketDemand,rosterLevel:"market",marketType:"overseas"};
 });
}
export const OVERSEAS_MARKET_PROFILES=PROSPECTS.map(p=>({id:p.id,name:p.name,league:p.league,season:p.season,source:p.sourceUrl}));
