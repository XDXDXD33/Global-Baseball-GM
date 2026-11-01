# Player and historical data model

## Non-negotiable provenance rules
1. A real athlete record must have a stable source identifier or a documented identity-matching note.
2. A missing rating is unknown, not zero and not an invitation to invent a factual value.
3. Fictional generated athletes must be explicitly marked `fictional`.
4. Estimated ratings must carry a method version and confidence level.
5. Raw season statistics and game ratings are separate records.
6. Store source URL/name, retrieval date, license, attribution requirements, and transformation notes for imported datasets.

## Player record (planned)
- id, canonicalName, aliases, birthDate (when reliably known), bats, throws, primaryPosition
- identityStatus: verified | probable | unresolved
- dataKind: real | fictional
- seasons[]: leagueId, clubId, season, battingStats, pitchingStats, fieldingStats, sourceRefs[]
- ratingsBySeason[]: ratingScale, attributes, methodVersion, confidence, evidence
- careerStatus: active | retired | unknown

## Rating scale
The simulation stores 0-100 values. The scouting UI may display a 20-80 scale. These scales must not be conflated. Position-specific overall ratings are derived, never manually substituted for component ratings.

## Historical CPBL coverage
Target: all players for whom reliable records can be obtained from 1990 onward. Coverage is an ingestion project, not a claim that the current seed data is complete. Handle historical club identities and name changes using separate club-era records.

## Foreign player policy
The franchise setting accepts an integer roster ceiling from 0 through 13. The game rules engine validates every signing and roster move against that setting. Real foreign-player ratings require adequate evidence; otherwise the game may create a fictional player inspired by broad league-level distributions, never impersonating a real athlete.

## Licensing
Publicly viewable information is not automatically licensed for bulk redistribution. Keep data adapters separate from the game client and only bundle data with permission for redistribution. Support user-imported CSV for datasets the user is entitled to use.
