#!/usr/bin/env python3
"""validate-corpus-review — deterministic verdict machinery for the corpus credibility gate.

Implements reference/corpus-review-protocol.md (protocol v1). The skills never re-implement
any rule in that contract: the runner asks this script for the canonical manifest, the
closeout asks it for the gate verdict and the allowed STATE transition, and the sentinel
readers ask it whether a completion claim is still backed by receipts.

Modes:
  manifest          build and print the canonical manifest (+ the two hashes)
  validate-receipt  validate a candidate receipt document (--receipt PATH, --filename
                    NAME) against the frozen schema and the current corpus, before the
                    runner writes it into reviews/ — an incomplete reviewer result
                    becomes a failed attempt, never a receipt
  gate              full pre-close verdict (exit codes below)
  transition        compute the allowed STATE transition; --apply re-runs the gate, then
                    writes completion.json + STATE (resumable if interrupted between the
                    two writes). --closed-unreviewed --reason "..." takes the
                    administrative-archive path instead.
  check-completion  post-close validation for sentinel readers: re-derives the completion
                    claim from the record, the seals, and the receipts — never trusts the
                    sentinel line
  hash-self         print this file's own SHA-256 (contract maintenance)
  self-test         run the embedded deterministic fixture battery (also: --self-test)

Common options: --root DIR (project root, default .), --plugin-root DIR (defaults to
$CLAUDE_PLUGIN_ROOT), --json (machine-readable result on stdout).

Exit codes (distinct so callers report the reason, not just "blocked"):
  0 valid · 2 usage · 3 internal error · 10 no-marker/legacy · 11 validator-mismatch
  12 no-review · 13 stale-hash · 14 incomplete-receipt · 15 open-material-findings
  16 unreadable-files · 17 manifest-error · 18 allowlist-violation · 19 state-format
  20 ledger-malformed · 21 not-closed · 22 stale-or-invalid-completion
  23 closed-unreviewed · 24 criteria-drift
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import unicodedata
from collections import Counter
from datetime import datetime, timezone

PROTOCOL_VERSION = 1
SCHEMA_VERSION = "1.0"

E_OK = 0
E_USAGE = 2
E_INTERNAL = 3
E_LEGACY = 10
E_VALIDATOR_MISMATCH = 11
E_NO_REVIEW = 12
E_STALE_HASH = 13
E_INCOMPLETE_RECEIPT = 14
E_OPEN_MATERIAL = 15
E_UNREADABLE = 16
E_MANIFEST = 17
E_ALLOWLIST = 18
E_STATE_FORMAT = 19
E_LEDGER = 20
E_NOT_CLOSED = 21
E_STALE_COMPLETION = 22
E_CLOSED_UNREVIEWED = 23
E_CRITERIA_DRIFT = 24

# Precedence when several failure categories coexist (spec §9). The gate accumulates
# reasons across independent categories and exits with the first code in this order.
_GATE_PRECEDENCE = [
    E_VALIDATOR_MISMATCH, E_LEGACY, E_ALLOWLIST, E_MANIFEST, E_UNREADABLE,
    E_CRITERIA_DRIFT, E_LEDGER, E_NO_REVIEW, E_INCOMPLETE_RECEIPT, E_STALE_HASH,
    E_OPEN_MATERIAL,
]

CODE_NAMES = {
    E_OK: "valid", E_USAGE: "usage", E_INTERNAL: "internal-error",
    E_LEGACY: "no-marker", E_VALIDATOR_MISMATCH: "validator-mismatch",
    E_NO_REVIEW: "no-review", E_STALE_HASH: "stale-hash",
    E_INCOMPLETE_RECEIPT: "incomplete-receipt", E_OPEN_MATERIAL: "open-material-findings",
    E_UNREADABLE: "unreadable-files", E_MANIFEST: "manifest-error",
    E_ALLOWLIST: "allowlist-violation", E_STATE_FORMAT: "state-format",
    E_LEDGER: "ledger-malformed", E_NOT_CLOSED: "not-closed",
    E_STALE_COMPLETION: "stale-or-invalid-completion",
    E_CLOSED_UNREVIEWED: "closed-unreviewed", E_CRITERIA_DRIFT: "criteria-drift",
}

STATE_REL = "research/STATE.md"
PLAN_REL = "research/research-plan.md"
REVIEWS_REL = "research/reviews"
MARKER_REL = "research/reference/review-protocol.json"
INSTALLED_VALIDATOR_REL = "research/bin/validate-corpus-review.py"
CRITERIA_REL = "research/reference/completion-criteria.md"
COMPLETION_REL = "research/reviews/completion.json"
RESOLUTIONS_REL = "research/reviews/resolutions.md"
EXCEPTIONS_REL = "research/reviews/exceptions.md"
CONTRACT_PLUGIN_REL = "reference/review-protocol-contract.json"

EXCLUDED_EXACT = {
    "research/STATE.md",
    "research/commonplace.md",
    "research/reference/backstage-tasks.md",
}
EXCLUDED_PREFIXES = ("research/reviews/", "research/bin/")

# reviews/ allowlist. `.DS_Store` is tolerated (macOS Finder droppings, ignored entirely)
# per spec §2.2; everything else must match.
ALLOWLIST_PATTERNS = [
    re.compile(r"^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}-t[12]\.receipt\.json$"),
    re.compile(r"^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}-t[12]\.report\.md$"),
    re.compile(r"^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}(-t[12])?\.failed\.json$"),
    re.compile(r"^resolutions\.md$"),
    re.compile(r"^exceptions\.md$"),
    re.compile(r"^completion\.json$"),
    re.compile(r"^\.gitkeep$"),
]
SEAL_EXEMPT = {"completion.json", ".gitkeep", ".DS_Store"}

CHECK_IDS = ["C%d" % i for i in range(1, 16)]
COVERAGE_OUTCOMES = {"complete", "partial", "insufficient-coverage", "not-applicable"}
TIERS = {"t1", "t2"}

FINDING_CLASSES_WAIVABLE = {
    "completion-integrity", "conclusion-vs-brief", "cross-phase-consistency",
    "status-coherence", "falsifiability", "prerequisite-honesty", "instrument-validity",
    "evidence-selection", "load-bearing-confidence", "decision-rule-drift",
    "alternatives-risk-completeness", "corpus-standard-compliance", "temporal-coherence",
    "provenance-integrity", "quantitative-validity", "other",
}
FINDING_CLASSES_NONWAIVABLE = {"deliverable-missing", "internal-contradiction"}
FINDING_CLASSES = FINDING_CLASSES_WAIVABLE | FINDING_CLASSES_NONWAIVABLE

RECEIPT_NAME_RE = re.compile(r"^([0-9]{8}T[0-9]{6}Z)-([0-9a-f]{8})-(t[12])\.receipt\.json$")
SET_ID_RE = re.compile(r"^([0-9]{8}T[0-9]{6}Z)-([0-9a-f]{8})$")
EVIDENCE_RE = re.compile(r"^([^\s:][^:]*):([0-9]+)$")
HASH_RE = re.compile(r"^[0-9a-f]{64}$")
DATE_RE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
PROTOCOL_LINE_RE = re.compile(r"(?m)^Review protocol: v([0-9]+)\s*$")
CRITERION_ID_RE = re.compile(r"(?m)^-\s*(?:\[[ xX]\]\s*)?\*\*([A-Z][A-Z0-9]*-[0-9]+)\*\*")
CRITERION_TOKEN_RE = re.compile(r"\*\*([A-Z][A-Z0-9]*-[0-9]+)\*\*")
SENTINEL_VALIDATED_RE = re.compile(
    r"(?m)^- Completion: ALL PHASES COMPLETE — validated closeout (\S+) "
    r"\(review protocol v([0-9]+)\)\s*$")
SENTINEL_UNREVIEWED_RE = re.compile(
    r"(?m)^- Completion: CLOSED UNREVIEWED — administrative archive, not decision-ready "
    r"\(([0-9]{4}-[0-9]{2}-[0-9]{2})\)\s*$")
REF_RE = re.compile(r"^([^\s,/]+)/([^\s,/]+)$")


class Failure(Exception):
    """A determinate protocol failure with an exit code and reasons."""

    def __init__(self, code, reasons):
        self.code = code
        self.reasons = reasons if isinstance(reasons, list) else [reasons]
        super().__init__("; ".join(self.reasons))


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical_json(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode("utf-8")


def utc_now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_text(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# ---------------------------------------------------------------------------
# Manifest
# ---------------------------------------------------------------------------

def _is_dot_path(rel):
    return any(part.startswith(".") for part in rel.split("/"))


def _in_scope(rel):
    if rel == "CLAUDE.md":
        return True
    if not rel.startswith("research/"):
        return False
    if rel in EXCLUDED_EXACT:
        return False
    if any(rel.startswith(p) for p in EXCLUDED_PREFIXES):
        return False
    return True


def check_case_collisions(paths):
    """Return the list of casefold collision pairs among the given NFC paths."""
    seen = {}
    collisions = []
    for p in paths:
        key = p.casefold()
        if key in seen and seen[key] != p:
            collisions.append((seen[key], p))
        else:
            seen[key] = p
    return collisions


def build_manifest(root):
    """Build the canonical manifest. Raises Failure(E_MANIFEST|E_UNREADABLE)."""
    root = os.path.abspath(root)
    root_real = os.path.realpath(root)
    structural = []
    unreadable = []
    entries = []
    candidates = []

    claude_md = os.path.join(root, "CLAUDE.md")
    if os.path.lexists(claude_md):
        candidates.append(("CLAUDE.md", claude_md))

    research_dir = os.path.join(root, "research")
    if not os.path.isdir(research_dir):
        raise Failure(E_MANIFEST, "no research/ directory at root %s" % root)
    if os.path.islink(research_dir):
        raise Failure(E_MANIFEST,
                      "research/ is itself a symlink — the corpus root must be a real "
                      "directory inside the project")

    for dirpath, dirnames, filenames in os.walk(research_dir, followlinks=False):
        dirnames.sort()
        # A symlinked directory is an entry, not a directory: never descended, and its
        # target is subject to the same escape rule as a file symlink.
        for name in list(dirnames):
            full = os.path.join(dirpath, name)
            if os.path.islink(full):
                dirnames.remove(name)
                rel = os.path.relpath(full, root).replace(os.sep, "/")
                candidates.append((rel, full))
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            candidates.append((rel, full))

    for rel_raw, full in candidates:
        rel = unicodedata.normalize("NFC", rel_raw)
        if _is_dot_path(rel):
            continue
        if not _in_scope(rel):
            continue
        if os.path.islink(full):
            target = os.readlink(full)
            resolved = os.path.realpath(full)
            if not (resolved == root_real or resolved.startswith(root_real + os.sep)):
                structural.append("symlink escapes project root: %s -> %s" % (rel, target))
                continue
            entries.append({"path": rel, "link": target})
            continue
        try:
            digest = sha256_file(full)
            size = os.path.getsize(full)
        except OSError as exc:
            unreadable.append("%s (%s)" % (rel, exc.strerror or "unreadable"))
            continue
        entries.append({"path": rel, "sha256": digest, "bytes": size})

    paths = [e["path"] for e in entries]
    if len(paths) != len(set(paths)):
        dupes = sorted({p for p in paths if paths.count(p) > 1})
        structural.append("duplicate manifest paths: %s" % ", ".join(dupes))
    for a, b in check_case_collisions(paths):
        structural.append("case collision: %s vs %s" % (a, b))

    state_path = os.path.join(root, STATE_REL)
    state_entry = None
    if os.path.islink(state_path):
        structural.append("%s is a symlink — STATE must be a regular file" % STATE_REL)
    elif not os.path.isfile(state_path):
        structural.append("missing %s" % STATE_REL)
    else:
        try:
            state_entry = {"path": STATE_REL, "sha256": sha256_file(state_path),
                           "bytes": os.path.getsize(state_path)}
        except OSError as exc:
            unreadable.append("%s (%s)" % (STATE_REL, exc.strerror or "unreadable"))

    if structural:
        raise Failure(E_MANIFEST, structural)
    if unreadable:
        raise Failure(E_UNREADABLE, ["unreadable in-scope file: %s" % u for u in unreadable])

    entries.sort(key=lambda e: e["path"].encode("utf-8"))
    corpus_hash = sha256_bytes(canonical_json(entries))
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now_iso(),
        "root": root,
        "files": entries,
        "state": state_entry,
        "decision_corpus_hash": corpus_hash,
        "state_hash": state_entry["sha256"],
        "file_count": len(entries),
        "total_bytes": sum(e.get("bytes", 0) for e in entries),
    }


def manifest_paths(manifest):
    """The set of citable paths: every manifest entry plus STATE (in scope for review)."""
    return {e["path"] for e in manifest["files"]} | {STATE_REL}


# ---------------------------------------------------------------------------
# Protocol / trust contract
# ---------------------------------------------------------------------------

def protocol_status(root, plugin_root):
    """Return the adopted protocol version, or raise Failure(E_LEGACY|E_VALIDATOR_MISMATCH)."""
    state_path = os.path.join(root, STATE_REL)
    state_text = read_text(state_path) if os.path.isfile(state_path) else ""
    matches = PROTOCOL_LINE_RE.findall(state_text)
    marker_path = os.path.join(root, MARKER_REL)
    marker = None
    if os.path.isfile(marker_path):
        try:
            marker = json.loads(read_text(marker_path))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise Failure(E_VALIDATOR_MISMATCH,
                          "protocol marker %s is unparseable — repair via re-init" % MARKER_REL)

    if not matches and marker is None:
        raise Failure(E_LEGACY,
                      "legacy project: no 'Review protocol' line in STATE and no marker — "
                      "pre-W7 behavior, no credibility gate")
    if len(matches) > 1:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "STATE carries %d 'Review protocol' lines — exactly one is allowed; "
                      "repair via re-init" % len(matches))
    if not matches or marker is None:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "partial protocol state (marker and STATE line must both exist) — "
                      "damage, not legacy; repair via re-init")
    # The discriminator must live in the header block, before the first section heading.
    header = state_text.split("\n## ", 1)[0]
    if not PROTOCOL_LINE_RE.search(header):
        raise Failure(E_VALIDATOR_MISMATCH,
                      "'Review protocol' line found outside STATE's header block — "
                      "repair via re-init")
    line_v = int(matches[0])
    marker_v = marker.get("protocol_version")
    if marker_v != line_v:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "protocol version mismatch: STATE says v%d, marker says %r — "
                      "repair via re-init" % (line_v, marker_v))

    installed = os.path.join(root, INSTALLED_VALIDATOR_REL)
    if not os.path.isfile(installed):
        raise Failure(E_VALIDATOR_MISMATCH,
                      "installed validator missing (%s) — repair via re-init"
                      % INSTALLED_VALIDATOR_REL)
    if not plugin_root:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "plugin contract unreachable: no --plugin-root and no "
                      "$CLAUDE_PLUGIN_ROOT — the trust anchor lives in the shipped plugin")
    contract_path = os.path.join(plugin_root, CONTRACT_PLUGIN_REL)
    if not os.path.isfile(contract_path):
        raise Failure(E_VALIDATOR_MISMATCH,
                      "plugin contract missing at %s" % contract_path)
    try:
        contract = json.loads(read_text(contract_path))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise Failure(E_VALIDATOR_MISMATCH, "plugin contract unparseable: %s" % contract_path)
    if contract.get("schema_version") != SCHEMA_VERSION:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "plugin contract schema_version %r is not %s"
                      % (contract.get("schema_version"), SCHEMA_VERSION))
    entry = (contract.get("protocols") or {}).get(str(line_v))
    if not entry or "validator_sha256" not in entry:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "plugin contract has no entry for protocol v%d" % line_v)
    if entry.get("schema_version") != SCHEMA_VERSION:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "plugin contract protocol entry schema_version %r is not %s"
                      % (entry.get("schema_version"), SCHEMA_VERSION))
    actual = sha256_file(installed)
    if actual != entry["validator_sha256"]:
        raise Failure(E_VALIDATOR_MISMATCH,
                      "installed validator hash %s… does not match the shipped contract's "
                      "expected %s… — repair via re-init"
                      % (actual[:12], entry["validator_sha256"][:12]))
    return line_v


# ---------------------------------------------------------------------------
# Reviews directory / criteria
# ---------------------------------------------------------------------------

def check_allowlist(root):
    reviews = os.path.join(root, REVIEWS_REL)
    if not os.path.isdir(reviews):
        return
    bad = []
    for name in sorted(os.listdir(reviews)):
        if name == ".DS_Store":
            continue
        full = os.path.join(reviews, name)
        if os.path.isdir(full):
            bad.append(name + "/ (no subdirectories allowed)")
            continue
        if not any(p.match(name) for p in ALLOWLIST_PATTERNS):
            bad.append(name)
    if bad:
        raise Failure(E_ALLOWLIST,
                      ["unexpected file in %s/: %s — reviews/ must not park "
                       "decision-bearing material" % (REVIEWS_REL, n) for n in bad])


def criteria_context(root):
    """What the on-disk completion-criteria file demands of C1. In structured mode the
    canonical file must be non-empty, unique, and in exact ID agreement with the research
    plan's generated criteria references (spec §7). Raises Failure(E_CRITERIA_DRIFT)."""
    path = os.path.join(root, CRITERIA_REL)
    if not os.path.isfile(path):
        return {"mode": "legacy-prose", "path": None, "sha256": None, "ids": []}
    ids = CRITERION_ID_RE.findall(read_text(path))
    problems = []
    if not ids:
        problems.append("%s exists but defines no criterion IDs — an empty canonical "
                        "criteria set cannot gate C1" % CRITERIA_REL)
    dupes = sorted({i for i, n in Counter(ids).items() if n > 1})
    if dupes:
        problems.append("duplicate criterion IDs in %s: %s" % (CRITERIA_REL, ", ".join(dupes)))
    plan_path = os.path.join(root, PLAN_REL)
    if not os.path.isfile(plan_path):
        problems.append("structured criteria mode requires %s (its criteria section is "
                        "generated from the canonical file)" % PLAN_REL)
    else:
        plan_ids = set(CRITERION_TOKEN_RE.findall(read_text(plan_path)))
        want = set(ids)
        if plan_ids != want:
            missing = sorted(want - plan_ids)
            extra = sorted(plan_ids - want)
            detail = []
            if missing:
                detail.append("missing from plan: %s" % ", ".join(missing))
            if extra:
                detail.append("in plan but not canonical: %s" % ", ".join(extra))
            problems.append("criterion ID drift between %s and %s (%s)"
                            % (CRITERIA_REL, PLAN_REL, "; ".join(detail)))
    if problems:
        raise Failure(E_CRITERIA_DRIFT, problems)
    return {"mode": "structured", "path": CRITERIA_REL, "sha256": sha256_file(path),
            "ids": ids}


