import test from "node:test";
import assert from "node:assert/strict";
import { renderRosterPage } from "../src/roster-ui.js";

test("roster page renders the selected club and player rows", () => {
  const state = {
    clubId: "brothers",
    foreignLimit: 4,
    players: [
      { id: "p1", name: "測試投手", clubId: "brothers", position: "SP", age: 24, foreign: false, dataKind: "fictional", ratings: { velocity: 60, control: 55, movement: 58, stamina: 62 } },
      { id: "p2", name: "測試洋將", clubId: "lions", position: "CF", age: 26, foreign: true, dataKind: "real", source: "資料來源", ratings: { contact: 60, power: 55, eye: 58, speed: 62, fielding: 60 } }
    ]
  };
  const html = renderRosterPage(state, id => ({ name: id === "brothers" ? "中信兄弟" : "統一獅" }), value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  assert.match(html, /中信兄弟 球員名單/);
  assert.match(html, /測試投手/);
  assert.doesNotMatch(html, /測試洋將/);
  assert.match(html, /CSV 球員資料匯入/);
  assert.match(html, /新增球員/);
});

test("roster page safely handles an empty roster", () => {
  const html = renderRosterPage({ clubId: "brothers", foreignLimit: 4, players: [] }, () => ({ name: "中信兄弟" }), String);
  assert.match(html, /目前沒有球員資料/);
});
