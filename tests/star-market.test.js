import test from "node:test";
import assert from "node:assert/strict";
import {FEATURED_IMPORTS,renderStarMarket} from "../src/star-market.js";
test("featured imports cover four decades and use verifiable CPBL alumni",()=>{
 assert.ok(FEATURED_IMPORTS.some(p=>p.english==="Manny Ramirez"&&p.id==="0000000331"));
 assert.ok(FEATURED_IMPORTS.some(p=>p.decade==="1990s"));
 assert.ok(FEATURED_IMPORTS.some(p=>p.decade==="2000s"));
 assert.ok(FEATURED_IMPORTS.some(p=>p.decade==="2010s"));
 assert.ok(FEATURED_IMPORTS.some(p=>p.decade==="2020s"));
});
test("star market does not fabricate player ratings",()=>{
 const html=renderStarMarket({players:{},batting:[],pitching:[]},2013);
 assert.match(html,/不會憑空生成能力值/);
 assert.match(html,/Manny Ramirez/);
 assert.match(html,/等待匯入歷史資料/);
});
