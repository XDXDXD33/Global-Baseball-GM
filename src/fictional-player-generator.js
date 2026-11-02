const DATA = {
  TW: { country:"台灣", first:["承恩","冠宇","柏翰","子翔","昱廷","俊豪","家豪","宇軒","品睿","奕辰","哲瑋","彥廷","凱翔","皓宇","承翰","宥廷","柏廷","志豪","冠廷","俊傑","明哲","宗翰","育成","政賢","偉傑","嘉豪","信宏","建宏","俊宏","宗憲","立群","文傑","承哲","品安","宇翔","睿哲","彥博","秉勳","冠霖","柏丞","昀儒","子維","家慶","廷恩","恩宇","奕翔","彥均","哲宇","俊廷","冠勳"], last:["陳","林","黃","張","李","王","吳","劉","蔡","楊","周","鄭","許","謝","郭","洪","曾","邱","廖","賴","徐","傅","葉","蘇","莊","呂","江","何","蕭","羅","高","簡","朱","鍾","彭","游","詹","胡","施","沈","余","盧","梁","趙","顏","柯","翁","魏","孫","戴"] },
  US: { country:"美國", first:["James","Michael","William","Daniel","Matthew","Andrew","Joseph","Christopher","David","Robert","Thomas","Ryan","Brandon","Tyler","Justin","Anthony","Jonathan","Nicholas","Cameron","Logan","Ethan","Noah","Liam","Mason","Hunter","Austin","Jordan","Dylan","Evan","Cole","Aaron","Patrick","Samuel","Nathan","Lucas","Jack","Caleb","Connor","Gavin","Owen","Wyatt","Blake","Chase","Ian","Trevor","Garrett","Austin","Derek","Eric","Kyle"], last:["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Garcia","Rodriguez","Wilson","Martinez","Anderson","Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White","Lopez","Lee","Gonzalez","Harris","Clark","Lewis","Robinson","Walker","Perez","Hall","Young","Allen","Sanchez","Wright","King","Scott","Green","Baker","Adams","Nelson","Hill","Ramirez","Campbell","Mitchell","Roberts","Carter","Phillips","Evans","Turner","Torres"] },
  DOM: { country:"多明尼加", first:["Juan","José","Luis","Carlos","Miguel","Pedro","Rafael","Francisco","José","Ángel","Fernando","Jorge","Adrián","Manuel","Julio","Erick","Wander","Ronald","Junior","Yermín","Dawel","Johan","Víctor","Enmanuel","Ramón","Nelson","Alex","Starling","Robinson","Héctor","Darío","Kelvin","Anderson","Cristian","Eury","Esmil","Jairo","Leury","Melky","Tony"], last:["Díaz","Soto","Hernández","Ramírez","Rodríguez","Martínez","García","Pérez","Gómez","Reyes","Cruz","Castillo","Rojas","Sánchez","Méndez","Núñez","Torres","López","Peña","Jiménez","Guzmán","Rosario","Vásquez","Valdez","Almonte","Polanco","Bautista","Cabrera","Matos","Mercedes","Encarnación","Franco","Abreu","Adames","Arias","De la Cruz","Santana","Molina","Liriano","Taveras"] },
  VEN: { country:"委內瑞拉", first:["José","Luis","Carlos","Miguel","Andrés","Eduardo","Freddy","Héctor","Franklin","Jesús","Wilfredo","Endy","Alex","Ronald","Oswaldo","Rafael","Jorge","Gorkys","Yangervis","Renato","Maikel","Eliézer","Víctor","Gabriel","Ángel","César","Robert","Orlando","Wilmer","Jhonny"], last:["González","Rodríguez","Pérez","García","Hernández","Martínez","López","Ramos","Flores","Suárez","Torres","Castillo","Acosta","Chávez","Gómez","Rojas","Díaz","Mendoza","Silva","Vásquez","Ortega","Pinto","Escobar","Pacheco","Gutiérrez","Sánchez","Paredes","Márquez","Blanco","Urbina","Carrasco","Guerra","León","Acuña","Méndez","Moreno"] },
  PR: { country:"波多黎各", first:["Carlos","José","Luis","Javier","Alex","Yadier","Edwin","Carlos","Juan","Francisco","Christian","Héctor","José","Roberto","Luis","Iván","Orlando","Jorge","Gabriel","Fernando","Raúl","Ángel","Miguel","Pedro","Víctor"], last:["Rivera","Vázquez","Maldonado","Martínez","Rodríguez","Pérez","García","López","Santiago","Torres","Ortiz","Ramos","Cruz","Díaz","Sánchez","Molina","Feliciano","Báez","Rosario","Hernández","González","Colón","Otero","Ríos","Burgos","Delgado","Mercado","Pagan","Reyes","Acevedo"] },
  CUB: { country:"古巴", first:["José","Yuniesky","Yulieski","Frederich","Alfredo","Alexander","Michel","Dayán","Yasiel","Yoennis","Omar","Erisbel","Yurisbel","Ariel","Raúl","Yordan","Lázaro","Rogelio","Misael","Yosvani"], last:["Gurriel","Despaigne","Pestano","Abreu","Linares","Hernández","Castillo","Mendoza","Ramírez","Martínez","García","Pérez","López","Rodríguez","Sánchez","Viera","Matos","Alvarez","Céspedes","Valdés","Ibarra","Díaz","Cruz","Sarduy","Borroto"] },
  JPN: { country:"日本", first:["翔太","健太","大輔","拓也","直樹","和也","雄大","悠斗","涼介","誠","達也","亮太","祐樹","智也","浩二","一郎","優太","俊介","圭介","颯太","龍平","悠真","陽介","雅人","竜也"], last:["佐藤","鈴木","高橋","田中","伊藤","渡辺","山本","中村","小林","加藤","吉田","山田","佐々木","山口","松本","井上","木村","林","清水","斎藤","池田","橋本","阿部","石川","山崎","森","前田","藤田","岡田","後藤","長谷川","村上","近藤","石井","坂本","遠藤","青木","藤井","西村","福田"] },
  KOR: { country:"韓國", first:["민준","서준","도윤","예준","시우","주원","하준","지호","준우","건우","현우","승우","민재","지훈","태현","동현","성민","정우","준서","현준","재윤","시윤","우진","유준"], last:["김","이","박","최","정","강","조","윤","장","임","한","오","서","신","권","황","안","송","류","홍","전","고","문","양","손","배","백","허","남","심"] },
  MEX: { country:"墨西哥", first:["José","Luis","Miguel","Carlos","Juan","Jorge","Jesús","Fernando","Adrián","Alejandro","Marco","Roberto","Eduardo","Héctor","Francisco","Rafael","Sergio","Manuel","Ángel","Víctor"], last:["García","Hernández","Martínez","López","González","Pérez","Rodríguez","Sánchez","Ramírez","Cruz","Flores","Gómez","Morales","Vázquez","Reyes","Jiménez","Torres","Díaz","Ortiz","Castro","Romero","Álvarez","Mendoza","Ruiz","Aguilar","Navarro","Medina","Ramos","Delgado","Campos"] },
  PAN: { country:"巴拿馬", first:["Carlos","José","Luis","Rubén","Jaime","Javier","Miguel","Alberto","Edgar","Roberto","Davis","Paolo","Johan","Abdiel","Luis","Héctor","Fernando","Manuel"], last:["Rivera","Gómez","Pérez","Rodríguez","García","Moreno","Castillo","Sánchez","Díaz","Vásquez","Cedeño","González","Mendoza","Quintero","Aparicio","Guerra","Cabrera","Miller","Ortiz","Santos"] },
  COL: { country:"哥倫比亞", first:["José","Luis","Jorge","Carlos","Edgar","Julio","Reynaldo","Donovan","Harold","Jhon","Javier","Miguel","Andrés","Óscar","Rafael","Diego","Juan","Santiago"], last:["Rodríguez","García","Pérez","Martínez","López","González","Díaz","Sánchez","Ramírez","Torres","Rojas","Castro","Herrera","Moreno","Vargas","Mendoza","Cabrera","Cuadrado","Arroyo","Paternina"] }
};
const hash = value => { let h=2166136261; for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; };
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const pick=(arr,r)=>arr[Math.floor(r()*arr.length)];
export const NATIONALITIES=Object.keys(DATA);
export function normalizeCountry(country=""){
 const s=String(country).trim().toLowerCase();
 if(/taiwan|taipei|中華民國|台灣|臺灣|^tw$/.test(s))return "TW";
 if(/dominican|多明尼加|^do$/.test(s))return "DOM";
 if(/venezuela|委內瑞拉|^ve$/.test(s))return "VEN";
 if(/puerto rico|波多黎各|^pr$/.test(s))return "PR";
 if(/cuba|古巴|^cu$/.test(s))return "CUB";
 if(/japan|日本|^jp$/.test(s))return "JPN";
 if(/korea|韓國|south korea|^kr$/.test(s))return "KOR";
 if(/mexico|墨西哥|^mx$/.test(s))return "MEX";
 if(/panama|巴拿馬|^pa$/.test(s))return "PAN";
 if(/colombia|哥倫比亞|^co$/.test(s))return "COL";
 if(/usa|united states|america|美國|^us$/.test(s))return "US";
 return "US";
}
export function generateFictionalName(country="TW",seed="player",used=new Set()){
 const key=DATA[country]?country:normalizeCountry(country),d=DATA[key],r=rng(hash(seed+"|"+key));
 for(let attempt=0;attempt<300;attempt++){
  const surname=pick(d.last,r),given=pick(d.first,r),name=key==="KOR"?surname+given:given+" "+surname;
  if(!used.has(name)){used.add(name);return name;}
 }
 const suffix=String(hash(seed)).slice(-5);
 return key==="KOR"?pick(d.last,r)+pick(d.first,r)+suffix:pick(d.first,r)+" "+pick(d.last,r)+" "+suffix;
}
export function generateFictionalPlayer({id,clubId=null,position="OF",seed="player",country="TW",age=null,rosterLevel="first"}={}){
 const key=DATA[country]?country:normalizeCountry(country),r=rng(hash(seed+"|"+id+"|"+key));
 const isPitcher=["SP","RP","P"].includes(position),base=42+Math.floor(r()*22);
 const ratings=isPitcher?{
  velocity:Math.max(25,Math.min(88,base+Math.floor(r()*17)-8)),
  control:Math.max(25,Math.min(88,base+Math.floor(r()*17)-8)),
  movement:Math.max(25,Math.min(88,base+Math.floor(r()*17)-8)),
  stamina:position==="SP"?55+Math.floor(r()*28):25+Math.floor(r()*35),
  fielding:35+Math.floor(r()*25),arm:45+Math.floor(r()*30)
 }:{
  contact:Math.max(25,Math.min(88,base+Math.floor(r()*17)-8)),
  power:Math.max(25,Math.min(88,base+Math.floor(r()*19)-9)),
  eye:Math.max(25,Math.min(88,base+Math.floor(r()*17)-8)),
  speed:Math.max(25,Math.min(88,base+Math.floor(r()*21)-10)),
  fielding:Math.max(25,Math.min(88,base+Math.floor(r()*17)-8)),
  arm:40+Math.floor(r()*35),range:35+Math.floor(r()*35),stealing:30+Math.floor(r()*50),avoidK:35+Math.floor(r()*35)
 };
 const data=DATA[key];
 return {id,name:generateFictionalName(key,seed+"|"+id),clubId,position,age:age??(20+Math.floor(r()*15)),role:position==="SP"?"先發投手":position==="RP"?"後援投手":position==="DH"?"指定打擊":position==="C"?"捕手":position+" 野手",foreign:key!=="TW",nationality:data.country,country:data.country,rosterLevel,dataKind:"fictional",identityStatus:"fictional",source:"遊戲虛構球員生成器",confidence:0,ratings};
}
