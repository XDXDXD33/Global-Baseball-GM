# CPBL historical data architecture

## Coverage and source
The first compatible source is [CPBL Opendata](https://github.com/ldkrsi/cpbl-opendata), an independently curated project that records annual CPBL batting, pitching, fielding and standings. Its repository contains season files from 1990 through 2024. The repository includes an MIT license. That license covers the repository contribution; it does not automatically settle the CPBL's rights in underlying league data. This game does not redistribute those third-party CSVs by default.

The curator documents the May 2021 CPBL site migration and changed player/team identifiers, incomplete legacy ID mapping, changes to BB/IBB and BS fields, missing historical minor-league records, and corrections to some 2020-and-earlier GO/FO values. Preserve source IDs and raw fields; do not silently assume all seasons are perfectly comparable.

Official reference: https://cpbl.com.tw/ . Official 1990 box-score page example: https://cpbl.com.tw/box?gameSno=127&kindCode=A&year=1990 .

## Data layers
- Player master: stable source ID, registered name, full name, handedness, birthday, country, aliases and source provenance.
- Player-season-team records: one row per player, season, historical team ID, and statistical category. Preserve split-team seasons as separate records.
- Historical team eras: historical display name and team ID are separate from the current six playable clubs. A franchise lineage may connect renamed/acquired clubs without erasing the historical team identity.
- Rating evidence: raw stats, normalized rates, league/season context, sample size, method version, confidence and source.

## Import
In the History page, upload CSV files. Preserve the original folder layout for annual files: `CPBL/battings/1990.csv`, `CPBL/pitchings/1990.csv`, `CPBL/fieldings/1990.csv`, plus `players.csv` and `CPBL/standings.csv`. Alternatively name files `battings-1990.csv`, `pitchings-1990.csv`, and `fieldings-1990.csv`. Supported annual range is 1990-2026; the initial curated source currently has seasons through 2024. Import updates matching player-season-team records rather than duplicating them.

## Statistical definitions
- Innings notation .1 and .2 means one and two outs, not decimal tenths.
- AVG = H / AB.
- SLG = TB / AB.
- OBP uses H, BB, IBB, HBP, AB and SF. Confirm each source season's BB/IBB semantics before treating cross-era OBP as final.
- ERA = ER × 9 / IP.
- WHIP = (H + BB + IBB) / IP.
Derived rates are display helpers and must be checked against the official season definition, especially across the 2021 data migration.

## Historical club eras
Current franchise IDs are optional lineage links only. Historical team names and source team IDs remain immutable facts. Unknown team IDs are retained as unmapped records for manual review.

## Future seasons
The current source inventory is 1990-2024. 2025 and 2026 records must be acquired from official/appropriately licensed sources and imported separately; do not fabricate them.
