import { renderRosterTools } from "./player-tools.js";
import { estimatePlayerAbility } from "./rules.js";

export function renderRosterPage(state, getClub, escapeHtml) {
  const roster = (state.players || [])
    .filter(player => player.clubId === state.clubId)
    .slice()
    .sort((a, b) => String(a.position).localeCompare(String(b.position)) || String(a.name).localeCompare(String(b.name), "zh-Hant"));
  const foreignCount = roster.filter(player => player.foreign).length;
  const rows = roster.map(player => {
    const overall = Math.round(estimatePlayerAbility(player));
    const dataKind = player.dataKind === "real" ? "真實資料" : "虛擬示範";
    const source = player.source ? escapeHtml(player.source) : "未提供";
    return `<tr>
      <td><strong>${escapeHtml(player.name || "未命名球員")}</strong><small class="sub-cell">${escapeHtml(player.role || player.position || "球員")}</small></td>
      <td>${escapeHtml(player.position || "—")}</td>
      <td>${Number.isFinite(Number(player.age)) ? Number(player.age) : "—"}</td>
      <td>${player.foreign ? "洋將" : "本土"}</td>
      <td><strong>${overall}</strong> / 100</td>
      <td><span class="tag ${player.dataKind === "real" ? "real" : "fake"}">${dataKind}</span><small class="sub-cell">來源：${source}</small></td>
      <td><button class="button button-quiet button-small" data-release-player="${escapeHtml(player.id)}">釋出</button></td>
    </tr>`;
  }).join("");
  const club = getClub(state.clubId);
  return `
    <div class="panel">
      <div class="panel-heading-row">
        <div><h3>${escapeHtml(club?.name || "目前球團")} 球員名單</h3><p class="field-help">一軍名單 ${roster.length} 人 · 洋將 ${foreignCount} / ${Number(state.foreignLimit) || 0} 人</p></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>球員</th><th>守位</th><th>年齡</th><th>國籍</th><th>綜合能力</th><th>資料標記</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty-state">目前沒有球員資料。</td></tr>'}</tbody></table></div>
      <p class="field-help">綜合能力為依守位加權的遊戲估值，不等同於真實球員評分。真實資料需附可追溯來源。</p>
    </div>
    ${renderRosterTools(state, roster)}
  `;
}
