# Development roadmap

## Phase 1 - foundation
- [x] Browser shell, six CPBL clubs, franchise setup and local saves
- [x] Fictional demo roster clearly labelled
- [x] Foreign-player limit and CSV roster import
- [x] Position-aware rating utilities and unit tests

## Phase 2 - roster and player data
- [x] Player master and historical annual-stat import architecture
- [x] Historical club-era mapping separate from current playable clubs
- [x] Preserve raw batting, pitching, fielding and standings records
- [x] Provenance, source notes, rate helpers and tests
- [x] Add online batch importer for the 105 annual CSVs plus player master and standings (user-triggered, IndexedDB storage)\n- [ ] Run full import in browser and audit all source years 1990-2024
- [ ] Acquire verified and appropriately licensed 2025-2026 data
- [x] Create sourced cross-era CPBL foreign-star index without fabricated ratings\n- [ ] Calibrate ratings against season and league context

## Phase 3 - match engine
- [x] 120-game-per-team CPBL round-robin schedule and standings
- [x] Pitch-by-pitch and plate-appearance resolution
- [x] Batter-pitcher matchup, pitcher fatigue, baserunners, defense, steals and bullpen decisions
- [x] Box scores, player statistics and game logs
- [ ] Advanced rules: balks, wild pitches, catcher interference, injury and detailed fielding positions
- [ ] Postseason series and championship

## Phase 4 - front-office simulation
- [x] Lineup, starting rotation, batting strategy, base-running and pitcher substitution controls
- [x] Ticket pricing, training/scouting facility upgrades, free-agent signing, roster limit and foreign-player cap
- [x] Gate revenue, attendance, monthly payroll, sponsorship and maintenance settlement
- [ ] Contract negotiation, player trades, AI roster construction and club-level strategy

## Phase 5 - scouting and long-term careers
- [ ] Scouting uncertainty and potential
- [ ] Aging, development, injuries, retirement, draft and prospects

## Phase 6 - historical data coverage
- [ ] Identity reconciliation, source and license audit
- [ ] Cross-era statistical normalization and rating calibration

## Phase 7 - balance and release
- [ ] Multi-season simulation tests
- [ ] Financial and player-development calibration
- [ ] Save migration and regression tests
- [ ] GitHub Pages release
