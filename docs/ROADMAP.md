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
- [x] Online batch importer for 1990-2024 annual CSVs
- [ ] Run full import in browser and audit all source years 1990-2024
- [ ] Acquire verified and appropriately licensed 2025-2026 data
- [x] Sourced cross-era CPBL foreign-star index
- [ ] Calibrate real-player ratings against season and league context

## Phase 3 - match engine
- [x] 120-game-per-team CPBL round-robin schedule and standings
- [x] Pitch-by-pitch and plate-appearance resolution
- [x] Batter-pitcher matchup, pitcher fatigue, baserunners, defense, steals and bullpen decisions
- [x] Same engine for manual games and quick simulation
- [x] Player commands: batting approach, pitch selection, sacrifice bunt, manual steal and intentional walk
- [x] Five-man starting rotation, cross-game pitcher workload and recovery
- [x] Box scores, player statistics and game logs
- [x] Pinch runners and defensive substitutions\n- [x] Balks, wild pitches, catcher interference and basic in-game injury events\n- [ ] Position-specific defensive alignment
- [ ] Advanced fielding outcomes and official CPBL extra-inning runner rules\n- [x] Injury events, recovery timers and lineup availability\n- [x] Extra-inning postseason games, best-of-five semifinal and best-of-seven championship

## Phase 4 - front-office simulation
- [x] Lineup, starting rotation, batting strategy, base-running and pitcher substitution controls
- [x] Ticket pricing, training/scouting facility upgrades, free-agent signing, roster limit and foreign-player cap
- [x] Gate revenue, attendance, monthly payroll, sponsorship and maintenance settlement
- [x] Monthly player development with age curve and user-selected training focus
- [ ] Contract negotiation, extensions and release compensation
- [x] One-for-one player trades with AI valuation, lineup repair and foreign-player cap checks
- [ ] Multi-player trades, AI roster construction and trade-deadline logic
- [ ] Coaches, medical staff, scouting reports and draft/prospects
- [ ] Club-level AI strategy and multi-year roster planning

## Phase 5 - long-term careers
- [x] Age-aware development and decline
- [ ] Injuries, retirement, draft and prospect generation
- [ ] Player morale, chemistry and clubhouse events
- [ ] Multi-season save migration and regression tests

## Phase 6 - historical data coverage
- [ ] Identity reconciliation, source and license audit
- [ ] Cross-era statistical normalization and rating calibration

## Phase 7 - balance and release
- [ ] Multi-season simulation tests
- [ ] Financial, player-development and match-engine calibration
- [ ] Browser playtesting and accessibility pass
- [ ] GitHub Pages release
