# Changelog

## [0.1.0] 2026-10-30

First release in the Knowbility marketplace.

Forked from an existing interview-to-PRD plugin with the original author's clearance, then
de-branded for Knowbility's use. The pipeline itself is unchanged: discovery gate, contract
interview, draft, trace-mode decomposition with a readiness rubric, the clarify revision loop,
plus `groom` and `ui-review` after filing.

What changed in the port:

- **Renamed** to `know-product-spec`, invoked as `/know-spec:<skill>`. The source plugin's skills
  were namespaced by plugin name; they now carry explicit `know-spec:` names so the commands stay
  short and cannot collide with the plugin this was forked from.
- **Output directory** moved from `.product-spec/` to `.know-product-spec/` in the user's project,
  so state never mixes with the source plugin's if both are installed.
- **Provenance footers genericized.** The reference files record that the rubric, skeleton,
  authoring rules, shapes, and profile fields were ported from internal source documents, with the
  retrieval date retained. The source organization's internal page identifiers were removed.
- **Changelog reset.** The source plugin's version history described releases, decisions, and
  cross-plugin dependencies specific to the marketplace it came from, none of which applies here.
- Author, license (MIT), homepage, and repository set to Knowbility's.

Version reset to 0.1.0 deliberately. This is an independently maintained fork, not a continuation
of the original's version line, and carrying the old number would invite diffing against an
upstream that no longer matches.
