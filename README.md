# Global Baseball GM

Browser-based baseball GM simulation focused on CPBL, designed for future global-league expansion.

## Current foundation
- Six contemporary CPBL clubs and franchise setup.
- Foreign-player limit 0-13 enforced during manual registration and CSV import.
- Roster management, real/fictional data labels, duplicate checks and CSV import.
- Position-aware rating estimates with separate evidence confidence.
- Historical player database architecture: player master, annual batting/pitching/fielding records, standings and historical club eras.
- Historical CSV importer supports both direct online import and local folder import for all 1990-2024 CPBL Opendata seasons (105 annual stat CSVs plus player master and standings).
- A curated cross-era CPBL foreign-star index links verified alumni to their source IDs and career seasons without inventing ratings.
- Historical data is stored in IndexedDB; career settings and saves use localStorage.
- JSON save export.
- 26-player fictional demo rosters for all six clubs, a 120-game-per-team schedule, live pitch-by-pitch play and same-engine quick simulation.
- Player-controlled batting order, starting rotation, base-running/attack strategy, pinch hitters and pitching changes.
- Front-office controls for ticket pricing, facility upgrades, free-agent signing, one-for-one and multi-player trades with AI valuation, payroll, gate revenue and monthly finance settlement.
- Autonomous rival-club management: five AI clubs maintain separate finances, evaluate contender/rebuild strategy, renew selected contracts, sign free agents to fill roster gaps, release weak surplus players, optimize lineups and rotations, and publish transaction reports. AI clubs can also send balanced trade proposals to the player, who can accept or decline them before the trade deadline.
- Monthly first-team player development with selected training focus, age-aware growth/decline, and cross-game pitcher workload/fatigue.\n- Three-round offseason amateur draft with AI club selections, a separate minor-league roster, monthly prospect growth capped by potential, manual promotion/demotion controls, and AI clubs that evaluate and promote their own developed prospects over weaker reserve players.
- CPBL rule-based extra-inning runners, injury availability, defensive alignment and fielding box scores.
- Official CPBL half-season postseason qualification, tiebreaker, series advantages and home-field rules.
- Multi-year player contracts, salary/term negotiation, free-agent offers, release compensation, contract expiry and player retirement.

## Historical data source
The initial compatible source is [CPBL Opendata](https://github.com/ldkrsi/cpbl-opendata). Its repository lists annual CPBL batting, pitching and fielding CSVs from 1990 through 2024 and includes an MIT license. The curator documents ID changes after the 2021 official-site migration and other historical data caveats. The MIT repository license does not automatically resolve rights in underlying CPBL league data, so third-party CSV files are not bundled with this game.

To import: open the **歷史資料庫** page and choose **線上匯入 1990–2024 全資料**, or select the downloaded source folder. The online importer fetches `players.csv`, standings, and all 105 annual batting/pitching/fielding CSVs directly into browser IndexedDB. The importer joins records by source player ID and keeps historical team eras distinct from current playable clubs. No third-party CSV is committed to this repository.

The current audited source inventory ends at 2024. 2025 and 2026 records must be sourced and verified separately.

The **經典球星** page initially highlights verified CPBL imports across eras, including Manny Ramirez (2013). It distinguishes confirmed CPBL appearances from unlinked records and does not assign unsupported ability ratings. See each player card for its evidence source.

## Run locally
Open `index.html` or serve this directory with a static HTTP server. GitHub Pages requires Pages source = GitHub Actions.

## Tests
Requires Node.js 20 or later: `npm test`.

## Data policy
Missing evidence remains unknown. Real players must not be fabricated or given unsupported ratings. A source field is provenance metadata, not proof of identity or redistribution rights. Rating heuristics require calibration against historical seasons and league context.
