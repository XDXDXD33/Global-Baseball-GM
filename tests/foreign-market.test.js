import test from "node:test";
import assert from "node:assert/strict";
import { signForeignFreeAgent } from "../src/contract-engine.js";
import { promoteProspect } from "../src/draft-engine.js";
import { countForeignPlayers } from "../src/rules.js";

function baseState(){
 const foreign={id:"old-foreign",name:"Old Foreign",clubId:"brothers",foreign:true,rosterLevel:"first",position:"RP",age:29,ratings:{velocity:65,control:60,movement:60,stamina:40}};
 const local={id:"local",name:"Local",clubId:"brothers",foreign:false,rosterLevel:"first",position:"CF",age:25,ratings:{contact:60,power:50,eye:55,speed:60,fielding:55}};
 const candidate={id:"candidate",sourcePlayerId:"candidate-source",name:"Juan Example",foreign:true,nationality:"多明尼加",dataKind:"real",position:"SP",age:28,ratings:{velocity:70,control:65,movement:62,stamina:70},source:"CPBL Opendata"};
 return {clubId:"brothers",foreignLimit:1,budget:100000000,season:2024,players:[foreign,local],foreignMarket:[candidate],contracts:{},lineups:{brothers:{lineup:["local"],rotation:[],bullpen:["old-foreign"]},lions:{lineup:[],rotation:[],bullpen:[]}},freeAgents:[],minorLeague:[]};
}
test("first-team foreign count excludes minor-league players",()=>{
 const players=[{foreign:true,rosterLevel:"first"},{foreign:true,rosterLevel:"minor"}];
 assert.equal(countForeignPlayers(players),1);
});
test("foreign recruitment rejects an offer when first-team quota is full",()=>{
 const state=baseState();
 assert.throws(()=>signForeignFreeAgent(state,{playerId:"candidate",salary:3000000,years:1}),/名額已滿/);
});
test("foreign recruitment signs negotiated offer when a first-team slot is free",()=>{
 const state=baseState();
 state.players[0].rosterLevel="minor";
 const result=signForeignFreeAgent(state,{playerId:"candidate",salary:3000000,years:1});
 assert.equal(result.player.name,"Juan Example");
 assert.equal(state.players.filter(p=>p.clubId==="brothers"&&p.foreign&&p.rosterLevel!=="minor").length,1);
 assert.equal(state.foreignMarket.length,0);
});
test("promotion rejects a foreign prospect when the first-team quota is full",()=>{
 const state=baseState();
 state.minorLeague=[{id:"prospect-foreign",name:"Prospect",clubId:"brothers",foreign:true,position:"RP",ratings:{velocity:55}}];
 assert.throws(()=>promoteProspect(state,"prospect-foreign"),/名額已滿/);
});
