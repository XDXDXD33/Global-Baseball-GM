// League rules and financial estimates. All monetary outputs are simulation estimates, not real contract quotes.
export function validateForeignLimit(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 13) {
    throw new RangeError("洋將名額必須是 0 到 13 的整數");
  }
  return n;
}

export function countForeignPlayers(players) {
  return players.filter(p => p.foreign === true).length;
}

export function canRegisterForeignPlayer(players, foreignLimit) {
  return countForeignPlayers(players) < validateForeignLimit(foreignLimit);
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 50;

// Expected input ratings are 0-100. Missing attributes are ignored rather than treated as zero.
export function estimatePlayerAbility(player) {
  const values = Object.values(player.ratings || {}).filter(Number.isFinite);
  return clamp(mean(values), 20, 95);
}

// Reference annual salary in simulation currency. The market multiplier includes the requested
// club factors: winning percentage, fanbase, and team average salary. It is not a promise of
// historically accurate contract prices; coefficients will be calibrated by season simulations.
export function estimateForeignPlayerSalary(player, club) {
  const ability = estimatePlayerAbility(player);
  const age = Number.isFinite(player.age) ? player.age : 27;
  const ageFactor = age < 25 ? 0.88 : age <= 30 ? 1 : age <= 33 ? 0.9 : 0.76;
  const winPct = clamp(Number(club.winPct) || 0.5, 0, 1);
  const fanFactor = clamp(Math.sqrt((Number(club.fanbase) || 5000) / 5000), 0.65, 1.6);
  const averageSalary = Math.max(1, Number(club.averageSalary) || 1_000_000);
  const payrollFactor = clamp(Math.sqrt(averageSalary / 1_000_000), 0.7, 1.5);
  const winningFactor = 0.82 + winPct * 0.36;
  const base = 350_000 * Math.pow(ability / 50, 2.15) * ageFactor;
  return Math.round(base * fanFactor * payrollFactor * winningFactor / 1000) * 1000;
}
