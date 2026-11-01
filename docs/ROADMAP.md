# Development roadmap

## Phase 1 - foundation (current)
- [x] Static browser shell and responsive navigation
- [x] Six CPBL club records for the contemporary game setup
- [x] New franchise flow and configurable foreign-player limit (0-13)
- [x] Local save and JSON export
- [x] Fictional demo athletes explicitly labelled
- [x] Initial player provenance and history schema
- [x] Foreign-player eligibility and salary estimate utilities
- [ ] Automated browser smoke tests
- [ ] Import/export validation and recovery flow

## Phase 2 - roster and player data
- Canonical player identity and aliases
- Position-aware batting/pitching/fielding ratings
- Rating evidence, confidence, and method versions
- Historical club-era mapping and player-season records
- CSV import pipeline with duplicate detection

## Phase 3 - match engine
- Schedule generation and standings
- Pitch-by-pitch / at-bat resolution
- Batter-pitcher matchup, fatigue, baserunners, defense
- Box scores and player statistics

## Phase 4 - front-office simulation
- Contracts, payroll, gate revenue, attendance, and fanbase
- Foreign player recruitment and negotiation
- Free agency, trades, roster limits, and AI club behavior

## Phase 5 - scouting and long-term careers
- Scouting uncertainty and potential
- Aging, development, injuries, and retirement
- Draft and generated prospects

## Phase 6 - historical data coverage
- Import all verifiable CPBL player records available from 1990 onward
- Verify identities, seasons, teams, and statistical definitions
- Track source, license, retrieval date, and confidence for each import
- Do not invent missing historical ratings or claim complete coverage before audit

## Phase 7 - balance and release
- Multi-season simulation tests
- Financial and player-development calibration
- Save migration and regression tests
- GitHub Pages release
