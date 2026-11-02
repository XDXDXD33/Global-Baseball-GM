import { renderRosterTools } from "./player-tools.js";
import { estimatePlayerAbility, estimatePlayerSalary, calculateRatingConfidence } from "./rules.js";

export function renderRosterPage(state, getClub, escapeHtml) {
  const roster = (state.players || []).filter(player => player.clubId === state.clubId);
  const market = {
    winPct: state.wins + state.losses ? state.wins / (state.wins + state.losses) : 0.5,
    fanbase: Number(state.fanbase) || 8500,
    averageSalary: state.averageSalary || 1000000
  };
  const rows = roster.map(player => {
    const ratings = Object.entries(player.ratings || {})
      .filter(([, value]) => Number.isFinite(value))
      .slice(0, 3)
      .map(([key, value]) => key + " " + value)
      .join(" · ") || "尚無能力資料";
    const hasRatings = Object.values(player.ratings || {}).some(Number.isFinite);
    const ability = hasRatings ? Math.round(estimatePlayerAbility(player)) : "待評估";
    const confidence = Math.round(calculateRatingConfidence(player) * 100);
    const salary = hasRatings ? Math.round(estimatePlayerSalary(player, market)).toLocaleString("zh-TW") : "待評估";
    return `<tr>
      <td><b>${escapeHtml(player.name)}</b><small class="sub-cell">${escapeHtml(player.id)}</small></td>
      <td>${escapeHtml(player.position)}</td>
      <td>${player.age ?? "?"}</td>
      <td>${player.foreign ? "洋將" : "本土"}</td>
      <td>${ability}</td>
      <td>${confidence}%</td>
      <td>${escapeHtml(ratings)}</td>
      <td>${player.dataKind === "real" ? '<span class="tag real">真實資料</span>' : '<span class="tag fake">虛擬球員</span>'}</td>
      <td>${salary}</td>
      <td><button class="button button-quiet button-small" data-release-player="${escapeHtml(player.id)}">釋出</button></td>
    </tr>`;
  }).join("");
  const club = getClub(state.clubId);
  return `
    <div class="panel">
      <h3>球員名單 · ${roster.length} 人</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>球員</th><th>守位</th><th>年齡</th><th>類別</th><th>能力</th><th>信心</th><th>能力項目</th><th>資料</th><th>估計年薪</th><th>操作</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="10">目前沒有球員</td></tr>'}</tbody>
      </table></div>
      <p class="field-help">能力為 0-100 模擬值；信心反映證據完整度，不代表實力。薪資為遊戲估值。${club ? " 球隊：" + escapeHtml(club.name) : ""}</p>
    </div>
    ${renderRosterTools(state, roster)}
  `;
}
