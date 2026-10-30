# STATE — Knowbility marketplace

*Last updated: 2026-10-30*

## Where things stand

**Phases 0 and 1 complete (unpushed).** The repository is scaffolded and two plugins are ported
and registered: `know-product-spec` and `know-security`, both at 0.1.0. All four gates pass:
version-prefix parity, marketplace manifest, both plugin manifests, and `know-security`'s 66-case
functional suite. Nothing has been committed or pushed to `knowbility/knowbility-marketplace`.

## The work

Migrating four plugins in from two other marketplaces, de-branded so Knowbility can configure them
for their own use. The plan is `review/migration-plan.md`; the independent planning review that
revised it is in `.team-runs/20261030T135852Z-8b0bac54/`.

| Phase | Work | State |
|---|---|---|
| 0 | Scaffold | **Done, unpushed** |
| 1 | `know-product-spec` + `know-security` | **Done, unpushed** |
| 2 | `know-photo-generator` | Next |
| 3 | `know-qa-agent` | Pending |
| 4 | Accessibility report presentation and conformance verdicts | Deferred, needs auditor input |
| 5 | Conformance-reporting plugin | Unscoped, requirements first |

## Decisions made

- **`know-` prefix at two layers**, install name and invocation namespace. Verified: installed
  plugins are keyed `<plugin>@<marketplace>` so install names never truly collide, but the typed
  short command comes from a skill's `name:` frontmatter, so that layer is the one preventing a
  real collision. Rationale is in `AGENTS.md`.
- **No shared-state contract adopted.** The planning review flagged the candidate convention for
  missing locking and contradictory row ownership. On inspection none of the four migrating
  plugins uses shared files at all, so the convention was dropped rather than fixed. `AGENTS.md`
  keeps the principle in four lines and no schema.
- **Baseline WCAG criterion mapping moves into Phase 3, not Phase 4.** `axe-core@4.12.1` already
  carries the success criteria in each violation's `tags` array, and the current `axe.mjs` drops
  them. Adding the mapping is a passthrough plus a formatter, not a judgment call. Only report
  presentation and per-criterion conformance verdicts stay deferred, because a verdict needs a
  declared untested scope.
- **Versions reset to 0.1.0** for all four on arrival, with changelog entries naming the fork
  origin and what was removed.
- **Phase 3 gate strengthened** beyond manifest validation: scaffold run on a throwaway repo, spec
  compile, a run that exercises deduplication, both deterministic accessibility passes, and a grep
  for dynamic references (import-graph analysis only catches static imports).

## Phase 1 notes

- **The effort estimate for `product-spec` was wrong, and the reason matters.** It was scoped at
  two references and thirty minutes from a grep for source-organization *brand names*. The port
  actually carried six internal wiki page identifiers in provenance footers across five reference
  files, a 300-line changelog describing releases and cross-plugin dependencies that do not exist
  here, and a user-facing output directory to rename. **Grep for identifiers, not just names:**
  long digit runs, commit shas, hostnames, ticket and page IDs. Both later ports should be scoped
  that way before they are estimated.
- **`.product-spec/` became `.know-product-spec/`.** That is the directory the plugin writes into
  a user's own project (state, notes, decomposition, history). Renaming it means state never mixes
  with the source plugin's if both are installed, at the cost of a longer directory name in a
  user's repo. Flagged because it is user-facing.
- **`know-security` needed two passes.** The first sweep found one dated acceptance example with a
  real owner name and commit sha; a broader sweep found a second instance of the same sha in a
  different shape in `staleness.mjs`. The narrow pattern missed it. A plugin's own `AGENTS.md`
  also carried a stale test path and a stale case count.
- **The `know-security` test suite and blind reviews came along**, into
  `dev/know-security/tests/` and `dev/know-security/blind-reviews/`. The changelog and README both
  cite them, so the alternative was stripping the references. The suite is the plugin's functional
  gate and it passes 66 of 66 against the ported scripts, which is also what confirms the schema
  namespace rename did not break the scanners.
- **`S-YYYYMMDD-NN` strings stay.** Those are the security plugin's own finding-ID format
  examples in docs and one regex comment. They carry no organization content.

## Open questions

- **Provenance record.** `dev/PROVENANCE.md` names the two source marketplaces. It lives under
  `dev/`, so it never ships to a plugin user, but it does put source-organization names in the
  repository. Needs Kelsey's confirmation that this is the right read of the de-branding
  requirement.
- **Repo visibility.** Private today. Installing requires `knowbility` org read access plus git
  credentials per installer. Whether this eventually goes public is undecided, and it affects how
  much the `know-` prefix reads as a vendor prefix.
- **Maintenance model.** Who owns these after handoff: Knowbility outright, a fork Kelsey keeps
  syncing, or a seeded start they inherit later. Raised twice, including independently by the
  planning review, and still open. It affects documentation depth.
- **Attribution line** in the MIT header. Clearance to migrate is settled; what notice the license
  carries is a separate drafting detail.

## Next step

Phase 1: port `product-spec` and `security`. Both are near-clean (2 and 4 source references
respectively). Doing them first proves the scaffold, the catalog, and the install path end to end
before `qa-agent`.