# ---------------------------------------------------------------------------
# Receipts
# ---------------------------------------------------------------------------

def _require(obj, field, problems, label=""):
    if not isinstance(obj, dict) or field not in obj:
        problems.append("missing field: %s%s" % (label, field))
        return None
    return obj[field]


def validate_receipt(receipt, filename, criteria, citable_paths):
    """Validate one parsed receipt against the frozen schema. Returns
    (problems, coverage: {check_id: outcome}, material_findings, insufficient)."""
    problems = []
    m = RECEIPT_NAME_RE.match(filename)
    if not m:
        problems.append("filename does not match <review_id>.receipt.json grammar")
    if receipt.get("schema_version") != SCHEMA_VERSION:
        problems.append("unknown schema_version %r" % receipt.get("schema_version"))

    for field in ("review_id", "review_set_id", "run_kind", "review_set_plan", "reviewer",
                  "execution", "corpus", "criteria_mode", "criteria_binding", "checks",
                  "verdict", "findings"):
        _require(receipt, field, problems)

    review_id = receipt.get("review_id", "")
    if m and review_id != filename[:-len(".receipt.json")]:
        problems.append("embedded review_id %r differs from filename" % review_id)
    corpus = receipt.get("corpus") or {}
    corpus_hash = corpus.get("decision_corpus_hash", "")
    if not (isinstance(corpus_hash, str) and HASH_RE.match(corpus_hash)):
        problems.append("corpus.decision_corpus_hash is not a full sha256 hex digest")
    elif m and m.group(2) != corpus_hash[:8]:
        problems.append("review_id hash8 %s does not bind to decision_corpus_hash %s… — "
                        "receipt content and identity disagree" % (m.group(2), corpus_hash[:8]))
    set_id = receipt.get("review_set_id", "")
    sm = SET_ID_RE.match(set_id or "")
    if not sm:
        problems.append("review_set_id %r does not match <UTC-stamp>-<hash8>" % set_id)
    elif HASH_RE.match(corpus_hash or "") and sm.group(2) != corpus_hash[:8]:
        problems.append("review_set_id hash8 does not bind to decision_corpus_hash")
    if receipt.get("run_kind") not in ("final-closeout", "on-demand"):
        problems.append("run_kind must be final-closeout | on-demand")

    plan = receipt.get("review_set_plan") or {}
    tiers_planned = plan.get("tiers_planned")
    if not (isinstance(tiers_planned, list) and tiers_planned
            and set(tiers_planned) <= TIERS):
        problems.append("review_set_plan.tiers_planned must be a non-empty subset of t1/t2")
    elif receipt.get("run_kind") == "final-closeout" and set(tiers_planned) != TIERS:
        problems.append("a final-closeout set always plans both tiers — single-sampler "
                        "composition is recorded via failed attempts, never by planning "
                        "one tier")

    reviewer = receipt.get("reviewer") or {}
    for field in ("tier", "engine", "engine_version", "sampler_label", "fallback_chain"):
        _require(reviewer, field, problems, "reviewer.")
    if reviewer.get("tier") not in TIERS:
        problems.append("reviewer.tier must be t1 | t2")
    elif m and reviewer.get("tier") != m.group(3):
        problems.append("reviewer.tier %s does not match the filename tier %s"
                        % (reviewer.get("tier"), m.group(3)))
    if not isinstance(reviewer.get("fallback_chain"), list):
        problems.append("reviewer.fallback_chain must be a list")

    execution = receipt.get("execution") or {}
    for field in ("started_at", "ended_at", "duration_seconds", "timeout_seconds",
                  "exit_status", "truncation_detected"):
        _require(execution, field, problems, "execution.")
    if execution.get("exit_status") != 0:
        problems.append("execution.exit_status != 0 — this is a failed attempt, not a receipt")
    if execution.get("truncation_detected"):
        problems.append("execution.truncation_detected — this is a failed attempt")

    for field in ("preclose_state_hash", "file_count", "total_bytes", "unreadable_files"):
        _require(corpus, field, problems, "corpus.")
    if not isinstance(corpus.get("file_count"), int) or \
            not isinstance(corpus.get("total_bytes"), int):
        problems.append("corpus.file_count and corpus.total_bytes must be integers")
    if corpus.get("unreadable_files"):
        problems.append("corpus.unreadable_files is non-empty — the run should never have "
                        "produced a receipt")

    # Findings
    findings = receipt.get("findings")
    findings = findings if isinstance(findings, list) else []
    finding_ids = set()
    findings_by_id = {}
    material = []
    for f in findings:
        fid = f.get("id", "?")
        if fid in finding_ids:
            problems.append("duplicate finding id %s" % fid)
        finding_ids.add(fid)
        findings_by_id[fid] = f
        if f.get("class") not in FINDING_CLASSES:
            problems.append("finding %s: class %r outside the closed enum" % (fid, f.get("class")))
        if f.get("severity") not in ("material", "minor"):
            problems.append("finding %s: severity must be material | minor" % fid)
        if f.get("waivability_class_advisory") not in ("waivable", "non-waivable"):
            problems.append("finding %s: waivability_class_advisory must be "
                            "waivable | non-waivable (advisory only)" % fid)
        evidence = f.get("evidence")
        if not (isinstance(evidence, list) and evidence):
            problems.append("finding %s: empty evidence — every finding must cite" % fid)
        else:
            for ev in evidence:
                em = EVIDENCE_RE.match(ev) if isinstance(ev, str) else None
                if not em:
                    problems.append("finding %s: evidence %r is not <path>:<line>" % (fid, ev))
                elif em.group(1) not in citable_paths:
                    problems.append("finding %s: evidence path %s is not in the reviewed "
                                    "corpus" % (fid, em.group(1)))
        for req in ("observed", "criterion_violated", "decision_impact",
                    "closure_evidence_required"):
            if not f.get(req):
                problems.append("finding %s: missing %s" % (fid, req))
        if f.get("severity") == "material":
            material.append(f)

    # Checks
    checks = receipt.get("checks")
    checks = checks if isinstance(checks, list) else []
    seen = {}
    referenced = set()
    coverage = {}
    insufficient = []
    for c in checks:
        cid = c.get("id")
        if cid not in CHECK_IDS:
            problems.append("check id %r outside C1-C15" % cid)
            continue
        if cid in seen:
            problems.append("duplicate check %s" % cid)
        seen[cid] = c
        status = c.get("status")
        outcome = c.get("coverage_outcome")
        if status not in ("run", "n/a"):
            problems.append("check %s: status must be run | n/a" % cid)
        if outcome not in COVERAGE_OUTCOMES:
            problems.append("check %s: coverage_outcome %r outside the enum" % (cid, outcome))
        if (status == "n/a") != (outcome == "not-applicable"):
            problems.append("check %s: status n/a and coverage_outcome not-applicable must "
                            "travel together" % cid)
        if not c.get("coverage_note"):
            problems.append("check %s: coverage_note is required for every check "
                            "(honest coverage is the contract)" % cid)
        files = c.get("files_examined")
        files = files if isinstance(files, list) else []
        for fp in files:
            if fp not in citable_paths:
                problems.append("check %s: files_examined path %r is not in the reviewed "
                                "corpus" % (cid, fp))
        if status == "run" and not files:
            outcome = "insufficient-coverage"  # forced, by definition
        coverage[cid] = outcome
        if outcome == "insufficient-coverage":
            insufficient.append(cid)
        for fid in c.get("finding_ids") or []:
            referenced.add(fid)
            if fid not in finding_ids:
                problems.append("check %s references undefined finding %s" % (cid, fid))
    missing = [cid for cid in CHECK_IDS if cid not in seen]
    if missing:
        problems.append("checks missing: %s (all fifteen must be present)" % ", ".join(missing))
    unreferenced = finding_ids - referenced
    if unreferenced:
        problems.append("findings referenced by no check: %s" % ", ".join(sorted(unreferenced)))

    # Verdict consistency (verdict asymmetry, spec §3): the recorded verdict must agree
    # with the receipt's own blocking content in both directions.
    has_block = bool(material) or bool(insufficient)
    verdict = receipt.get("verdict")
    if verdict not in ("ready", "not-ready"):
        problems.append("verdict must be ready | not-ready")
    elif verdict == "not-ready" and not has_block:
        problems.append("verdict not-ready with no material finding and no "
                        "insufficient-coverage check — a negative assessment must carry "
                        "its blocking evidence")
    elif verdict == "ready" and has_block:
        problems.append("verdict ready alongside material findings or insufficient "
                        "coverage — internally inconsistent receipt")

    # C1 criteria binding
    mode = receipt.get("criteria_mode")
    binding = receipt.get("criteria_binding") or {}
    c1_finding_ids = set((seen.get("C1") or {}).get("finding_ids") or [])
    if mode != criteria["mode"]:
        problems.append("criteria_mode %r does not match the project on disk (%s)"
                        % (mode, criteria["mode"]))
    elif mode == "structured":
        if binding.get("path") != criteria["path"]:
            problems.append("criteria_binding.path must be %s" % criteria["path"])
        if binding.get("sha256") != criteria["sha256"]:
            problems.append("criteria_binding.sha256 does not match the on-disk criteria file")
        listed = {}
        for entry in binding.get("criteria") or []:
            cid_ = entry.get("id")
            if cid_ in listed:
                problems.append("criterion %s listed twice in criteria_binding" % cid_)
            listed[cid_] = entry
        extra_ids = [i for i in listed if i not in criteria["ids"]]
        if extra_ids:
            problems.append("criteria_binding lists IDs not in the canonical file: %s"
                            % ", ".join(sorted(extra_ids)))
        missing_ids = [i for i in criteria["ids"] if i not in listed]
        if missing_ids:
            coverage["C1"] = "insufficient-coverage"
            if "C1" not in insufficient:
                insufficient.append("C1")
        for cid_, entry in listed.items():
            disp = entry.get("disposition")
            if disp not in ("met", "unmet", "waived-with-record"):
                problems.append("criterion %s: disposition %r invalid" % (cid_, disp))
            elif disp == "unmet":
                links = entry.get("finding_ids") or []
                linked_material = [
                    fid for fid in links
                    if fid in c1_finding_ids
                    and findings_by_id.get(fid, {}).get("severity") == "material"]
                if not linked_material:
                    problems.append("criterion %s is unmet but links no material C1 "
                                    "finding — an unmet criterion must gate through a "
                                    "finding" % cid_)
            elif disp == "waived-with-record":
                record = entry.get("record") or ""
                rm = EVIDENCE_RE.match(record)
                if not rm:
                    problems.append("criterion %s: waived-with-record requires a record "
                                    "citation (<path>:<line> of the recorded waiver)" % cid_)
                elif rm.group(1) not in citable_paths:
                    problems.append("criterion %s: waiver record path %s is not in the "
                                    "reviewed corpus" % (cid_, rm.group(1)))
    elif mode == "legacy-prose":
        if binding.get("path") != PLAN_REL:
            problems.append("legacy-prose criteria_binding.path must be %s" % PLAN_REL)
        if binding.get("criteria") != []:
            problems.append("legacy-prose criteria must be [] — prose criteria are "
                            "enumerated in the reviewer's analysis, never as structured "
                            "dispositions")
        c1 = seen.get("C1") or {}
        if c1.get("status") != "run":
            problems.append("legacy-prose C1 must be run — a corpus with a research plan "
                            "always has completion criteria to assess; n/a is a dodge")
        if coverage.get("C1") == "complete":
            problems.append("legacy-prose C1 coverage can be at best partial — never "
                            "presented as equivalent to structured criteria")

    return problems, coverage, material, insufficient


