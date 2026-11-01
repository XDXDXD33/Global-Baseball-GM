# Global Baseball GM

A browser-based, deep baseball general manager simulation focused on CPBL, with a league-independent architecture for future global expansion.

## Project direction
- CPBL as the initial playable league, with six contemporary clubs.
- Mixed player database: verified real historical/current players and explicitly fictional generated players where evidence is insufficient.
- Historical CPBL player coverage from 1990 onward, subject to data availability and reuse permissions.
- Configurable foreign-player roster limit from 0 to 13.
- At-bat level match simulation.
- Club finance, player development, scouting, contracts, and international recruitment.

## Development status
Phase 1 foundation is in progress. Historical statistics and ratings must retain source, season, confidence, and licensing metadata. Missing evidence must never be presented as a verified real-player rating.

## Run locally
Open `index.html` in a modern browser, or serve this directory with any static HTTP server.

## Data policy
Only redistribute data whose license permits it. The game supports importing user-provided CSV data and clearly labels estimated or fictional records.
