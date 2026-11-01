export const LEAGUE = { id: "cpbl", name: "中華職棒", season: 2026, clubs: [
  {id:"brothers",name:"中信兄弟",short:"兄弟",code:"兄",city:"臺中",color:"#e7b83f"},
  {id:"lions",name:"統一7-ELEVEn獅",short:"統一獅",code:"獅",city:"臺南",color:"#e5a52e"},
  {id:"guardians",name:"富邦悍將",short:"富邦",code:"悍",city:"新北",color:"#4d9bd7"},
  {id:"monkeys",name:"樂天桃猿",short:"樂天",code:"猿",city:"桃園",color:"#c84d67"},
  {id:"dragons",name:"味全龍",short:"味全",code:"龍",city:"臺北",color:"#d94b4b"},
  {id:"hawks",name:"台鋼雄鷹",short:"台鋼",code:"鷹",city:"高雄",color:"#54a98a"}
]};

// These are intentionally fictional placeholders, never presented as real CPBL athletes.
export const DEMO_PLAYERS = [
  {id:"demo-001",name:"示範球員 01",clubId:"brothers",position:"SP",age:25,role:"先發投手",ratings:{velocity:62,control:54,movement:57,stamina:61},foreign:false},
  {id:"demo-002",name:"示範球員 02",clubId:"brothers",position:"C",age:27,role:"捕手",ratings:{contact:51,power:48,eye:53,fielding:60},foreign:false},
  {id:"demo-003",name:"示範球員 03",clubId:"lions",position:"CF",age:23,role:"中外野手",ratings:{contact:57,power:46,speed:65,fielding:58},foreign:false},
  {id:"demo-004",name:"示範球員 04",clubId:"lions",position:"RP",age:29,role:"中繼投手",ratings:{velocity:66,control:49,movement:55,stamina:42},foreign:false},
  {id:"demo-005",name:"示範球員 05",clubId:"guardians",position:"1B",age:28,role:"一壘手",ratings:{contact:53,power:62,eye:56,fielding:45},foreign:false},
  {id:"demo-006",name:"示範球員 06",clubId:"guardians",position:"SP",age:26,role:"先發投手",ratings:{velocity:59,control:61,movement:60,stamina:63},foreign:false},
  {id:"demo-007",name:"示範球員 07",clubId:"monkeys",position:"SS",age:22,role:"游擊手",ratings:{contact:55,power:43,speed:61,fielding:64},foreign:false},
  {id:"demo-008",name:"示範球員 08",clubId:"monkeys",position:"DH",age:30,role:"指定打擊",ratings:{contact:58,power:67,eye:52,fielding:30},foreign:false},
  {id:"demo-009",name:"示範球員 09",clubId:"dragons",position:"SP",age:24,role:"先發投手",ratings:{velocity:64,control:57,movement:53,stamina:60},foreign:false},
  {id:"demo-010",name:"示範球員 10",clubId:"dragons",position:"RF",age:27,role:"右外野手",ratings:{contact:54,power:59,speed:52,fielding:55},foreign:false},
  {id:"demo-011",name:"示範球員 11",clubId:"hawks",position:"2B",age:23,role:"二壘手",ratings:{contact:56,power:44,speed:60,fielding:57},foreign:false},
  {id:"demo-012",name:"示範球員 12",clubId:"hawks",position:"SP",age:26,role:"先發投手",ratings:{velocity:61,control:58,movement:62,stamina:64},foreign:false}
];

export const RATING_LABELS = {contact:"Contact",power:"Power",eye:"Eye",speed:"Speed",fielding:"守備",velocity:"球速",control:"控球",movement:"變化",stamina:"體力"};