def load_review_sets(root, criteria, citable_paths):
    """Parse every receipt/failed record. Returns (sets, malformed, failed_attempts)."""
    reviews = os.path.join(root, REVIEWS_REL)
    sets = {}
    malformed = []
    failed = []
    if not os.path.isdir(reviews):
        return sets, malformed, failed
    for name in sorted(os.listdir(reviews)):
        full = os.path.join(reviews, name)
        if name.endswith(".failed.json"):
            failed.append(name)
            continue
        if not name.endswith(".receipt.json"):
            continue
        try:
            receipt = json.loads(read_text(full))
        except (json.JSONDecodeError, UnicodeDecodeError):
            malformed.append("%s: unparseable JSON (truncated or corrupt — a failed "
                             "attempt, never a receipt)" % name)
            continue
        problems, coverage, material, insufficient = validate_receipt(
            receipt, name, criteria, citable_paths)
        rec = {"receipt": receipt, "filename": name, "problems": problems,
               "coverage": coverage, "material": material, "insufficient": insufficient}
        set_id = receipt.get("review_set_id") or "unknown-set"
        sets.setdefault(set_id, []).append(rec)
    return sets, malformed, failed


# ---------------------------------------------------------------------------
# Ledgers
# ---------------------------------------------------------------------------

_ENTRY_HEAD_RE = re.compile(r"(?m)^## ([RE])-([0-9]+)(?::\s*(.*))?$")
_FIELD_RE = re.compile(r"^- ([^:]+):\s*(.*)$")


def parse_ledger(path, kind, required_fields):
    """Parse an append-only ledger. Returns entries; raises Failure(E_LEDGER)."""
    if not os.path.isfile(path):
        return []
    text = read_text(path)
    heads = list(_ENTRY_HEAD_RE.finditer(text))
    entries = []
    errors = []
    seen_ids = set()
    for i, head in enumerate(heads):
        entry_id = "%s-%s" % (head.group(1), head.group(2))
        if head.group(1) != kind:
            errors.append("entry %s: wrong entry kind for this ledger" % entry_id)
            continue
        if entry_id in seen_ids:
            errors.append("%s: duplicate entry id" % entry_id)
            continue
        seen_ids.add(entry_id)
        body = text[head.end():heads[i + 1].start() if i + 1 < len(heads) else len(text)]
        fields = {}
        current = None
        for line in body.splitlines():
            fm = _FIELD_RE.match(line)
            if fm:
                current = fm.group(1).strip()
                fields[current] = fm.group(2).strip()
            elif current and line.strip():
                fields[current] += " " + line.strip()
        missing = [f for f in required_fields if not fields.get(f)]
        if missing:
            errors.append("%s: missing or empty fields: %s" % (entry_id, ", ".join(missing)))
            continue
        if not DATE_RE.match(fields.get("Date", "")):
            errors.append("%s: Date must be YYYY-MM-DD" % entry_id)
            continue
        refs = []
        for raw in fields["Refs"].split(","):
            raw = raw.strip()
            rm = REF_RE.match(raw)
            if not rm:
                errors.append("%s: ref %r is not <review_id>/<finding_id>" % (entry_id, raw))
                continue
            refs.append((rm.group(1), rm.group(2)))
        entries.append({"id": entry_id, "fields": fields, "refs": refs})
    if errors:
        raise Failure(E_LEDGER, ["%s: %s" % (os.path.basename(path), e) for e in errors])
    return entries


def load_ledgers(root):
    resolutions = parse_ledger(
        os.path.join(root, RESOLUTIONS_REL), "R",
        ["Refs", "Action", "Date", "Closure evidence"])
    for r in resolutions:
        if r["fields"]["Action"] not in ("reconciled", "rejected-with-record"):
            raise Failure(E_LEDGER, "%s: Action must be reconciled | rejected-with-record "
                          "(exceptions live in their own ledger)" % r["id"])
    exceptions = parse_ledger(
        os.path.join(root, EXCEPTIONS_REL), "E",
        ["Refs", "Class", "Commissioner rationale (verbatim)",
         "Decision impact and risk accepted", "Binds to decision_corpus_hash",
         "Affected deliverables", "Date"])
    for e in exceptions:
        if not HASH_RE.match(e["fields"]["Binds to decision_corpus_hash"]):
            raise Failure(E_LEDGER, "%s: 'Binds to decision_corpus_hash' must be a full "
                          "sha256 hex digest" % e["id"])
    return resolutions, exceptions


def compute_open_findings(members, corpus_hash, resolutions, exceptions, citable_paths):
    """The closure rule (spec §9 step 7) over the union of a review set's material
    findings. Returns the list of open-finding reasons (empty = all closed)."""
    reasons = []
    exception_index = {}
    for e in exceptions:
        for ref in e["refs"]:
            exception_index.setdefault(ref, []).append(e)
    rejected_index = {}
    reconciled_refs = set()
    for res in resolutions:
        for ref in res["refs"]:
            if res["fields"]["Action"] == "rejected-with-record":
                rejected_index[ref] = res
            else:
                reconciled_refs.add(ref)

    for r in members:
        rid = r["receipt"]["review_id"]
        if r["insufficient"]:
            reasons.append("%s: insufficient-coverage on %s — blocks exactly like an "
                           "open material finding"
                           % (r["filename"], ", ".join(sorted(set(r["insufficient"])))))
        for f in r["material"]:
            ref = (rid, f["id"])
            label = "%s/%s (%s)" % (rid, f["id"], f["class"])
            rejection = rejected_index.get(ref)
            if rejection is not None:
                cites = [em for em in
                         (EVIDENCE_RE.match(tok.rstrip(".,;")) for tok in
                          rejection["fields"]["Closure evidence"].split())
                         if em]
                in_corpus = [em for em in cites if em.group(1) in citable_paths]
                if not in_corpus:
                    reasons.append("%s: rejected-with-record entry %s carries no in-corpus "
                                   "file:line citation — a rejection must refute with "
                                   "evidence; the finding remains open"
                                   % (label, rejection["id"]))
                continue
            if ref in reconciled_refs:
                reasons.append(
                    "%s: marked reconciled against the current review set — a real "
                    "reconciliation changes the corpus hash and requires a fresh review; "
                    "this finding remains open" % label)
                continue
            covers = exception_index.get(ref, [])
            closed = False
            for e in covers:
                if f["class"] in FINDING_CLASSES_NONWAIVABLE:
                    reasons.append(
                        "%s: exception %s recorded against a non-waivable class — "
                        "waivability is validator-owned; the finding remains open"
                        % (label, e["id"]))
                    continue
                if e["fields"]["Class"] != f["class"]:
                    reasons.append(
                        "%s: exception %s names class %r but the finding is %r — an "
                        "exception must name what it accepts; the finding remains open"
                        % (label, e["id"], e["fields"]["Class"], f["class"]))
                    continue
                bound = e["fields"]["Binds to decision_corpus_hash"]
                if bound != corpus_hash:
                    reasons.append(
                        "%s: exception %s expired — it binds to %s…, corpus is now %s…"
                        % (label, e["id"], bound[:12], corpus_hash[:12]))
                    continue
                deliverables = [d.strip() for d in
                                e["fields"]["Affected deliverables"].split(",") if d.strip()]
                outside = [d for d in deliverables if d not in citable_paths]
                if outside:
                    reasons.append(
                        "%s: exception %s names affected deliverables outside the corpus "
                        "(%s); the finding remains open"
                        % (label, e["id"], ", ".join(outside)))
                    continue
                closed = True
            if not closed and not covers:
                reasons.append("%s: open material finding with no closure" % label)
    return reasons


# ---------------------------------------------------------------------------
# The gate
# ---------------------------------------------------------------------------

