import test from "node:test";
import assert from "node:assert/strict";
import { generateFictionalName, generateFictionalPlayer, normalizeCountry } from "../src/fictional-player-generator.js";

test("fictional names follow nationality patterns and are deterministic",()=>{
 const tw=generateFictionalName("TW","seed-1");
 const dom=generateFictionalName("DOM","seed-1");
 const jp=generateFictionalName("JPN","seed-1");
 const kr=generateFictionalName("KOR","seed-1");
 assert.match(tw,/\s/);
 assert.match(dom,/\s/);
 assert.match(jp,/\s/);
 assert.match(kr,/^[\uAC00-\uD7A3]+$/);
 assert.equal(generateFictionalName("DOM","seed-1"),dom);
});
test("fictional foreign players keep nationality and foreign marker",()=>{
 const p=generateFictionalPlayer({id:"test-1",country:"VEN",seed:"test"});
 assert.equal(p.foreign,true);
 assert.equal(p.nationality,"委內瑞拉");
 assert.equal(p.dataKind,"fictional");
 assert.equal(normalizeCountry("South Korea"),"KOR");
});
