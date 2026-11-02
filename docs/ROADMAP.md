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
- [x] Sourced cross-era CPBL foreign-star index
- [ ] Run full import in browser and audit all source years 1990-2024
- [ ] Acquire verified and appropriately licensed 2025-2026 data
- [ ] Calibrate real-player ratings against season and league context

## Phase 3 - match engine and postseason
- [x] 120-game-per-team schedule, half-season standings and full-season standings
- [x] Pitch-by-pitch and plate-appearance resolution
- [x] Batter-pitcher matchup, fatigue, baserunners, steals and bullpen decisions
- [x] Same engine for manual games and quick simulation
- [x] Batting approach, pitch selection, sacrifice bunt, manual steal and intentional walk
- [x] Five-man rotation and cross-game pitcher workload
- [x] Pinch hitters, pinch runners and defensive substitutions
- [x] Balks, wild pitches, passed balls and catcher interference
- [x] Fielding errors, putouts, assists, double plays and catcher fielding events
- [x] Basic defensive alignment choices with ground-ball/air-ball effects
- [x] Injury events, injury list, recovery countdown and unavailable-player filtering
- [x] CPBL extra-inning runner starts on second from the 10th inning
- [x] Correct automatic-runner earned-run treatment
- [x] Regular-season 12-inning limit and tie result
- [x] Postseason extra innings continue until a winner is decided
- [x] CPBL half-season champion qualification and annual winning-percentage tiebreaker
- [x] CPBL playoff series: five-game playoff, one-win advantage where applicable, seven-game championship
- [x] CPBL home-field allocation and bye/starting-win rules
- [x] Separate regular-season and postseason player statistics
- [ ] Advanced pitch clock, rain delay, suspended-game continuation and replay challenge systems
- [ ] Full player-by-player defensive positioning and defensive shift legality

## Phase 4 - front-office simulation and contracts
- [x] Lineup, rotation, batting strategy, base-running and pitcher substitution controls
- [x] Ticket pricing, facility upgrades, payroll, gate revenue, sponsorship and maintenance
- [x] Monthly player development with selected training focus and age curve
- [x] Multi-year contracts generated for all active players
- [x] Contract renewal negotiation with salary and term offers
- [x] Free-agent salary/term offers, roster and foreign-player limits, signing bonus
- [x] Player release with remaining-contract compensation
- [x] Contract expiry at season rollover with AI-specific offseason renewal evaluation
- [x] One-for-one player trades with AI valuation and roster repair
- [x] Multi-player trades (up to three players per side)
- [x] Trade deadline enforcement
- [x] AI-initiated balanced trade proposals with user accept/decline and deadline expiry
- [x] AI free-agent signings, roster construction and contract renewal
- [x] Hitting, pitching and fielding coaches with monthly development effects
- [x] Medical staff that improves injury recovery
- [x] Scouting reports with ability ranges, confidence and staff/facility accuracy
- [x] Three-round amateur draft with AI club picks and user-controlled selections
- [x] Separate minor-league roster, monthly prospect development and potential ceilings
- [x] Prospect promotion to the first team and eligible player demotion
- [x] AI clubs develop minor-league prospects and promote superior prospects over weak reserve players
- [x] Club-level AI budgets, contender/rebuild strategy and lineup optimization

## Phase 5 - long-term careers
- [x] Age-aware development and decline
- [x] Injury recovery and player availability
- [x] User retirement and AI retirement at season rollover
- [x] Draft and prospect generation
- [ ] Player morale, chemistry and clubhouse events
- [ ] Multi-season financial and statistical balance tests

## Phase 6 - historical data coverage
- [ ] Identity reconciliation, source and license audit
- [ ] Cross-era statistical normalization and rating calibration

## Phase 7 - balance and release
- [ ] Multi-season simulation tests
- [ ] Financial, player-development and match-engine calibration
- [ ] Browser playtesting and accessibility pass
- [ ] GitHub Pages release
