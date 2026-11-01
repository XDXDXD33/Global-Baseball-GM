# Player and historical data model

## Provenance
Real athlete records require a stable source identifier or documented identity match. Missing ratings are unknown, not zero. Fictional athletes are explicitly marked. Estimated ratings carry method version and confidence. Preserve source, retrieval date, license, attribution and transformation notes.

## CSV import
Required columns: `id,name,clubId,position,age,foreign,dataKind`. Optional: `role,identityStatus,source,confidence`, and ratings `contact,power,eye,avoidK,speed,stealing,fielding,arm,range,velocity,control,movement,stamina`.
Club IDs: `brothers,lions,guardians,monkeys,dragons,hawks`. Positions: `SP,RP,P,C,1B,2B,3B,SS,LF,CF,RF,DH,OF`. Ratings use 0-100 and confidence 0-1. Quoted commas and escaped quotes are supported. Invalid rows and duplicates are skipped with feedback. Real players require a source value, which does not independently verify correctness or redistribution rights.

## Ratings
Position-aware weighted ratings ignore missing attributes and normalize remaining weights. Evidence confidence is separate from ability. The `cpbl-rating-v1` heuristic requires historical calibration before being treated as realistic.

## Historical coverage
Target reliable records available from 1990 onward. Historical club identities and name changes need separate club-era records.

## Foreign players and licensing
The franchise setting accepts 0-13. Manual registration and CSV import enforce the current club's foreign-player limit. Never invent a real identity to fill data gaps. Public visibility is not a redistribution license; only bundle datasets whose terms permit redistribution.
