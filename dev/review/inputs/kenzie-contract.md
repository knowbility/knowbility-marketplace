# Kenzie Creative — directory convention

This is documentation for **plugin authors**, not a runtime file. Nothing here is loaded or bundled into a plugin; it's the shared agreement that lets independent Kenzie Creative plugins compose without depending on one another.

## The model

The integration surface is the **deployment directory** — the project where a user sets things up — not the plugins. Shared state lives there as a few well-known files. Any plugin that runs:

1. looks for the shared file it needs and **creates it if absent** (with the Write tool — never a shell command),
2. reads and writes **only its own rows**, identified by a `source` tag, and
3. never assumes any other plugin is installed.

Because coordination happens through files in the directory, plugins stay completely decoupled: install one or five, in any order, and each just maintains its slice of the shared state. There is no cross-plugin contract to bundle, version, or sync — only this convention to conform to.

## The shared files (in the deployment directory)

| File | Purpose | Written by |
|------|---------|-----------|
| `ledger.json` | "Have I already reported this?" — per-producer memory that powers *report motion, not state*. | every producer (its own `source` rows) |
| `candidates.json` | The review queue — items worth an action or sustained watching, awaiting human triage. | producers append; the review step dispositions |
| `sources/` | Drop-box inbox: files other projects hand in for triage. | external projects write; a source triage reads |

All three are optional to *any given* plugin — a plugin only touches the ones its job needs. The environmental brief, for example, uses `ledger.json` only.

## Source tagging

Every row in a shared file carries a `source` naming the producer that wrote it (`environmental`, `meetings`, `comms`, …). A plugin reads and prunes only its own rows and leaves others untouched. This is what makes one shared file safe for many independent writers. Legacy rows with no `source` belong to whichever plugin historically owned that file.

## Shapes

### Ledger entry (`ledger.json` → `entries[]`)

```json
{
  "id": "stable-slug-of-the-underlying-thing",
  "source": "environmental",
  "title": "short item title",
  "published": "YYYY-MM-DD",
  "first_seen": "YYYY-MM-DD",
  "last_seen": "YYYY-MM-DD",
  "disposition": "note|track|act|dig",
  "last_state": "one-line description of the most recent reported development"
}
```

`id` is a normalized slug of the core subject (not the headline) so the same thing matches across runs. A producer may add fields it needs (the environmental brief adds `zone`); keep the ones above stable.

### Candidate item (`candidates.json` → `candidates[]`)

```json
{
  "id": "stable-slug-of-the-underlying-thing",
  "source": "environmental",
  "captured": "YYYY-MM-DD",
  "kind": "explicit-task | implicit-task | watch-item | signal | fyi | pattern",
  "title": "short human-readable title",
  "summary": "what this is, in plain language, qualifiers intact",
  "suggested_action": "the proposed next step, or null",
  "evidence": { "type": "fact|signal|frame|pattern", "tier": "primary|secondary|tertiary", "corroboration": "single|corroborated" },
  "disposition": "note|track|act|dig",
  "links": ["provenance URL / message permalink / transcript timestamp"],
  "dedup_key": "normalized subject for matching the same real-world thing",
  "review_status": "proposed|accepted|rejected|deferred",
  "first_seen": "YYYY-MM-DD",
  "last_seen": "YYYY-MM-DD"
}
```

- Producers write `review_status: "proposed"`; the review step owns the other states.
- **dedup_key** lets the same real-world item arriving through two producers become one row: before appending, a producer scans `candidates.json` for a matching `dedup_key` (from any source) and, on a match, merges its `source`/`links` into the existing row instead of adding a duplicate. This is still decoupled — the producer reads a file, not another plugin.

### Sources inbox (`sources/`)

`sources/inbox/` holds small Markdown or JSON drops from other projects; a source triage moves processed files to `sources/processed/`. A drop names its origin in `source_project` and lets the triage do the compression. See a producer's own docs for the exact drop format.

## Writing a participating plugin

1. Touch only the shared files your job needs; create them if absent (Write tool, no shell).
2. Tag every row you write with your `source`; read/prune only your own rows.
3. Conform to the shapes above; add fields you need without removing shared ones.
4. Treat shape changes here as additive and backward-compatible — old rows must keep working.

That's the whole agreement. A plugin that follows it composes with every other Kenzie Creative plugin automatically, and works perfectly well alone.
