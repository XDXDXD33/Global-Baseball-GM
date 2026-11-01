# Global Baseball GM

Browser-based baseball GM simulation focused on CPBL, designed for future global-league expansion.

## Current foundation
- Six contemporary CPBL clubs and franchise setup.
- Foreign-player limit 0-13 enforced during manual registration and CSV import.
- Roster management, release action, and real/fictional data labels.
- CSV import with validation, duplicate detection, and row feedback.
- CSV template download and JSON save export/import.
- Position-aware weighted ability estimates (0-100), separate evidence confidence.
- Local browser saves.

## Run locally
Open `index.html` or serve this directory with a static HTTP server. GitHub Pages requires Pages source = GitHub Actions.

## Tests
Requires Node.js 20 or later: `npm test`.

## Data policy
A source field is provenance metadata, not proof of correctness or redistribution rights. Do not present missing evidence as verified ratings. Fictional players must be clearly labeled. The rating heuristic needs calibration against historical seasons.
