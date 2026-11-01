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
- [ ] Schedule generation and standings
- [ ] Pitch-by-pitch / at-bat resolution
- [ ] Batter-pitcher matchup, fatigue, baserunners, defense
- [ ] Box scores and player statistics

## Phase 4 - front-office simulation
- [ ] Contracts, payroll, gate revenue, attendance, and fanbase
- [ ] Recruitment, free agency, trades, roster limits, AI club behavior

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