def run_gate(root, plugin_root):
    """Full pre-close verdict. Accumulates reasons across independent failure categories
    and raises Failure with the highest-precedence code (spec §9)."""
    protocol_v = protocol_status(root, plugin_root)  # legacy/damage: immediate, exclusive

    failures = []  # (code, [reasons])

    try:
        check_allowlist(root)
    except Failure as exc:
        failures.append((exc.code, exc.reasons))

    manifest = None
    try:
        manifest = build_manifest(root)
    except Failure as exc:
        failures.append((exc.code, exc.reasons))

    resolutions = exceptions = None
    try:
        resolutions, exceptions = load_ledgers(root)
    except Failure as exc:
        failures.append((exc.code, exc.reasons))

    criteria = None
    try:
        criteria = criteria_context(root)
    except Failure as exc:
        failures.append((exc.code, exc.reasons))

    result = None
    if manifest is not None and criteria is not None:
        citable = manifest_paths(manifest)
        sets, malformed, failed_attempts = load_review_sets(root, criteria, citable)
        final_sets = {sid: recs for sid, recs in sets.items()
                      if any(r["receipt"].get("run_kind") == "final-closeout" for r in recs)}
        if malformed:
            failures.append((E_INCOMPLETE_RECEIPT, malformed))
        if not final_sets:
            if not malformed:
                reasons = ["no final-closeout review set found"]
                if failed_attempts:
                    reasons.append("failed attempts on record: %s — both-tiers-unavailable "
                                   "means the project cannot take the normal completion "
                                   "sentinel" % ", ".join(failed_attempts))
                failures.append((E_NO_REVIEW, reasons))
        else:
            latest_id = max(final_sets)
            members = final_sets[latest_id]
            set_problems = []
            kinds = {r["receipt"].get("run_kind") for r in members}
            if kinds != {"final-closeout"}:
                set_problems.append("review set %s mixes run_kind values %s"
                                    % (latest_id, sorted(kinds)))
            tiers_seen = [r["receipt"].get("reviewer", {}).get("tier") for r in members]
            dupes = sorted({t for t, n in Counter(tiers_seen).items() if n > 1})
            if dupes:
                set_problems.append("review set %s has duplicate receipts for tier %s"
                                    % (latest_id, ", ".join(map(str, dupes))))
            invalid = ["%s: %s" % (r["filename"], p)
                       for r in members for p in r["problems"]]
            if invalid or set_problems:
                failures.append((E_INCOMPLETE_RECEIPT, set_problems + invalid))
            else:
                stale = []
                for r in members:
                    c = r["receipt"]["corpus"]
                    if c["decision_corpus_hash"] != manifest["decision_corpus_hash"]:
                        stale.append("%s: decision_corpus_hash %s… != current %s… — the "
                                     "corpus changed since review"
                                     % (r["filename"], c["decision_corpus_hash"][:12],
                                        manifest["decision_corpus_hash"][:12]))
                    if c["preclose_state_hash"] != manifest["state_hash"]:
                        stale.append("%s: preclose_state_hash does not match current STATE"
                                     % r["filename"])
                if stale:
                    failures.append((E_STALE_HASH, stale))
                elif resolutions is not None:
                    open_reasons = compute_open_findings(
                        members, manifest["decision_corpus_hash"], resolutions,
                        exceptions, citable)
                    if open_reasons:
                        failures.append((E_OPEN_MATERIAL, open_reasons))
                    else:
                        result = {
                            "status": "valid",
                            "protocol_version": protocol_v,
                            "review_set_id": latest_id,
                            "review_ids": [r["receipt"]["review_id"] for r in members],
                            "set_composition": {
                                "receipts": [r["filename"] for r in members],
                                "failed_attempts": failed_attempts,
                            },
                            "decision_corpus_hash": manifest["decision_corpus_hash"],
                            "state_hash": manifest["state_hash"],
                            "verdicts_recorded": {
                                r["receipt"]["review_id"]: r["receipt"]["verdict"]
                                for r in members},
                            "note": "reviewer 'ready' verdicts are recorded but never "
                                    "sufficient; this PASS derives from valid receipts + "
                                    "zero open material findings",
                        }

    if failures:
        all_reasons = []
        for code in _GATE_PRECEDENCE:
            for fcode, reasons in failures:
                if fcode == code:
                    all_reasons.extend(reasons)
        top = min((fcode for fcode, _ in failures),
                  key=lambda c: _GATE_PRECEDENCE.index(c)
                  if c in _GATE_PRECEDENCE else len(_GATE_PRECEDENCE))
        raise Failure(top, all_reasons)
    return result


def run_validate_receipt(root, receipt_path, filename=None):
    """Runner preflight (spec §2, runner duty 4): validate one candidate receipt document
    against the frozen schema and the current corpus, before it is written into
    research/reviews/. Additive mode (stage 3) — no schema or verdict-logic change; the
    runner uses it so an unparseable or incomplete reviewer result becomes a failed
    attempt, never a receipt, without re-implementing any §3 rule.

    `filename` is the intended `<review_id>.receipt.json` name (default: the candidate
    file's basename) — the candidate lives outside reviews/, so identity bindings are
    checked against the name it would be written under."""
    manifest = build_manifest(root)
    criteria = criteria_context(root)
    filename = filename or os.path.basename(receipt_path)
    try:
        receipt = json.loads(read_text(receipt_path))
    except OSError as exc:
        raise Failure(E_USAGE, "cannot read candidate receipt %s: %s" % (receipt_path, exc))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise Failure(E_INCOMPLETE_RECEIPT,
                      "candidate is unparseable JSON (truncated or corrupt — a failed "
                      "attempt, never a receipt)")
    if not isinstance(receipt, dict):
        raise Failure(E_INCOMPLETE_RECEIPT,
                      "candidate is not a JSON object — a failed attempt, never a receipt")
    try:
        problems, coverage, material, insufficient = validate_receipt(
            receipt, filename, criteria, manifest_paths(manifest))
    except (TypeError, AttributeError) as exc:
        # A parseable candidate whose members have the wrong shapes (a string where a
        # finding object belongs, a list where a block belongs) is an incomplete reviewer
        # result — the runner records it as a failed attempt, never an internal error.
        # Scoped to this additive mode only; gate behavior is untouched.
        raise Failure(E_INCOMPLETE_RECEIPT,
                      "candidate receipt is structurally malformed (%r) — a failed "
                      "attempt, never a receipt" % exc)
    if problems:
        raise Failure(E_INCOMPLETE_RECEIPT, problems)
    corpus = receipt["corpus"]
    stale = []
    if corpus["decision_corpus_hash"] != manifest["decision_corpus_hash"]:
        stale.append("decision_corpus_hash %s… != current %s… — the corpus changed "
                     "since (or during) the review"
                     % (corpus["decision_corpus_hash"][:12],
                        manifest["decision_corpus_hash"][:12]))
    if corpus["preclose_state_hash"] != manifest["state_hash"]:
        stale.append("preclose_state_hash does not match current STATE")
    if stale:
        raise Failure(E_STALE_HASH, stale)
    return {
        "status": "valid",
        "filename": filename,
        "review_id": receipt["review_id"],
        "review_set_id": receipt["review_set_id"],
        "run_kind": receipt["run_kind"],
        "tier": receipt["reviewer"]["tier"],
        "verdict_recorded": receipt["verdict"],
        "material_findings": len(material),
        "insufficient_coverage_checks": insufficient,
        "coverage": coverage,
        "note": "document-level validity only — the gate verdict is `gate`'s job",
    }


# ---------------------------------------------------------------------------
# STATE transition
# ---------------------------------------------------------------------------

def _find_section(lines, heading):
    start = None
    for i, line in enumerate(lines):
        if line.strip() == heading:
            start = i
            break
    if start is None:
        raise Failure(E_STATE_FORMAT, "STATE has no '%s' section" % heading)
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if lines[j].startswith("## "):
            end = j
            break
    return start, end


PHASE_LINE_RE = re.compile(r"^- \[( |x)\] (Phase ([^:]+):.*)$")
STEP_RE = {name: re.compile(r"^- \[( |x)\] \*\*%s\*\*" % name)
           for name in ("Collect", "Connect", "Assess", "Synthesize", "Verify")}


def compute_transition(state_text, review_set_id, corpus_hash, today):
    """The four allowed operations (spec §6.2), scoped to the final phase.
    Returns the post-close STATE text."""
    if SENTINEL_VALIDATED_RE.search(state_text) or SENTINEL_UNREVIEWED_RE.search(state_text):
        raise Failure(E_STATE_FORMAT, "STATE already carries a completion sentinel")
    lines = state_text.splitlines()

    # Locate the final phase in Completed Phases; every non-final phase must be checked.
    cp_start, cp_end = _find_section(lines, "## Completed Phases")
    phase_idx = [i for i in range(cp_start + 1, cp_end) if PHASE_LINE_RE.match(lines[i])]
    if not phase_idx:
        raise Failure(E_STATE_FORMAT, "Completed Phases lists no phases")
    final_i = phase_idx[-1]
    for i in phase_idx[:-1]:
        if PHASE_LINE_RE.match(lines[i]).group(1) != "x":
            raise Failure(E_STATE_FORMAT,
                          "non-final phase unchecked (%s) — the project is not at final "
                          "closeout" % lines[i].strip())
    fm = PHASE_LINE_RE.match(lines[final_i])
    if fm.group(1) == "x":
        raise Failure(E_STATE_FORMAT, "final phase already checked — nothing to close")
    final_label = fm.group(2).rstrip()           # e.g. "Phase 2: Synthesis"
    final_no = fm.group(3).strip()               # e.g. "2"

    # The final phase's cycle checklist: Collect–Synthesize must be checked, and exactly
    # one unchecked Verify must live INSIDE this phase's subsection.
    cyc_heading = None
    for i, line in enumerate(lines):
        if re.match(r"^### Phase %s\b" % re.escape(final_no), line.strip()):
            cyc_heading = i
            break
    if cyc_heading is None:
        raise Failure(E_STATE_FORMAT,
                      "no '### Phase %s' cycle checklist found for the final phase (%s)"
                      % (final_no, final_label))
    cyc_end = len(lines)
    for j in range(cyc_heading + 1, len(lines)):
        if lines[j].startswith(("## ", "### ")):
            cyc_end = j
            break
    section = range(cyc_heading + 1, cyc_end)
    for step in ("Collect", "Connect", "Assess", "Synthesize"):
        boxes = [STEP_RE[step].match(lines[i]) for i in section
                 if STEP_RE[step].match(lines[i])]
        if len(boxes) != 1:
            raise Failure(E_STATE_FORMAT,
                          "final phase cycle: expected exactly one %s step, found %d"
                          % (step, len(boxes)))
        if boxes[0].group(1) != "x":
            raise Failure(E_STATE_FORMAT,
                          "final phase cycle step %s is unchecked — the closeout only "
                          "completes Verify; the earlier steps must already be done" % step)
    verify_idx = [i for i in section
                  if STEP_RE["Verify"].match(lines[i]) and "- [ ]" in lines[i]]
    if len(verify_idx) != 1:
        raise Failure(E_STATE_FORMAT,
                      "expected exactly one unchecked Verify step inside the final "
                      "phase's cycle checklist, found %d" % len(verify_idx))
    lines[verify_idx[0]] = lines[verify_idx[0]].replace("- [ ]", "- [x]", 1)
    lines[final_i] = "- [x] " + fm.group(2)

    # Completion sentinel as the last bullet of Current Position.
    pos_start, pos_end = _find_section(lines, "## Current Position")
    sentinel = ("- Completion: ALL PHASES COMPLETE — validated closeout %s "
                "(review protocol v%d)" % (review_set_id, PROTOCOL_VERSION))
    insert_at = pos_end
    while insert_at > pos_start + 1 and not lines[insert_at - 1].strip():
        insert_at -= 1
    lines.insert(insert_at, sentinel)

    # Next Action becomes the closeout form.
    na_start, na_end = _find_section(lines, "## Next Action")
    closeout = ("Project closed %s via validated corpus-review closeout %s. The decision "
                "corpus is frozen at decision_corpus_hash %s…; any change to it invalidates "
                "this completion (see research/reviews/completion.json). No further "
                "research actions." % (today, review_set_id, corpus_hash[:12]))
    lines[na_start + 1:na_end] = ["", closeout, ""]

    return "\n".join(lines) + ("\n" if state_text.endswith("\n") else "")


def compute_unreviewed_transition(state_text, today):
    if SENTINEL_VALIDATED_RE.search(state_text) or SENTINEL_UNREVIEWED_RE.search(state_text):
        raise Failure(E_STATE_FORMAT, "STATE already carries a completion sentinel")
    lines = state_text.splitlines()
    pos_start, pos_end = _find_section(lines, "## Current Position")
    sentinel = ("- Completion: CLOSED UNREVIEWED — administrative archive, not "
                "decision-ready (%s)" % today)
    insert_at = pos_end
    while insert_at > pos_start + 1 and not lines[insert_at - 1].strip():
        insert_at -= 1
    lines.insert(insert_at, sentinel)
    na_start, na_end = _find_section(lines, "## Next Action")
    closeout = ("Project archived %s as closed-unreviewed: no corpus review was obtainable. "
                "This project is NOT decision-ready and its completion is administrative, "
                "not validated (see research/reviews/completion.json)." % today)
    lines[na_start + 1:na_end] = ["", closeout, ""]
    return "\n".join(lines) + ("\n" if state_text.endswith("\n") else "")


def _atomic_write(path, data):
    directory = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=directory, prefix=".tmp-validate-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def compute_seals(root):
    """SHA-256 of every reviews/ file except the record itself (spec §5): the post-close
    immutability anchor for receipts, reports, failed attempts, and both ledgers."""
    reviews = os.path.join(root, REVIEWS_REL)
    seals = {}
    if not os.path.isdir(reviews):
        return seals
    for name in sorted(os.listdir(reviews)):
        if name in SEAL_EXEMPT:
            continue
        full = os.path.join(reviews, name)
        if os.path.isfile(full):
            seals[name] = sha256_file(full)
    return seals


def _resume_apply(root, record, state_text, apply):
    """completion.json exists but STATE was never rewritten (interrupted apply).
    Deterministically recompute the recorded transition and finish it."""
    if sha256_bytes(state_text.encode("utf-8")) != record.get("preclose_state_hash"):
        raise Failure(E_STATE_FORMAT,
                      "completion.json exists but STATE matches neither the recorded "
                      "pre-close nor post-close state — manual repair required")
    today = (record.get("closed_at") or utc_now_iso())[:10]
    if record.get("closed_state") == "closed-unreviewed":
        new_state = compute_unreviewed_transition(state_text, today)
    else:
        new_state = compute_transition(state_text, record["review_set_id"],
                                       record["decision_corpus_hash"], today)
    if sha256_bytes(new_state.encode("utf-8")) != record.get("postclose_state_hash"):
        raise Failure(E_STATE_FORMAT,
                      "recomputed transition does not reproduce the recorded "
                      "postclose_state_hash — manual repair required")
    if apply:
        _atomic_write(os.path.join(root, STATE_REL), new_state)
    return {"status": "resumed" if apply else "resume-dry-run",
            "completion_record": record, "postclose_state": new_state}


