#!/usr/bin/env node
// Deterministic checks a revision pass runs before it calls itself done.
//
// These exist because of a repeated failure observed in live use: a revision
// pass asserts something about the document or its worked example without
// checking it, and the error is not caught until an independent verification
// decomposition runs, at many times the cost. Everything here is a check that
// would have caught one of those, in under a second.
//
// What each check is for:
//
//   open-item-incomplete       a §0 open item missing an owner or a
//                              what-must-not-be-assumed line.
//   dangling-reference         a §0.N item referenced and never declared.
//   unqualified-quantifier     "always renders" without saying always across
//                              what. Two passes writing "always" about
//                              different dimensions is how a document comes to
//                              contradict itself.
//   name-used-two-ways         one identifier (Epic A, Workstream 2, W3)
//                              carrying two different titles. A rename that
//                              lands in one place and not the other is the
//                              classic sweep failure.
//   class-not-in-design        the document names a CSS class no design file
//                              defines.
//   styled-never-used          the worked example styles something, uses it
//                              nowhere, and the document never mentions it.
//                              Design intent nobody wrote down.
//   quoted-string-mismatch     a string the document attributes to the design
//                              is not in the design.
//   numeric-claim              a count about the design, which a human must
//                              verify. Informational: listed under "verify by
//                              hand" and never fails the run, because a count
//                              is not a defect, it is a claim awaiting eyes.
//
// The last four run only when design files are passed. The caller passes the
// worked-example files the document's own header names, when they resolve to
// local paths. With none passed, those checks are skipped and this says so,
// because a clean result must stay distinguishable from a run that did not
// check.
//
// The change-log header line and the resolutions log are history, not
// contract, so the content checks skip them: a superseded claim there is the
// record of what was believed at the time and stays as written.
//
// usage: node prd-lint.mjs <prd.md> [design files...] [--accepted <path>]
// exit:  0 clean or accepted-only, 1 new findings, 2 usage error.

import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const acceptedIdx = args.indexOf("--accepted");
let acceptedPath = null;
if (acceptedIdx !== -1) {
  acceptedPath = args[acceptedIdx + 1];
  if (!acceptedPath) {
    console.error("--accepted needs a path");
    process.exit(2);
  }
  args.splice(acceptedIdx, 2);
}
if (args.length < 1) {
  console.error("usage: node prd-lint.mjs <prd.md> [design files...] [--accepted <path>]");
  process.exit(2);
}

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch (e) {
    console.error(`cannot read ${p}: ${e.message}`);
    process.exit(2);
  }
};

const prd = read(args[0]);
const designPaths = args.slice(1);
const mock = designPaths.length ? read(designPaths[0]) : null;
const design = designPaths.length ? designPaths.map(read).join("\n") : null;

const issues = [];
const add = (check, detail) => issues.push([check, detail]);

// Contract text only: drop the change-log header line and any section whose
// heading names the resolutions log, located by heading text, never number.
let contract = prd.replace(/\*\*Last updated:\*\*[^\n]*\n/g, "");
contract = contract.replace(
  /^#{1,6}[^\n]*resolutions log[^\n]*\n[\s\S]*?(?=^#{1,6}\s|(?![\s\S]))/gim,
  ""
);

