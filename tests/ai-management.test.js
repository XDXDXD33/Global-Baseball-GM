import test from "node:test";
import assert from "node:assert/strict";
import {createInitialLeagueRoster,buildDefaultLineup,createFreeAgentPool,createLeagueSchedule} from "../src/game-engine.js";
import {LEAGUE} from "../src/data.js";
import {initializeContracts} from "../src/contract-engine.js";
import {initializeAIClubFinances,runAIClubManagement,settleAIClubFinances,getAIClubSummary,acceptAITradeProposal,declineAITradeProposal} from "../src/ai-management.js";
function makeState(){
 const players=createInitialLeagueRoster(2026);
 return {season:2026,month:1,matchday:1,clubId:"brothers",foreignLimit:4,budget:120000000,players,freeAgents:createFreeAgentPool(2026),contracts:initializeContracts(players,2026),lineups:Object.fromEntries(LEAGUE.clubs.map(c=>[c.id,buildDefaultLineup(players,c.id)])),tactics:{},schedule:createLeagueSchedule(2026),injuries:{},aiClubReports:[]};
}
test("AI initializes separate finances for all five rival clubs",()=>{
 const state=makeState();initializeAIClubFinances(state);
 assert.equal(Object.keys(state.aiClubFinances).length,5);
 assert.ok(Object.values(state.aiClubFinances).every(x=>x.budget>0));
});
test("AI signs a free agent to fill a missing starting-pitcher slot",()=>{
 const state=makeState(),team="lions";
 const removed=state.players.find(p=>p.clubId===team&&p.position==="SP");
 state.players=state.players.map(p=>p.id===removed.id?{...p,clubId:null}:p);
 delete state.contracts[removed.id];
 state.lineups[team].rotation=state.lineups[team].rotation.filter(id=>id!==removed.id);
 runAIClubManagement(state);
 const roster=state.players.filter(p=>p.clubId===team);
 assert.equal(roster.length,26);
 assert.ok(roster.filter(p=>p.position==="SP").length>=5);
 assert.ok(state.aiClubReports.some(x=>x.teamId===team&&x.type==="sign"));
 assert.equal(new Set(state.players.map(p=>p.id)).size,state.players.length);
});
test("AI renews a valuable veteran contract approaching expiry",()=>{
 const state=makeState(),team="dragons";
 const player=state.players.filter(p=>p.clubId===team).sort((a,b)=>b.ratings.contact-a.ratings.contact)[0];
 state.contracts[player.id]={salary:500000,yearsRemaining:1};
 const before=state.aiClubFinances?.[team]?.budget;
 runAIClubManagement(state);
 assert.ok(state.contracts[player.id].yearsRemaining>=2);
 assert.ok(state.aiClubReports.some(x=>x.teamId===team&&x.type==="renew"));
 if(before!==undefined)assert.ok(state.aiClubFinances[team].budget<=before);
});
test("AI lineup optimization excludes injured players and sets five starters",()=>{
 const state=makeState(),team="hawks";
 const injured=state.lineups[team].lineup[0];
 state.injuries[injured]={daysRemaining:8};
 runAIClubManagement(state);
 assert.ok(!state.lineups[team].lineup.includes(injured));
 assert.equal(state.lineups[team].lineup.length,9);
 assert.equal(state.lineups[team].rotation.length,5);
 assert.ok(state.lineups[team].lineup.every(id=>state.players.some(p=>p.id===id&&p.clubId===team)));
});
test("AI monthly finance settlement applies payroll and sponsor income",()=>{
 const state=makeState();initializeAIClubFinances(state);
 const before=state.aiClubFinances.lions.budget;
 settleAIClubFinances(state);
 assert.notEqual(state.aiClubFinances.lions.budget,before);
 assert.equal(typeof state.aiClubFinances.lions.monthlyNet,"number");
});
test("AI club summary reports roster needs and strategic direction",()=>{
 const state=makeState();runAIClubManagement(state);
 const summary=getAIClubSummary(state);
 assert.equal(summary.length,5);
 assert.ok(summary.every(x=>["contend","rebuild","balanced"].includes(x.strategy)));
});

function prepareTradeState(){
 const state=makeState();state.matchday=21;state.phase="regular";
 const user=state.players.find(p=>p.clubId==="brothers"&&p.position==="C"&&!state.lineups.brothers.lineup.includes(p.id));
 const rival=state.players.find(p=>p.clubId==="lions"&&p.position==="C"&&!state.lineups.lions.lineup.includes(p.id));
 user.foreign=false;rival.foreign=false;
 user.ratings={contact:55,power:50,eye:50,fielding:55};rival.ratings={...user.ratings};
 return state;
}
test("AI proposes a balanced bench-player trade and user can accept it",()=>{
 const state=prepareTradeState();runAIClubManagement(state);
 const proposal=state.aiTradeProposals?.find(x=>x.status==="pending");
 assert.ok(proposal);
 const result=acceptAITradeProposal(state,proposal.id);
 assert.equal(state.players.find(p=>p.id===proposal.userPlayerId).clubId,proposal.teamId);
 assert.equal(state.players.find(p=>p.id===proposal.aiPlayerId).clubId,"brothers");
 assert.equal(proposal.status,"accepted");
 assert.ok(result.outgoingIds.includes(proposal.userPlayerId));
});
test("user can decline an AI trade proposal without changing player ownership",()=>{
 const state=prepareTradeState();runAIClubManagement(state);
 const proposal=state.aiTradeProposals?.find(x=>x.status==="pending");
 assert.ok(proposal);
 declineAITradeProposal(state,proposal.id);
 assert.equal(proposal.status,"declined");
 assert.equal(state.players.find(p=>p.id===proposal.userPlayerId).clubId,"brothers");
 assert.equal(state.players.find(p=>p.id===proposal.aiPlayerId).clubId,proposal.teamId);
});
test("AI does not generate trade proposals after the trade deadline",()=>{
 const state=prepareTradeState();state.matchday=91;
 runAIClubManagement(state);
 assert.equal((state.aiTradeProposals||[]).filter(x=>x.status==="pending").length,0);
});