def run_transition(root, plugin_root, apply, closed_unreviewed=False, reason=None):
    state_path = os.path.join(root, STATE_REL)
    if not os.path.isfile(state_path):
        raise Failure(E_STATE_FORMAT, "missing %s" % STATE_REL)
    state_text = read_text(state_path)
    completion_path = os.path.join(root, COMPLETION_REL)
    if os.path.exists(completion_path):
        record = json.loads(read_text(completion_path))
        if SENTINEL_VALIDATED_RE.search(state_text) or \
                SENTINEL_UNREVIEWED_RE.search(state_text):
            raise Failure(E_STATE_FORMAT,
                          "completion.json already exists and STATE carries a sentinel — "
                          "the project is closed")
        return _resume_apply(root, record, state_text, apply)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if closed_unreviewed:
        if not reason:
            raise Failure(E_USAGE, "--closed-unreviewed requires --reason")
        protocol_status(root, plugin_root)  # adopted projects only; damage fails closed
        manifest = build_manifest(root)
        new_state = compute_unreviewed_transition(state_text, today)
        record = {
            "schema_version": SCHEMA_VERSION,
            "protocol_version": PROTOCOL_VERSION,
            "closed_state": "closed-unreviewed",
            "closed_at": utc_now_iso(),
            "decision_corpus_hash": manifest["decision_corpus_hash"],
            "preclose_state_hash": manifest["state_hash"],
            "postclose_state_hash": sha256_bytes(new_state.encode("utf-8")),
            "validator_sha256": sha256_file(os.path.abspath(__file__)),
            "seals": compute_seals(root),
            "reason": reason,
        }
    else:
        verdict = run_gate(root, plugin_root)
        # TOCTOU guard: the STATE text this transition transforms must be exactly the
        # STATE the gate just validated.
        if sha256_bytes(state_text.encode("utf-8")) != verdict["state_hash"]:
            raise Failure(E_STALE_HASH,
                          "STATE changed between gate evaluation and transition — re-run")
        new_state = compute_transition(state_text, verdict["review_set_id"],
                                       verdict["decision_corpus_hash"], today)
        record = {
            "schema_version": SCHEMA_VERSION,
            "protocol_version": PROTOCOL_VERSION,
            "closed_state": "validated",
            "closed_at": utc_now_iso(),
            "review_set_id": verdict["review_set_id"],
            "review_ids": verdict["review_ids"],
            "decision_corpus_hash": verdict["decision_corpus_hash"],
            "preclose_state_hash": verdict["state_hash"],
            "postclose_state_hash": sha256_bytes(new_state.encode("utf-8")),
            "validator_sha256": sha256_file(os.path.abspath(__file__)),
            "seals": compute_seals(root),
        }

    if apply:
        # completion.json first, STATE second: an interruption between the two leaves a
        # resumable half-state that the next run finishes deterministically.
        _atomic_write(completion_path,
                      json.dumps(record, indent=1, sort_keys=True) + "\n")
        _atomic_write(state_path, new_state)
        if sha256_file(state_path) != record["postclose_state_hash"]:
            raise Failure(E_INTERNAL, "post-write verification failed for STATE")

    return {"status": "applied" if apply else "dry-run",
            "completion_record": record, "postclose_state": new_state}


# ---------------------------------------------------------------------------
# check-completion (sentinel readers)
# ---------------------------------------------------------------------------

def run_check_completion(root, plugin_root):
    """Re-derive the completion claim from the record, seals, and receipts. The sentinel
    is a claim to validate, never a fact (spec §6.4)."""
    state_path = os.path.join(root, STATE_REL)
    state_text = read_text(state_path) if os.path.isfile(state_path) else ""
    validated = SENTINEL_VALIDATED_RE.search(state_text)
    unreviewed = SENTINEL_UNREVIEWED_RE.search(state_text)
    if not validated and not unreviewed:
        raise Failure(E_NOT_CLOSED, "no completion sentinel in STATE — the project is open")

    protocol_status(root, plugin_root)  # legacy/damage propagates as 10/11

    completion_path = os.path.join(root, COMPLETION_REL)
    problems = []
    record = None
    if not os.path.isfile(completion_path):
        problems.append("completion sentinel present but %s is missing — a manual sentinel "
                        "is a claim with nothing behind it" % COMPLETION_REL)
    else:
        try:
            record = json.loads(read_text(completion_path))
        except (json.JSONDecodeError, UnicodeDecodeError):
            problems.append("completion.json is unparseable")

    try:
        check_allowlist(root)
    except Failure as exc:
        problems.extend(exc.reasons)

    # Seal verification: the reviews/ directory must contain exactly the sealed files,
    # byte-identical. Receipt or ledger mutation after close reads as a stale completion.
    if record is not None:
        seals = record.get("seals")
        if not isinstance(seals, dict):
            problems.append("completion.json carries no seals — the record cannot "
                            "authenticate its receipts and ledgers")
        else:
            current = compute_seals(root)
            for name, digest in sorted(seals.items()):
                if name not in current:
                    problems.append("sealed file %s is missing from reviews/" % name)
                elif current[name] != digest:
                    problems.append("sealed file %s was modified after close" % name)
            for name in sorted(set(current) - set(seals)):
                problems.append("unsealed file %s appeared in reviews/ after close" % name)

    if unreviewed:
        if record is not None:
            if record.get("closed_state") != "closed-unreviewed":
                problems.append("STATE says closed-unreviewed but completion.json says %r"
                                % record.get("closed_state"))
            # The archive is still a post-close claim (spec §1.4/§6.4): the record's
            # hashes must describe what is on disk. Drift after archiving is a stale
            # completion, never reported as a quiet archive.
            for field in ("decision_corpus_hash", "postclose_state_hash"):
                v = record.get(field)
                if not (isinstance(v, str) and HASH_RE.match(v)):
                    problems.append("completion.json %s is missing or malformed" % field)
            try:
                manifest = build_manifest(root)
                if (HASH_RE.match(record.get("decision_corpus_hash") or "") and
                        record["decision_corpus_hash"] != manifest["decision_corpus_hash"]):
                    problems.append("decision corpus changed after the archive — the "
                                    "record no longer describes what is on disk")
                if (HASH_RE.match(record.get("postclose_state_hash") or "") and
                        record["postclose_state_hash"] != manifest["state_hash"]):
                    problems.append("STATE changed after the archive — content outside "
                                    "the allowed transition")
            except Failure as exc:
                problems.extend(exc.reasons)
        if problems:
            raise Failure(E_STALE_COMPLETION, problems)
        raise Failure(E_CLOSED_UNREVIEWED,
                      "closed-unreviewed: administrative archive — NOT decision-ready")

    set_id = validated.group(1)
    if record is not None:
        if record.get("closed_state") != "validated":
            problems.append("sentinel claims a validated closeout but completion.json says %r"
                            % record.get("closed_state"))
        if record.get("review_set_id") != set_id:
            problems.append("sentinel names review set %s but completion.json records %r"
                            % (set_id, record.get("review_set_id")))
        review_ids = record.get("review_ids")
        if not (isinstance(review_ids, list) and review_ids):
            problems.append("completion.json records no review_ids — a validated close "
                            "requires at least one receipt")
            review_ids = []

        manifest = criteria = None
        try:
            manifest = build_manifest(root)
        except Failure as exc:
            problems.extend(exc.reasons)
        try:
            criteria = criteria_context(root)
        except Failure as exc:
            problems.extend(exc.reasons)

        if manifest is not None:
            if manifest["decision_corpus_hash"] != record.get("decision_corpus_hash"):
                problems.append("decision corpus changed after close (%s… -> %s…) — the "
                                "completion is stale"
                                % ((record.get("decision_corpus_hash") or "")[:12],
                                   manifest["decision_corpus_hash"][:12]))
            if manifest["state_hash"] != record.get("postclose_state_hash"):
                problems.append("STATE content is outside the allowed transition — its hash "
                                "no longer matches the recorded postclose_state_hash")

        # Reload and re-validate every recorded receipt; re-derive the closure state.
        if manifest is not None and criteria is not None:
            citable = manifest_paths(manifest)
            members = []
            for rid in review_ids:
                fname = rid + ".receipt.json"
                rp = os.path.join(root, REVIEWS_REL, fname)
                if not os.path.isfile(rp):
                    problems.append("receipt %s missing" % fname)
                    continue
                try:
                    receipt = json.loads(read_text(rp))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    problems.append("receipt %s is unparseable" % fname)
                    continue
                r_problems, coverage, material, insufficient = validate_receipt(
                    receipt, fname, criteria, citable)
                if receipt.get("review_set_id") != set_id:
                    r_problems.append("receipt belongs to set %r, not the recorded set %s"
                                      % (receipt.get("review_set_id"), set_id))
                if receipt.get("corpus", {}).get("decision_corpus_hash") != \
                        record.get("decision_corpus_hash"):
                    r_problems.append("receipt corpus hash does not match the completion "
                                      "record")
                if r_problems:
                    problems.extend("%s: %s" % (fname, p) for p in r_problems)
                else:
                    members.append({"receipt": receipt, "filename": fname,
                                    "problems": [], "coverage": coverage,
                                    "material": material, "insufficient": insufficient})
            if members and len(members) == len(review_ids):
                try:
                    resolutions, exceptions = load_ledgers(root)
                    open_reasons = compute_open_findings(
                        members, record.get("decision_corpus_hash"), resolutions,
                        exceptions, citable)
                    problems.extend(open_reasons)
                except Failure as exc:
                    problems.extend(exc.reasons)
    if problems:
        raise Failure(E_STALE_COMPLETION, problems)
    return {"status": "valid-completion", "review_set_id": set_id,
            "closed_at": record.get("closed_at")}


# ---------------------------------------------------------------------------
# Self-test fixtures
# ---------------------------------------------------------------------------

_FIXTURE_STATE = """# Research State

Review protocol: v1

**Phases are sequential.**

## Current Position
- Active phase: 2 — Synthesis
- Cycle step: Verify (5 of 5)
- Blocking on: Final corpus review.

## Current Phase Cycle

### Phase 2: Synthesis
- [x] **Collect** — done
- [x] **Connect** — done
- [x] **Assess** — done
- [x] **Synthesize** — done
- [ ] **Verify** — awaiting corpus review

## Completed Phases
- [x] Phase 1: Landscape
- [ ] Phase 2: Synthesis

## Key Decisions
- Project initialized 2026-08-01

## Next Action

Run the final corpus review.
"""

_FIXTURE_CRITERIA = """# Completion Criteria

Canonical, stable-ID completion criteria.

- [ ] **SC-1** — The core question is answered with cited evidence.
- [ ] **SC-2** — Every output passed its claim audit.
- [ ] **SC-3** — Open risks are dispositioned.
"""

_FIXTURE_PLAN = """# Research Plan

## Success Criteria

Generated from reference/completion-criteria.md:

- **SC-1** — The core question is answered with cited evidence.
- **SC-2** — Every output passed its claim audit.
- **SC-3** — Open risks are dispositioned.
"""

# Golden decision_corpus_hash for the fixed mini-tree in t_golden_manifest. Guards the
# canonicalization contract (NFC paths, byte-wise order, raw-byte hashing, canonical JSON)
# against silent drift: if this changes, the manifest format changed and every receipt in
# the field is orphaned — that is a protocol version bump, not a patch.
GOLDEN_CORPUS_HASH = "789d31793ff1e779cd310394ee0d2a84c7df9a034438c28d84ec63e9576b45aa"


def _write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if isinstance(content, (dict, list)):
        content = json.dumps(content, indent=1, sort_keys=True) + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def _make_fixture_project(base):
    """A minimal protocol-adopted project + synthetic plugin root. Returns (root, plugin)."""
    root = os.path.join(base, "proj")
    plugin = os.path.join(base, "plugin")
    _write(os.path.join(root, "CLAUDE.md"), "research-type: exploratory-thesis\n")
    _write(os.path.join(root, PLAN_REL), _FIXTURE_PLAN)
    _write(os.path.join(root, "research/outputs/01-findings.md"),
           "# Findings\n\nThe finding.\n")
    _write(os.path.join(root, "research/notes/source-a.md"), "# Source A\n")
    _write(os.path.join(root, "research/notes-to-self.md"),
           "# Notes to Self\n\nWaiver: SC-2 waived by the commissioner.\n")
    _write(os.path.join(root, STATE_REL), _FIXTURE_STATE)
    _write(os.path.join(root, CRITERIA_REL), _FIXTURE_CRITERIA)
    _write(os.path.join(root, MARKER_REL),
           {"protocol_version": PROTOCOL_VERSION, "adopted": "2026-08-01"})
    _write(os.path.join(root, REVIEWS_REL + "/.gitkeep"), "")
    self_bytes = open(os.path.abspath(__file__), "rb").read()
    installed = os.path.join(root, INSTALLED_VALIDATOR_REL)
    os.makedirs(os.path.dirname(installed), exist_ok=True)
    with open(installed, "wb") as f:
        f.write(self_bytes)
    _write(os.path.join(plugin, CONTRACT_PLUGIN_REL),
           {"schema_version": SCHEMA_VERSION,
            "protocols": {str(PROTOCOL_VERSION): {
                "validator_sha256": sha256_bytes(self_bytes),
                "schema_version": SCHEMA_VERSION}}})
    return root, plugin


