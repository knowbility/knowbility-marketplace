# know-blueprint — eval definitions

These six files are the eval target carried over with the plugin: the deterministic gates, the
scoring rubric, the scenario set, the coverage map, the adapter, and the principles behind the
scoring. They are here because `know-blueprint/AGENTS.md` cites specific gates by name — the
`no_autonomy_ratings` gate, the `adv-generic-fill` golden, `designed_status`, `inventory_updated` —
as the things that keep the plugin's disciplines from being softened by a well-meaning edit. A
maintainer who reads that guidance should be able to see what those gates actually assert rather
than take the citation on trust.

**The runner is not in this repository.** `adapter.md` describes an `/eval-run` command and writes
into `eval/targets/blueprint/_eval/iteration-N/…`; both belong to the source marketplace's eval
harness, which did not come across. So these files are specifications, not something you can
execute here today. Paths inside them that point at the harness describe that harness, not this
repo. The one path corrected on arrival is `PLUGIN_ROOT`, now `know-blueprint/`.

What did not come across is the run history: 565 files and roughly 37,000 lines of transcripts,
scorecards, and per-run artifacts from the source marketplace's eval iterations. That is twenty
times the size of the plugin, it records runs against a harness nobody here can reproduce, and
none of it is a gate. The findings worth keeping from those runs are already written into
`AGENTS.md` as the reasons particular rules exist — the Register score of 1.9/3 that produced the
machinery-stays-backstage rule, and the Non-Invention score of 2 on representative scenarios that
produced the don't-sharpen-what-they-said rule.

If Knowbility ever adopts an eval harness, `gates.json` and `scenarios.jsonl` are the portable
part and should need little more than a path fix.
