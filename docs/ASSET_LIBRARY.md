# Local Visual Asset Library (Task V2-05)

The Asset Library is an offline, approval-gated store for reusable visual subjects. Task002 decides what an episode needs and checks this library first. Task003 generates only assets still marked new and can resolve approved library references without Recraft. Task004 stages only valid, approved assets into the Remotion public area. Task005 accumulates approved assets and records use.

## Storage and approval

`assets/library/library-index.json` is local state and is ignored by Git. Generated binaries are copied into content-addressed `assets/library/generated/recraft/...` paths and ignored. Curated assets are copied under `assets/library/curated/...`; small original or explicitly licensed items may be tracked after review. The library never stores API keys, Authorization data, or Style IDs.

Generated assets enter the library only through `library:promote`, after the episode's local review file says `approved`. Pending, rejected, missing, high-risk, or invalid PNGs are refused. Promotion leaves the source episode asset and cache intact. Identical SHA-256 content shares one binary and keeps source references in metadata. Curated intake accepts PNG or SVG and requires `original`, `user-owned`, or `licensed`; unknown licensing is refused. SVG active content is rejected. Curated entries default to `curated-v1`, which remains a candidate for a `recraft-v1` Episode. Pass `--profile-version recraft-v1` only after human confirmation that the asset fits the channel profile.

```powershell
npm run library:promote -- --episode paradox-of-choice --asset choice-door-v1 --canonical-name door-basic --tags "door,choice,architecture"
npm run library:add-curated -- --file assets/my-paddle.svg --canonical-name auction-paddle --kind symbolic-object --subject "Original auction paddle silhouette" --tags "auction,paddle" --license-status original --visual-role icon
npm run library:search -- --query "steam engine" --kind machine
npm run library:list -- --kind machine --provider recraft
npm run library:disable -- --asset door-basic
npm run library:doctor
```

Disable is reversible metadata state; it does not delete the binary or usage history. Search never increments usage. Task004 records one use per episode/scene placement, idempotently. Within-episode motif repetition is allowed. A reuse in three or more of the latest five distinct other episodes raises a warning.

## Resolver policy

Matching is deterministic and explainable: exact reuse key 100, canonical name 95, exact alias 90, exact subject 85, and strong tag candidate 70. Score 80 is the automatic-reuse threshold. Tag-only hits stay candidates. Kind must match, except the explicit machine/industrial-object pair. Automatic reuse also requires a compatible profile version, visual role, and background mode. Disabled, missing, hash-mismatched, invalid, incompatible, and unsupported assets cannot be returned for production use. A lower-scoring candidate is never silently selected.

Procedural Remotion assets remain the home for precise diagrams, formulas, networks, branching paths, charts, and timelines.

## Health and test boundary

`library:doctor` checks the local index and every referenced binary for schema/ID problems, missing files, hash or dimension mismatch, unsupported formats, and disabled counts. Automated tests use temporary fixture files and mock no external provider because none is called. The local Task004 pending door remains pending until a human review explicitly approves it.