def _fixture_receipt(root, tier="t1", findings=None, checks_override=None,
                     run_kind="final-closeout", set_stamp="20260805T170000Z",
                     stamp="20260805T170000Z", mutate=None):
    manifest = build_manifest(root)
    criteria = criteria_context(root)
    h8 = manifest["decision_corpus_hash"][:8]
    review_id = "%s-%s-%s" % (stamp, h8, tier)
    findings = findings or []
    fids = [f["id"] for f in findings]
    checks = []
    for cid in CHECK_IDS:
        checks.append({
            "id": cid, "status": "run", "coverage_outcome": "complete",
            "files_examined": ["research/outputs/01-findings.md"],
            "coverage_note": "fixture coverage",
            "finding_ids": fids if cid == "C1" else [],
        })
    if checks_override:
        by_id = {c["id"]: c for c in checks}
        for c in checks_override:
            by_id[c["id"]] = c
        checks = [by_id[cid] for cid in CHECK_IDS]
    has_block = any(f["severity"] == "material" for f in findings)
    receipt = {
        "schema_version": SCHEMA_VERSION,
        "review_id": review_id,
        "review_set_id": "%s-%s" % (set_stamp, h8),
        "run_kind": run_kind,
        "review_set_plan": {"tiers_planned": ["t1", "t2"]},
        "reviewer": {"tier": tier,
                     "engine": "codex-cli" if tier == "t1" else "claude-agent",
                     "engine_version": "fixture",
                     "sampler_label": "independent cross-family sampler" if tier == "t1"
                                      else "isolated same-family sampler",
                     "fallback_chain": []},
        "execution": {"started_at": utc_now_iso(), "ended_at": utc_now_iso(),
                      "duration_seconds": 1, "timeout_seconds": 1800, "exit_status": 0,
                      "truncation_detected": False, "environment": {}},
        "corpus": {"decision_corpus_hash": manifest["decision_corpus_hash"],
                   "preclose_state_hash": manifest["state_hash"],
                   "file_count": manifest["file_count"],
                   "total_bytes": manifest["total_bytes"],
                   "unreadable_files": []},
        "criteria_mode": criteria["mode"],
        "criteria_binding": {"path": criteria["path"], "sha256": criteria["sha256"],
                             "criteria": [{"id": i, "disposition": "met"}
                                          for i in criteria["ids"]]},
        "checks": checks,
        "verdict": "not-ready" if has_block else "ready",
        "findings": findings,
    }
    if mutate:
        mutate(receipt)
    _write(os.path.join(root, REVIEWS_REL, review_id + ".receipt.json"), receipt)
    _write(os.path.join(root, REVIEWS_REL, review_id + ".report.md"),
           "# Fixture report\n")
    return receipt


def _material_finding(fid="F-001", cls="conclusion-vs-brief"):
    return {"id": fid, "class": cls, "severity": "material",
            "waivability_class_advisory": "waivable",
            "observed": "fixture observation",
            "criterion_violated": "C2",
            "evidence": ["research/outputs/01-findings.md:3"],
            "decision_impact": "fixture impact",
            "closure_evidence_required": "fixture closure"}


def _gate_code(root, plugin):
    try:
        run_gate(root, plugin)
        return E_OK
    except Failure as exc:
        return exc.code


def _check_code(root, plugin):
    try:
        run_check_completion(root, plugin)
        return E_OK
    except Failure as exc:
        return exc.code