// open-item-incomplete and dangling-reference: the §0 section and its refs.
const sec0Match = prd.match(/^#{1,6}[^\n]*§0[^\n]*\n([\s\S]*?)(?=^#{1,6}\s|(?![\s\S]))/m);
const declared = new Set();
if (sec0Match) {
  const items = sec0Match[1].split(/\n(?=\d+\.\s+\*\*)/);
  for (const item of items) {
    const num = item.trim().match(/^(\d+)\./);
    if (!num) continue;
    declared.add(num[1]);
    if (/Resolved/.test(item)) continue;
    if (!/Owner:/.test(item)) {
      add("open-item-incomplete", `§0.${num[1]} names no owner`);
    }
    if (!/\bDo not\b|must not be assumed/i.test(item)) {
      add("open-item-incomplete", `§0.${num[1]} has no what-must-not-be-assumed line`);
    }
  }
}
for (const ref of new Set([...prd.matchAll(/§0\.(\d+)/g)].map((m) => m[1]))) {
  if (!declared.has(ref)) {
    add("dangling-reference", `§0.${ref} is referenced and never declared`);
  }
}

// unqualified-quantifier: always/never behavior claims with no across-what.
const QUALIFIED = /\bwhen\b|\bexcept\b|\bunless\b|\bwhile\b|\bbut\b|\bin every\b|\bon\s+[A-Z]/i;
const QUANT = /[^.\n]*\b(?:always|never)\s+(?:renders?|shows?|displays?|appears?|returns?|sends?|updates?|hides?|loads?|opens?)\b[^.\n]*\./g;
for (const m of contract.matchAll(QUANT)) {
  const s = m[0].split(/\s+/).join(" ");
  if (!QUALIFIED.test(s)) {
    add("unqualified-quantifier", `across what? ${s.slice(0, 130)}`);
  }
}

// name-used-two-ways: one identifier, two titles.
const names = new Map();
const NAME = /\b((?:Epic|Workstream|Track)\s+[A-Z0-9]{1,3}|W\d+(?:-T\d+)?)\s*[·:]\s*([^.*|\n(]+)/g;
for (const m of prd.matchAll(NAME)) {
  const id = m[1].split(/\s+/).join(" ");
  const title = m[2].split(/\s+/).join(" ").replace(/,\s*$/, "").trim();
  if (!title) continue;
  if (!names.has(id)) names.set(id, new Set());
  names.get(id).add(title);
}
for (const [id, titles] of [...names.entries()].sort()) {
  if (titles.size > 1) {
    add("name-used-two-ways", `${id} is called ` + [...titles].sort().map((t) => `"${t}"`).join(" and "));
  }
}

// Design-dependent checks.
if (design === null) {
  console.log("design checks skipped: no design files were passed, so class, quoted-string, and numeric-claim checks did not run");
} else {
  const namedClasses = new Set([...prd.matchAll(/`\.([a-zA-Z][\w-]*)`/g)].map((m) => m[1]));

  // class-not-in-design
  for (const cls of [...namedClasses].sort()) {
    if (!design.includes(`.${cls}`)) {
      add("class-not-in-design", `.${cls} is named in the document and no design file defines it`);
    }
  }

  // styled-never-used, scoped to the worked example (the first design file).
  const styled = new Set(
    [...mock.matchAll(/^\s*\.([a-z][\w-]*)[\s,{]/gm)].map((m) => m[1])
  );
  for (const cls of [...styled].sort()) {
    if (new RegExp(`class="[^"]*\\b${cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(mock)) continue;
    if (namedClasses.has(cls) || [...namedClasses].some((n) => cls.startsWith(n + "-"))) continue;
    add("styled-never-used", `.${cls} is styled in the worked example, used nowhere, and absent from the document`);
  }

  // quoted-string-mismatch: attribution needs a source word and a claiming
  // verb near the quote, or every quote near the word "mock" is a false hit.
  const SOURCE = /mock|worked example|design system|the branch|already (?:draws|uses|carries)/i;
  const VERB = /match|read|carr(?:y|ies)|draw|render|use|from the|on the|says|shows/i;
  for (const m of contract.matchAll(/["“]([^"”\n]{12,120})["”]/g)) {
    const q = m[1];
    if (q.includes("{") || q.includes("[")) continue;
    const windowText = contract.slice(Math.max(0, m.index - 220), m.index);
    if (SOURCE.test(windowText) && VERB.test(windowText)) {
      if (!design.includes(q)) {
        add("quoted-string-mismatch", `"${q.slice(0, 70)}" is attributed to the design and is not in it`);
      }
    }
  }

  // numeric-claim: counts about the design need a verifying command.
  const WORDS = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|twenty|\\d+";
  const NUM = new RegExp(
    `\\b(${WORDS})\\s+(?:of\\s+(?:its\\s+)?)?[\\w\\s]{0,30}?(cards?|items?|filters?|states?|renderings?|instances?|columns?|rows?|tabs?)\\b`,
    "gi"
  );
  for (const m of contract.matchAll(NUM)) {
    const ctx = contract.slice(Math.max(0, m.index - 140), m.index + m[0].length + 60).split(/\s+/).join(" ");
    if (/mock|worked example|design|the branch|draws?|carries/i.test(ctx)) {
      add("numeric-claim", `"${m[0]}" needs the command that verifies it`);
    }
  }
}

// Accepted findings: known ones count but do not fail, so the gate is green
// on what a human already ruled on and red on anything new. A gate that
// always fails is a gate nobody reads.
const accepted = [];
if (acceptedPath && existsSync(acceptedPath)) {
  for (let line of readFileSync(acceptedPath, "utf8").split("\n")) {
    line = line.split("#")[0].trim();
    if (!line || !line.includes("|")) continue;
    const [check, ...rest] = line.split("|");
    const substring = rest.join("|").trim();
    if (substring) accepted.push([check.trim(), substring]);
  }
}

const fresh = [];
const verifyByHand = [];
let known = 0;
for (const [check, detail] of issues) {
  if (accepted.some(([c, s]) => c === check && detail.includes(s))) known += 1;
  else if (check === "numeric-claim") verifyByHand.push(detail);
  else fresh.push([check, detail]);
}

const byCheck = new Map();
for (const [check, detail] of fresh) {
  if (!byCheck.has(check)) byCheck.set(check, []);
  byCheck.get(check).push(detail);
}

const ORDER = [
  "class-not-in-design",
  "styled-never-used",
  "quoted-string-mismatch",
  "name-used-two-ways",
  "dangling-reference",
  "open-item-incomplete",
  "unqualified-quantifier",
];
for (const check of ORDER) {
  if (byCheck.has(check)) {
    console.log(`\n${check}  (${byCheck.get(check).length})`);
    for (const d of byCheck.get(check)) console.log(`  - ${d}`);
  }
}
if (verifyByHand.length) {
  console.log(`\nverify by hand  (${verifyByHand.length}, does not fail the run)`);
  for (const d of verifyByHand) console.log(`  - ${d}`);
}

const tail = known ? ` (${known} accepted)` : "";
if (fresh.length) {
  console.log(`\n${fresh.length} NEW across ${byCheck.size} checks${tail}.`);
  process.exit(1);
}
console.log(`clean${tail}`);
