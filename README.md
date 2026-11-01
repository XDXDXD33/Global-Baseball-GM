# Global Baseball GM

Browser-based baseball GM simulation focused on CPBL, designed for future global-league expansion.

## Current foundation
- Six contemporary CPBL clubs and franchise setup.
- Foreign-player limit 0-13 enforced during manual registration and CSV import.
- Roster management, real/fictional data labels, duplicate checks and CSV import.
- Position-aware rating estimates with separate evidence confidence.
- Historical player database architecture: player master, annual batting/pitching/fielding records, standings and historical club eras.
- Historical CSV importer supports the CPBL Opendata folder layout for 1990-2024 data.
- Historical data is stored in IndexedDB; career settings and saves use localStorage.
- JSON save export.

## Historical data source
The initial compatible source is [CPBL Opendata](https://github.com/ldkrsi/cpbl-opendata). Its repository lists annual CPBL batting, pitching and fielding CSVs from 1990 through 2024 and includes an MIT license. The curator documents ID changes after the 2021 official-site migration and other historical data caveats. The MIT repository license does not automatically resolve rights in underlying CPBL league data, so third-party CSV files are not bundled with this game.

To import: open the **歷史資料庫** page and select the downloaded source folder. Keep `players.csv`, `CPBL/standings.csv`, and the `CPBL/battings`, `CPBL/pitchings`, and `CPBL/fieldings` folder structure intact. The importer joins records by source player ID and keeps historical team eras distinct from current playable clubs.

The current audited source inventory ends at 2024. 2025 and 2026 records must be sourced and verified separately.

## Run locally
Open `index.html` or serve this directory with a static HTTP server. GitHub Pages requires Pages source = GitHub Actions.

## Tests
Requires Node.js 20 or later: `npm test`.

## Data policy
Missing evidence remains unknown. Real players must not be fabricated or given unsupported ratings. A source field is provenance metadata, not proof of identity or redistribution rights. Rating heuristics require calibration against historical seasons and league context.