def run_self_test():
    results = []

    def case(name, fn):
        try:
            fn()
            results.append((name, True, ""))
        except AssertionError as exc:
            results.append((name, False, str(exc)))
        except Failure as exc:
            results.append((name, False, "unexpected Failure %s: %s"
                            % (CODE_NAMES.get(exc.code, exc.code), exc)))
        except Exception as exc:  # noqa: BLE001 — a fixture crash is a failed case
            results.append((name, False, "crash: %r" % exc))

    def expect(actual, expected, label=""):
        assert actual == expected, "%sexpected %s, got %s" % (
            label and label + ": ", CODE_NAMES.get(expected, expected),
            CODE_NAMES.get(actual, actual))

    def fresh():
        tmp = tempfile.mkdtemp(prefix="vcr-selftest-")
        return (tmp,) + _make_fixture_project(tmp)

    # -- gate battery ------------------------------------------------------
    def t_valid():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        expect(_gate_code(root, plugin), E_OK)
        shutil.rmtree(tmp)
    case("valid close passes", t_valid)

    def t_no_review():
        tmp, root, plugin = fresh()
        expect(_gate_code(root, plugin), E_NO_REVIEW)
        shutil.rmtree(tmp)
    case("no review set -> no-review", t_no_review)

    def t_stale():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        with open(os.path.join(root, "research/outputs/01-findings.md"), "a") as f:
            f.write("\nEdited after review.\n")
        expect(_gate_code(root, plugin), E_STALE_HASH)
        shutil.rmtree(tmp)
    case("corpus edit after receipt -> stale-hash", t_stale)

    def t_state_stale():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        with open(os.path.join(root, STATE_REL), "a") as f:
            f.write("\n- Extra state line.\n")
        expect(_gate_code(root, plugin), E_STALE_HASH)
        shutil.rmtree(tmp)
    case("STATE edit after receipt -> stale-hash", t_state_stale)

    def t_incomplete():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root)
        r["checks"] = [c for c in r["checks"] if c["id"] != "C7"]
        _write(os.path.join(root, REVIEWS_REL, r["review_id"] + ".receipt.json"), r)
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("missing check -> incomplete-receipt", t_incomplete)

    def t_truncated():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root)
        _write(os.path.join(root, REVIEWS_REL, r["review_id"] + ".receipt.json"),
               '{"verdict": "ready", ')
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("truncated receipt -> incomplete-receipt", t_truncated)

    def t_open_material():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, findings=[_material_finding()])
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("open material finding blocks", t_open_material)

    def _exception_entry(root, receipt, cls="conclusion-vs-brief", bound=None,
                         deliverables="research/outputs/01-findings.md"):
        bound = bound or receipt["corpus"]["decision_corpus_hash"]
        _write(os.path.join(root, EXCEPTIONS_REL), (
            "## E-1\n"
            "- Refs: %s/F-001\n"
            "- Class: %s\n"
            "- Commissioner rationale (verbatim): \"Accepted for the fixture.\"\n"
            "- Decision impact and risk accepted: fixture\n"
            "- Binds to decision_corpus_hash: %s\n"
            "- Affected deliverables: %s\n"
            "- Date: 2026-08-05\n") % (receipt["review_id"], cls, bound, deliverables))

    def t_exception_ok():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _exception_entry(root, r)
        expect(_gate_code(root, plugin), E_OK)
        shutil.rmtree(tmp)
    case("waivable exception (current hash) closes", t_exception_ok)

    def t_exception_expired():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _exception_entry(root, r, bound="0" * 64)
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("expired exception blocks", t_exception_expired)

    def t_exception_nonwaivable():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[
            _material_finding(cls="internal-contradiction")])
        _exception_entry(root, r, cls="internal-contradiction")
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("non-waivable exception attempt blocks", t_exception_nonwaivable)

    def t_exception_class_mismatch():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _exception_entry(root, r, cls="temporal-coherence")
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("exception class mismatch does not cover", t_exception_class_mismatch)

    def t_exception_deliverable_outside():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _exception_entry(root, r, deliverables="research/reviews/parked.md")
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("exception naming out-of-corpus deliverable does not cover",
         t_exception_deliverable_outside)

    def t_rejected():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _write(os.path.join(root, RESOLUTIONS_REL), (
            "## R-1: rejected\n"
            "- Refs: %s/F-001\n"
            "- Action: rejected-with-record\n"
            "- Date: 2026-08-05\n"
            "- Closure evidence: The claimed reversal does not exist; see "
            "research/outputs/01-findings.md:3.\n") % r["review_id"])
        expect(_gate_code(root, plugin), E_OK)
        shutil.rmtree(tmp)
    case("rejected-with-record (cited) closes", t_rejected)

    def t_rejected_uncited():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _write(os.path.join(root, RESOLUTIONS_REL), (
            "## R-1: rejected\n"
            "- Refs: %s/F-001\n"
            "- Action: rejected-with-record\n"
            "- Date: 2026-08-05\n"
            "- Closure evidence: We disagree with the reviewer.\n") % r["review_id"])
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("rejected-with-record without in-corpus citation stays open", t_rejected_uncited)

    def t_reconciled_current():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _write(os.path.join(root, RESOLUTIONS_REL), (
            "## R-1: reconciled\n"
            "- Refs: %s/F-001\n"
            "- Action: reconciled\n"
            "- Date: 2026-08-05\n"
            "- Closure evidence: Fixed in research/outputs/01-findings.md.\n")
            % r["review_id"])
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("reconciled-against-current-set blocks (needs re-review)", t_reconciled_current)

    def t_ledger_malformed():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        _write(os.path.join(root, RESOLUTIONS_REL), "## R-1: broken\n- Refs: x\n")
        expect(_gate_code(root, plugin), E_LEDGER)
        shutil.rmtree(tmp)
    case("malformed ledger entry -> ledger-malformed", t_ledger_malformed)

    def t_unreadable():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        target = os.path.join(root, "research/notes/source-a.md")
        os.chmod(target, 0)
        try:
            code = _gate_code(root, plugin)
        finally:
            os.chmod(target, 0o644)
        expect(code, E_UNREADABLE)
        shutil.rmtree(tmp)
    case("unreadable in-scope file blocks", t_unreadable)

    def t_mismatch():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        contract_path = os.path.join(plugin, CONTRACT_PLUGIN_REL)
        contract = json.loads(read_text(contract_path))
        contract["protocols"][str(PROTOCOL_VERSION)]["validator_sha256"] = "f" * 64
        _write(contract_path, contract)
        expect(_gate_code(root, plugin), E_VALIDATOR_MISMATCH)
        shutil.rmtree(tmp)
    case("validator hash mismatch fails closed", t_mismatch)

    def t_validator_missing():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        os.unlink(os.path.join(root, INSTALLED_VALIDATOR_REL))
        expect(_gate_code(root, plugin), E_VALIDATOR_MISMATCH)
        shutil.rmtree(tmp)
    case("installed validator missing fails closed", t_validator_missing)

    def t_legacy():
        tmp, root, plugin = fresh()
        os.unlink(os.path.join(root, MARKER_REL))
        state_path = os.path.join(root, STATE_REL)
        _write(state_path, read_text(state_path).replace("Review protocol: v1\n\n", ""))
        expect(_gate_code(root, plugin), E_LEGACY)
        shutil.rmtree(tmp)
    case("no line + no marker = legacy", t_legacy)

    def t_partial_damage():
        tmp, root, plugin = fresh()
        os.unlink(os.path.join(root, MARKER_REL))
        expect(_gate_code(root, plugin), E_VALIDATOR_MISMATCH)
        shutil.rmtree(tmp)
    case("STATE line without marker = damage, fails closed", t_partial_damage)

    def t_duplicate_discriminator():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        with open(os.path.join(root, STATE_REL), "a") as f:
            f.write("\nReview protocol: v1\n")
        expect(_gate_code(root, plugin), E_VALIDATOR_MISMATCH)
        shutil.rmtree(tmp)
    case("duplicated discriminator line = damage", t_duplicate_discriminator)

    def t_body_only_discriminator():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        state_path = os.path.join(root, STATE_REL)
        text = read_text(state_path).replace("Review protocol: v1\n\n", "")
        _write(state_path, text + "\nReview protocol: v1\n")
        expect(_gate_code(root, plugin), E_VALIDATOR_MISMATCH)
        shutil.rmtree(tmp)
    case("discriminator outside the header block = damage", t_body_only_discriminator)

    def t_allowlist():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        _write(os.path.join(root, REVIEWS_REL, "notes.md"), "parked material\n")
        expect(_gate_code(root, plugin), E_ALLOWLIST)
        shutil.rmtree(tmp)
    case("stray file in reviews/ -> allowlist-violation", t_allowlist)

    def t_insufficient():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, checks_override=[{
            "id": "C3", "status": "run", "coverage_outcome": "insufficient-coverage",
            "files_examined": ["research/outputs/01-findings.md"],
            "coverage_note": "could not reach the registries", "finding_ids": []}],
            mutate=lambda r: r.update(verdict="not-ready"))
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("insufficient-coverage check blocks", t_insufficient)

    def t_forced_insufficient():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, checks_override=[{
            "id": "C3", "status": "run", "coverage_outcome": "complete",
            "files_examined": [], "coverage_note": "claims complete with no files",
            "finding_ids": []}],
            mutate=lambda r: r.update(verdict="not-ready"))
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("run check with empty files_examined blocks (forced insufficient)",
         t_forced_insufficient)

    def t_verdict_asymmetry():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, mutate=lambda r: r.update(verdict="not-ready"))
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("not-ready with no blocking evidence -> inconsistent receipt",
         t_verdict_asymmetry)

    def t_ready_with_findings():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, findings=[_material_finding()],
                         mutate=lambda r: r.update(verdict="ready"))
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("ready alongside material findings -> inconsistent receipt",
         t_ready_with_findings)

    def t_c1_missing_id():
        tmp, root, plugin = fresh()
        def drop(r):
            r["criteria_binding"]["criteria"] = [
                c for c in r["criteria_binding"]["criteria"] if c["id"] != "SC-3"]
        _fixture_receipt(root, mutate=drop)
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL)
        shutil.rmtree(tmp)
    case("C1 missing criterion ID blocks (insufficient coverage)", t_c1_missing_id)

    def t_unmet_without_finding():
        tmp, root, plugin = fresh()
        def unmet(r):
            r["criteria_binding"]["criteria"][0]["disposition"] = "unmet"
        _fixture_receipt(root, mutate=unmet)
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("unmet criterion with no linked material C1 finding -> inconsistent",
         t_unmet_without_finding)

    def t_waived_without_record():
        tmp, root, plugin = fresh()
        def waive(r):
            r["criteria_binding"]["criteria"][1]["disposition"] = "waived-with-record"
        _fixture_receipt(root, mutate=waive)
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("waived-with-record without a record citation -> inconsistent",
         t_waived_without_record)

    def t_waived_with_record():
        tmp, root, plugin = fresh()
        def waive(r):
            r["criteria_binding"]["criteria"][1].update(
                disposition="waived-with-record",
                record="research/notes-to-self.md:3")
        _fixture_receipt(root, mutate=waive)
        expect(_gate_code(root, plugin), E_OK)
        shutil.rmtree(tmp)
    case("waived-with-record with in-corpus record passes", t_waived_with_record)

    def t_criteria_drift():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        plan_path = os.path.join(root, PLAN_REL)
        _write(plan_path, read_text(plan_path).replace(
            "- **SC-3** — Open risks are dispositioned.\n", ""))
        expect(_gate_code(root, plugin), E_CRITERIA_DRIFT)
        shutil.rmtree(tmp)
    case("plan/canonical criterion ID drift -> criteria-drift", t_criteria_drift)

    def t_empty_criteria():
        tmp, root, plugin = fresh()
        _write(os.path.join(root, CRITERIA_REL), "# Completion Criteria\n\n(none yet)\n")
        expect(_gate_code(root, plugin), E_CRITERIA_DRIFT)
        shutil.rmtree(tmp)
    case("empty structured criteria file -> criteria-drift", t_empty_criteria)

    def t_id_binding():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root)
        r["corpus"]["decision_corpus_hash"] = "e" * 64
        _write(os.path.join(root, REVIEWS_REL, r["review_id"] + ".receipt.json"), r)
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("edited receipt breaks id/hash binding -> incomplete-receipt", t_id_binding)

    def t_bogus_set_id():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, mutate=lambda r: r.update(
            review_set_id="99999999T999999Z-ffffffff"))
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("review_set_id not bound to corpus hash -> incomplete-receipt", t_bogus_set_id)

    def t_tier_mismatch():
        tmp, root, plugin = fresh()
        def swap(r):
            r["reviewer"]["tier"] = "t2"
        _fixture_receipt(root, mutate=swap)  # filename says t1
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("reviewer tier vs filename tier mismatch -> incomplete-receipt",
         t_tier_mismatch)

    def t_mixed_run_kind():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, tier="t1")
        _fixture_receipt(root, tier="t2", stamp="20260805T170200Z",
                         mutate=lambda r: r.update(run_kind="on-demand"))
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("mixed run_kind within one set -> incomplete-receipt", t_mixed_run_kind)

    def t_duplicate_tier():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, tier="t1")
        _fixture_receipt(root, tier="t1", stamp="20260805T170300Z")
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("duplicate tier within one set -> incomplete-receipt", t_duplicate_tier)

    def t_evidence_outside_corpus():
        tmp, root, plugin = fresh()
        f = _material_finding()
        f["evidence"] = ["../outside.md:1"]
        _fixture_receipt(root, findings=[f])
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("finding evidence outside the corpus -> incomplete-receipt",
         t_evidence_outside_corpus)

    def t_files_examined_outside():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, checks_override=[{
            "id": "C3", "status": "run", "coverage_outcome": "complete",
            "files_examined": ["research/reviews/old.receipt.json"],
            "coverage_note": "read the reviews dir", "finding_ids": []}])
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("files_examined outside the corpus -> incomplete-receipt",
         t_files_examined_outside)

    def t_failed_only():
        tmp, root, plugin = fresh()
        manifest = build_manifest(root)
        h8 = manifest["decision_corpus_hash"][:8]
        _write(os.path.join(root, REVIEWS_REL, "20260805T170000Z-%s-t1.failed.json" % h8),
               {"attempt": "t1", "failure_chain": ["codex: not installed"]})
        _write(os.path.join(root, REVIEWS_REL, "20260805T170100Z-%s-t2.failed.json" % h8),
               {"attempt": "t2", "failure_chain": ["agent: timeout"]})
        expect(_gate_code(root, plugin), E_NO_REVIEW)
        shutil.rmtree(tmp)
    case("failed attempts only (both tiers unavailable) -> no-review", t_failed_only)

    def t_one_valid_plus_failed():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root)
        h8 = r["corpus"]["decision_corpus_hash"][:8]
        _write(os.path.join(root, REVIEWS_REL, "20260805T170100Z-%s-t2.failed.json" % h8),
               {"attempt": "t2", "failure_chain": ["agent: incomplete result"]})
        expect(_gate_code(root, plugin), E_OK)
        shutil.rmtree(tmp)
    case("one valid receipt + failed attempt passes (visible composition)",
         t_one_valid_plus_failed)

    def t_union_both_tiers():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, tier="t1")
        _fixture_receipt(root, tier="t2", stamp="20260805T170200Z",
                         findings=[_material_finding(fid="F-001")])
        expect(_gate_code(root, plugin), E_OPEN_MATERIAL, "t2's finding must gate the union")
        shutil.rmtree(tmp)
    case("gate operates on the union of the set", t_union_both_tiers)

    def t_all_reasons():
        tmp, root, plugin = fresh()
        _write(os.path.join(root, REVIEWS_REL, "notes.md"), "stray\n")
        _write(os.path.join(root, RESOLUTIONS_REL), "## R-1: broken\n- Refs: x\n")
        try:
            run_gate(root, plugin)
            assert False, "expected failure"
        except Failure as exc:
            expect(exc.code, E_ALLOWLIST)
            text = " ".join(exc.reasons)
            assert "notes.md" in text and "R-1" in text, \
                "gate must accumulate reasons across categories: %s" % exc.reasons
        shutil.rmtree(tmp)
    case("gate accumulates reasons across independent categories", t_all_reasons)

    # -- validate-receipt (runner preflight) battery -----------------------
    def _vr_code(root, cand, name):
        try:
            run_validate_receipt(root, cand, name)
            return E_OK
        except Failure as exc:
            return exc.code

    def _candidate(tmp, root, mutate=None):
        """A candidate receipt document staged outside reviews/ (the runner's shape)."""
        receipt = _fixture_receipt(root, mutate=mutate)
        rid = receipt["review_id"]
        for suffix in (".receipt.json", ".report.md"):
            os.remove(os.path.join(root, REVIEWS_REL, rid + suffix))
        cand = os.path.join(tmp, "candidate.json")
        _write(cand, receipt)
        return cand, rid + ".receipt.json"

    def t_vr_valid():
        tmp, root, _ = fresh()
        cand, name = _candidate(tmp, root)
        result = run_validate_receipt(root, cand, name)
        assert result["status"] == "valid", result
        assert result["material_findings"] == 0
        shutil.rmtree(tmp)
    case("validate-receipt: valid candidate passes outside reviews/", t_vr_valid)

    def t_vr_incomplete():
        tmp, root, _ = fresh()

        def drop_c15(r):
            r["checks"] = [c for c in r["checks"] if c["id"] != "C15"]
        cand, name = _candidate(tmp, root, mutate=drop_c15)
        expect(_vr_code(root, cand, name), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("validate-receipt: missing check -> incomplete-receipt (failed attempt)",
         t_vr_incomplete)

    def t_vr_stale():
        tmp, root, _ = fresh()
        cand, name = _candidate(tmp, root)
        with open(os.path.join(root, "research/outputs/01-findings.md"), "a") as f:
            f.write("\nEdited while the reviewer ran.\n")
        expect(_vr_code(root, cand, name), E_STALE_HASH)
        shutil.rmtree(tmp)
    case("validate-receipt: corpus changed during review -> stale-hash", t_vr_stale)

    def t_vr_malformed_shapes():
        tmp, root, _ = fresh()

        def string_finding(r):
            r["findings"] = ["not-an-object"]
        cand, name = _candidate(tmp, root, mutate=string_finding)
        expect(_vr_code(root, cand, name), E_INCOMPLETE_RECEIPT, "string finding")
        _write(cand, ["not", "an", "object"])
        expect(_vr_code(root, cand, name), E_INCOMPLETE_RECEIPT, "non-object candidate")
        shutil.rmtree(tmp)
    case("validate-receipt: malformed member shapes -> incomplete-receipt, never a crash",
         t_vr_malformed_shapes)

    def t_vr_flags_scoped():
        code = None
        import io
        from contextlib import redirect_stderr
        try:
            with redirect_stderr(io.StringIO()):
                main(["manifest", "--receipt", "/nonexistent"])
        except SystemExit as exc:
            code = exc.code
        expect(code, E_USAGE, "--receipt outside validate-receipt")
    case("--receipt/--filename rejected outside validate-receipt (additive-mode scope)",
         t_vr_flags_scoped)

    # -- legacy-prose + final-plan tightening (whole-change review) --------
    def _legacyize(root):
        os.remove(os.path.join(root, CRITERIA_REL))
        plan_sha = sha256_file(os.path.join(root, PLAN_REL))

        def mutate(r):
            r["criteria_mode"] = "legacy-prose"
            r["criteria_binding"] = {"path": PLAN_REL, "sha256": plan_sha, "criteria": []}
            for c in r["checks"]:
                if c["id"] == "C1":
                    c["coverage_outcome"] = "partial"
        return mutate

    def t_legacy_valid():
        tmp, root, plugin = fresh()
        _fixture_receipt(root, mutate=_legacyize(root))
        expect(_gate_code(root, plugin), E_OK)
        shutil.rmtree(tmp)
    case("legacy-prose receipt with plan binding + partial C1 passes", t_legacy_valid)

    def t_legacy_c1_na():
        tmp, root, plugin = fresh()
        base = _legacyize(root)

        def mutate(r):
            base(r)
            for c in r["checks"]:
                if c["id"] == "C1":
                    c["status"] = "n/a"
                    c["coverage_outcome"] = "not-applicable"
        _fixture_receipt(root, mutate=mutate)
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("legacy-prose C1 marked n/a -> incomplete-receipt (a dodge, not coverage)",
         t_legacy_c1_na)

    def t_final_single_tier_plan():
        tmp, root, plugin = fresh()

        def mutate(r):
            r["review_set_plan"] = {"tiers_planned": ["t1"]}
        _fixture_receipt(root, mutate=mutate)
        expect(_gate_code(root, plugin), E_INCOMPLETE_RECEIPT)
        shutil.rmtree(tmp)
    case("final-closeout plan naming one tier -> incomplete-receipt (final plans both)",
         t_final_single_tier_plan)

    # -- manifest battery --------------------------------------------------
    def t_determinism():
        tmp, root, _ = fresh()
        h1 = build_manifest(root)["decision_corpus_hash"]
        h2 = build_manifest(root)["decision_corpus_hash"]
        assert h1 == h2, "manifest hash not deterministic"
        s1 = build_manifest(root)["state_hash"]
        with open(os.path.join(root, STATE_REL), "a") as f:
            f.write("\nnote\n")
        m = build_manifest(root)
        assert m["decision_corpus_hash"] == h1, "STATE must be excluded from the corpus hash"
        assert m["state_hash"] != s1, "state_hash must track STATE"
        shutil.rmtree(tmp)
    case("manifest deterministic; STATE split out of corpus hash", t_determinism)

    def t_golden_manifest():
        tmp = tempfile.mkdtemp(prefix="vcr-golden-")
        root = os.path.join(tmp, "proj")
        _write(os.path.join(root, "CLAUDE.md"), "gamma\n")
        _write(os.path.join(root, STATE_REL), "# S\n")
        _write(os.path.join(root, "research/notes/a.md"), "alpha\n")
        _write(os.path.join(root, "research/café.md"), "beta\n")
        h = build_manifest(root)["decision_corpus_hash"]
        assert h == GOLDEN_CORPUS_HASH, \
            "canonicalization drift: got %s (a change here orphans every receipt in the " \
            "field — protocol version bump required)" % h
        shutil.rmtree(tmp)
    case("golden manifest hash (canonicalization frozen)", t_golden_manifest)

    def t_nfd_nfc_equivalence():
        tmp = tempfile.mkdtemp(prefix="vcr-nfd-")
        for variant, name in (("nfc", "café.md"), ("nfd", "café.md")):
            root = os.path.join(tmp, variant)
            _write(os.path.join(root, STATE_REL), "# S\n")
            _write(os.path.join(root, "research", name), "beta\n")
        h_nfc = build_manifest(os.path.join(tmp, "nfc"))["decision_corpus_hash"]
        h_nfd = build_manifest(os.path.join(tmp, "nfd"))["decision_corpus_hash"]
        assert h_nfc == h_nfd, "NFD and NFC spellings of the same path must hash identically"
        shutil.rmtree(tmp)
    case("NFD/NFC path spellings hash identically", t_nfd_nfc_equivalence)

    def t_reviews_excluded():
        tmp, root, plugin = fresh()
        h1 = build_manifest(root)["decision_corpus_hash"]
        _fixture_receipt(root)
        assert build_manifest(root)["decision_corpus_hash"] == h1, \
            "reviews/ must be excluded from the corpus hash"
        shutil.rmtree(tmp)
    case("reviews/ excluded from corpus hash (no self-invalidation)", t_reviews_excluded)

    def t_symlink_escape():
        tmp, root, plugin = fresh()
        os.symlink(os.path.join(tmp, ".."), os.path.join(root, "research/notes/escape"))
        try:
            build_manifest(root)
            assert False, "expected manifest error"
        except Failure as exc:
            expect(exc.code, E_MANIFEST)
        shutil.rmtree(tmp)
    case("out-of-tree symlink -> manifest-error", t_symlink_escape)

    def t_state_symlink():
        tmp, root, plugin = fresh()
        state_path = os.path.join(root, STATE_REL)
        real = os.path.join(tmp, "external-state.md")
        shutil.move(state_path, real)
        os.symlink(real, state_path)
        try:
            build_manifest(root)
            assert False, "expected manifest error"
        except Failure as exc:
            expect(exc.code, E_MANIFEST)
        shutil.rmtree(tmp)
    case("symlinked STATE -> manifest-error", t_state_symlink)

    def t_case_collision():
        collisions = check_case_collisions(["research/A.md", "research/a.md"])
        assert collisions, "case collision not detected"
    case("case collision detected", t_case_collision)

    # -- transition + completion battery -----------------------------------
    def t_transition_and_completion():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        old_text = read_text(os.path.join(root, STATE_REL))
        dry = run_transition(root, plugin, apply=False)
        text = dry["postclose_state"]
        old_only = Counter(old_text.splitlines()) - Counter(text.splitlines())
        new_only = Counter(text.splitlines()) - Counter(old_text.splitlines())
        assert sorted(l for l in old_only if l.strip()) == [
            "- [ ] **Verify** — awaiting corpus review",
            "- [ ] Phase 2: Synthesis",
            "Run the final corpus review.",
        ], "transition removed unexpected lines: %r" % sorted(old_only)
        new_nonblank = sorted(l for l in new_only if l.strip())
        assert len(new_nonblank) == 4, \
            "transition added unexpected lines: %r" % new_nonblank
        assert any(SENTINEL_VALIDATED_RE.match(l) for l in new_nonblank), "sentinel missing"
        assert "- [x] **Verify** — awaiting corpus review" in new_nonblank
        assert "- [x] Phase 2: Synthesis" in new_nonblank
        assert any(l.startswith("Project closed ") for l in new_nonblank)
        applied = run_transition(root, plugin, apply=True)
        rec = applied["completion_record"]
        assert rec["postclose_state_hash"] == sha256_file(os.path.join(root, STATE_REL)), \
            "postclose_state_hash does not match written STATE"
        assert rec["seals"], "completion record must seal the reviews/ artifacts"
        expect(_check_code(root, plugin), E_OK, "check-completion after close")
        shutil.rmtree(tmp)
    case("transition: exact four-op diff + check-completion valid",
         t_transition_and_completion)

    def t_transition_unchecked_step():
        tmp, root, plugin = fresh()
        state_path = os.path.join(root, STATE_REL)
        _write(state_path, read_text(state_path).replace(
            "- [x] **Collect** — done", "- [ ] **Collect** — done"))
        _fixture_receipt(root)
        try:
            run_transition(root, plugin, apply=False)
            assert False, "expected state-format failure"
        except Failure as exc:
            expect(exc.code, E_STATE_FORMAT)
        shutil.rmtree(tmp)
    case("transition refuses an unchecked Collect-Synthesize step",
         t_transition_unchecked_step)

    def t_resume_after_interrupt():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        dry = run_transition(root, plugin, apply=False)
        # Simulate the crash window: completion.json written, STATE not yet rewritten.
        _write(os.path.join(root, COMPLETION_REL),
               json.dumps(dry["completion_record"], indent=1, sort_keys=True) + "\n")
        resumed = run_transition(root, plugin, apply=True)
        assert resumed["status"] == "resumed", "interrupted apply must resume"
        expect(_check_code(root, plugin), E_OK, "check-completion after resume")
        shutil.rmtree(tmp)
    case("interrupted apply resumes deterministically", t_resume_after_interrupt)

    def t_manual_sentinel():
        tmp, root, plugin = fresh()
        state_path = os.path.join(root, STATE_REL)
        text = read_text(state_path).replace(
            "- Blocking on: Final corpus review.",
            "- Blocking on: Final corpus review.\n- Completion: ALL PHASES COMPLETE — "
            "validated closeout 20260805T170000Z-deadbeef (review protocol v1)")
        _write(state_path, text)
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("manual sentinel without receipt -> stale/invalid completion", t_manual_sentinel)

    def t_fabricated_completion():
        tmp, root, plugin = fresh()
        manifest = build_manifest(root)
        state_path = os.path.join(root, STATE_REL)
        set_id = "20260805T170000Z-%s" % manifest["decision_corpus_hash"][:8]
        text = read_text(state_path).replace(
            "- Blocking on: Final corpus review.",
            "- Blocking on: Final corpus review.\n- Completion: ALL PHASES COMPLETE — "
            "validated closeout %s (review protocol v1)" % set_id)
        _write(state_path, text)
        _write(os.path.join(root, COMPLETION_REL), {
            "schema_version": SCHEMA_VERSION, "protocol_version": PROTOCOL_VERSION,
            "closed_state": "validated", "closed_at": utc_now_iso(),
            "review_set_id": set_id, "review_ids": [],
            "decision_corpus_hash": manifest["decision_corpus_hash"],
            "preclose_state_hash": manifest["state_hash"],
            "postclose_state_hash": sha256_file(state_path),
            "validator_sha256": "0" * 64, "seals": {}})
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("fabricated completion record with no receipts -> stale/invalid",
         t_fabricated_completion)

    def t_postclose_drift():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        run_transition(root, plugin, apply=True)
        with open(os.path.join(root, "research/outputs/01-findings.md"), "a") as f:
            f.write("\nPost-close edit.\n")
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("post-close corpus drift -> stale/invalid completion", t_postclose_drift)

    def t_postclose_state_drift():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        run_transition(root, plugin, apply=True)
        with open(os.path.join(root, STATE_REL), "a") as f:
            f.write("\n- Late STATE edit outside the allowed transition.\n")
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("post-close STATE edit -> stale/invalid completion", t_postclose_state_drift)

    def t_postclose_receipt_mutation():
        tmp, root, plugin = fresh()
        r = _fixture_receipt(root, findings=[_material_finding()])
        _exception_entry(root, r)
        run_transition(root, plugin, apply=True)
        # Erase the finding (and its check refs) from the sealed receipt: the seal, not
        # the schema, is what must catch this.
        rp = os.path.join(root, REVIEWS_REL, r["review_id"] + ".receipt.json")
        receipt = json.loads(read_text(rp))
        receipt["findings"] = []
        receipt["verdict"] = "ready"
        for c in receipt["checks"]:
            c["finding_ids"] = []
        _write(rp, receipt)
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("post-close receipt mutation breaks the seal -> stale/invalid",
         t_postclose_receipt_mutation)

    def t_postclose_ledger_addition():
        tmp, root, plugin = fresh()
        _fixture_receipt(root)
        run_transition(root, plugin, apply=True)
        _write(os.path.join(root, RESOLUTIONS_REL), (
            "## R-1: late\n- Refs: x/y\n- Action: rejected-with-record\n"
            "- Date: 2026-08-06\n- Closure evidence: late edit.\n"))
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("post-close ledger addition is unsealed -> stale/invalid",
         t_postclose_ledger_addition)

    def t_closed_unreviewed():
        tmp, root, plugin = fresh()
        run_transition(root, plugin, apply=True, closed_unreviewed=True,
                       reason="both reviewer tiers permanently unavailable")
        expect(_check_code(root, plugin), E_CLOSED_UNREVIEWED)
        shutil.rmtree(tmp)
    case("closed-unreviewed reported distinctly, never decision-ready",
         t_closed_unreviewed)

    def t_archive_corpus_drift():
        tmp, root, plugin = fresh()
        run_transition(root, plugin, apply=True, closed_unreviewed=True,
                       reason="both reviewer tiers permanently unavailable")
        with open(os.path.join(root, "research/outputs/01-findings.md"), "a") as f:
            f.write("\nEdited after the archive.\n")
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("closed-unreviewed + corpus drift -> stale/invalid, never a quiet archive",
         t_archive_corpus_drift)

    def t_archive_state_drift():
        tmp, root, plugin = fresh()
        run_transition(root, plugin, apply=True, closed_unreviewed=True,
                       reason="both reviewer tiers permanently unavailable")
        with open(os.path.join(root, STATE_REL), "a") as f:
            f.write("\n- New work resumed after archive.\n")
        expect(_check_code(root, plugin), E_STALE_COMPLETION)
        shutil.rmtree(tmp)
    case("closed-unreviewed + STATE edit -> stale/invalid completion",
         t_archive_state_drift)

    def t_not_closed():
        tmp, root, plugin = fresh()
        expect(_check_code(root, plugin), E_NOT_CLOSED)
        shutil.rmtree(tmp)
    case("open project -> not-closed", t_not_closed)

    def t_state_format():
        tmp, root, plugin = fresh()
        state_path = os.path.join(root, STATE_REL)
        _write(state_path, read_text(state_path).replace("## Completed Phases",
                                                         "## Phases Done"))
        _fixture_receipt(root)
        try:
            run_transition(root, plugin, apply=False)
            assert False, "expected state-format failure"
        except Failure as exc:
            expect(exc.code, E_STATE_FORMAT)
        shutil.rmtree(tmp)
    case("unsupported STATE structure -> state-format", t_state_format)

    failed = [(n, msg) for n, ok, msg in results if not ok]
    for name, ok, msg in results:
        print("%s %s%s" % ("PASS" if ok else "FAIL", name, (" — " + msg) if msg else ""))
    print("\nself-test: %d/%d passed" % (len(results) - len(failed), len(results)))
    return E_OK if not failed else 1


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _emit(result, as_json):
    if as_json:
        print(json.dumps(result, indent=1, sort_keys=True))
    else:
        status = result.get("status", "ok")
        print("status: %s" % status)
        for r in result.get("reasons", []):
            print("  - %s" % r)
        for key in ("review_set_id", "decision_corpus_hash", "state_hash"):
            if key in result:
                print("%s: %s" % (key, result[key]))


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if "--self-test" in argv:
        return run_self_test()

    parser = argparse.ArgumentParser(prog="validate-corpus-review",
                                     description=__doc__.splitlines()[0])
    parser.add_argument("mode", choices=["manifest", "validate-receipt", "gate",
                                         "transition", "check-completion", "hash-self",
                                         "self-test"])
    parser.add_argument("--root", default=".", help="project root (default .)")
    parser.add_argument("--plugin-root", default=os.environ.get("CLAUDE_PLUGIN_ROOT"),
                        help="plugin root holding the trust contract "
                             "(default $CLAUDE_PLUGIN_ROOT)")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--receipt", help="validate-receipt: path to the candidate "
                                          "receipt document (outside reviews/)")
    parser.add_argument("--filename", help="validate-receipt: the intended "
                                           "<review_id>.receipt.json name (default: the "
                                           "candidate file's basename)")
    parser.add_argument("--apply", action="store_true",
                        help="transition: write completion.json + STATE (default: dry-run)")
    parser.add_argument("--closed-unreviewed", action="store_true",
                        help="transition: take the administrative-archive path")
    parser.add_argument("--reason", help="transition --closed-unreviewed: why no review "
                                         "was obtainable")
    args = parser.parse_args(argv)
    if args.mode != "validate-receipt" and (args.receipt or args.filename):
        parser.error("--receipt/--filename are valid only with validate-receipt")
    root = os.path.abspath(args.root)

    try:
        if args.mode == "self-test":
            return run_self_test()
        if args.mode == "hash-self":
            print(sha256_file(os.path.abspath(__file__)))
            return E_OK
        if args.mode == "manifest":
            manifest = build_manifest(root)
            print(json.dumps(manifest, indent=1, sort_keys=True))
            return E_OK
        if args.mode == "validate-receipt":
            if not args.receipt:
                parser.error("validate-receipt requires --receipt PATH")
            _emit(run_validate_receipt(root, args.receipt, args.filename), args.json)
            return E_OK
        if args.mode == "gate":
            _emit(run_gate(root, args.plugin_root), args.json)
            return E_OK
        if args.mode == "transition":
            result = run_transition(root, args.plugin_root, apply=args.apply,
                                    closed_unreviewed=args.closed_unreviewed,
                                    reason=args.reason)
            if args.json:
                print(json.dumps(result, indent=1, sort_keys=True))
            else:
                print("status: %s" % result["status"])
                print(json.dumps(result["completion_record"], indent=1, sort_keys=True))
                if not args.apply:
                    print("\n--- postclose STATE (dry-run) ---\n")
                    print(result["postclose_state"])
            return E_OK
        if args.mode == "check-completion":
            _emit(run_check_completion(root, args.plugin_root), args.json)
            return E_OK
        return E_USAGE
    except Failure as exc:
        _emit({"status": CODE_NAMES.get(exc.code, str(exc.code)),
               "exit_code": exc.code, "reasons": exc.reasons}, args.json)
        return exc.code
    except Exception as exc:  # noqa: BLE001 — surface, never swallow
        _emit({"status": "internal-error", "exit_code": E_INTERNAL,
               "reasons": [repr(exc)]}, args.json)
        return E_INTERNAL


if __name__ == "__main__":
    sys.exit(main())
