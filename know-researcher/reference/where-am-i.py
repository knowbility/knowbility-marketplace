#!/usr/bin/env python3
"""where-am-i — compute the current research-workflow position from durable files.

The point of this script: the agent should never reconstruct "where am I / what's
next" by inferring from the conversation. It asks this helper, which derives the
answer from the files on disk — the same discipline a research team relies on to
return to protocol after a deep tangent, except the team holds the protocol in its
head and the agent cannot.

Answers, from `research/`:
  - whether a research project is active, and which phase / cycle step
  - the batch position: the next UNPROCESSED candidate for the active phase, derived
    as (this phase's discovery candidates) minus (candidates already processed)
  - checkpoint status: sources since the last cross-reference
  - the persisted Next Action

Deliberately tolerant of STATE.md format drift (real STATE.md files carry bold
markup, inline warnings, and standing registers). It extracts loosely, never crashes
on a missing or messy field, and says plainly what it could not read.

Usage:  python3 where-am-i.py [RESEARCH_DIR]   (default: ./research)
        add --json for machine-readable output.
"""

import sys, os, re, json, glob

def strip_md(s):
    return re.sub(r"[*`_]", "", s).strip()

def read(path):
    try:
        return open(path, encoding="utf-8").read()
    except OSError:
        return ""

def grab(text, label):
    """First value after a '- Label:' or '**Label:**' line, markdown stripped."""
    m = re.search(rf"(?im)^[\-\*\s]*{re.escape(label)}\s*[:：]\s*(.+)$", text)
    return strip_md(m.group(1)) if m else None

def grab_int(text, label):
    v = grab(text, label)
    if v is None:
        return None
    m = re.search(r"-?\d+", v)
    return int(m.group()) if m else None

URL_RE = re.compile(r"https?://[^\s)>\]]+")

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_json = "--json" in sys.argv[1:]
    rdir = args[0] if args else "research"
    rdir = rdir.rstrip("/")
    if os.path.isdir(os.path.join(rdir, "research")):   # they passed the project root
        rdir = os.path.join(rdir, "research")

    out = {"research_dir": rdir, "notes": []}

    state = read(os.path.join(rdir, "STATE.md"))
    if not state:
        out["active_protocol"] = False
        out["notes"].append(f"No STATE.md at {rdir}/STATE.md — no active research project here.")
        emit(out, as_json); return

    out["active_protocol"] = True
    phase = grab(state, "Active phase")
    out["phase"] = phase
    out["cycle_step"] = grab(state, "Cycle step")
    out["total_sources"] = grab_int(state, "Total count")
    out["sources_this_phase"] = grab_int(state, "Sources for current phase")
    since = grab_int(state, "Sources since last cross-reference")
    out["sources_since_cross_ref"] = since
    out["cross_ref_due"] = (since is not None and since >= 5)

    # Next Action: take the first non-empty line under the '## Next Action' heading.
    na = re.search(r"(?ims)^##+\s*Next Action\s*\n(.+?)(?=^\s*##\s|\Z)", state)
    if na:
        for line in na.group(1).splitlines():
            if strip_md(line):
                out["next_action"] = strip_md(line)
                break

    # --- Batch position: candidates for the active phase minus processed ---
    phase_num = None
    if phase:
        m = re.search(r"\d+", phase)
        phase_num = m.group() if m else None

    cand_file = None
    cands_dir = os.path.join(rdir, "discovery")
    if phase_num:
        hits = sorted(glob.glob(os.path.join(cands_dir, f"phase-{phase_num}-*candidates*.md")))
        cand_file = hits[0] if hits else None
    if cand_file is None:
        out["notes"].append("No candidates file found for the active phase — this is a "
                            "synthesis phase, or discovery hasn't run. Batch position N/A.")
        emit(out, as_json); return

    # parse candidates in file order: bullet line with a URL, plus its status tag
    candidates = []
    for line in read(cand_file).splitlines():
        if re.match(r"^\s*[-*]\s", line):
            u = URL_RE.search(line)
            if u:
                tag = re.search(r"\[([A-Z]+)\]", line)
                candidates.append({
                    "title": strip_md(re.sub(URL_RE, "", line)).lstrip("-* ").strip(),
                    "url": u.group().rstrip(".,);"),
                    "status": tag.group(1) if tag else None})
    out["candidates_file"] = os.path.relpath(cand_file, rdir)
    out["candidate_count"] = len(candidates)

    # skipped candidates live in the exclusions ledger
    excl = read(os.path.join(rdir, "discovery", "exclusions.md"))
    excl_urls = set(u.rstrip(".,);") for u in URL_RE.findall(excl))

    # EXACT derivation: a candidate is done when process-source flipped its tag to
    # [PROCESSED]; the next source is the first that is neither PROCESSED nor skipped.
    tagged = any(c["status"] == "PROCESSED" for c in candidates)
    n_processed = sum(1 for c in candidates if c["status"] == "PROCESSED")
    n_skipped = sum(1 for c in candidates if c["url"] in excl_urls)
    next_unprocessed = None
    for c in candidates:
        if c["status"] != "PROCESSED" and c["url"] not in excl_urls:
            next_unprocessed = c
            break

    phase_done = out.get("sources_this_phase")  # STATE counter: sources processed this phase
    if tagged or phase_done == 0:
        # Derivable: either the ledger is tagged, or nothing has been processed this
        # phase yet (so the first non-skipped candidate is genuinely next).
        out["match_mode"] = ("exact (candidates-file [PROCESSED] tags)" if tagged
                             else "exact (fresh batch — nothing processed yet)")
        out["processed_of_candidates"] = f"{n_processed}/{len(candidates)}"
    else:
        # Legacy: STATE says sources were processed this phase, but no candidate is
        # tagged [PROCESSED] — the batch ledger predates the wiring. Do not guess a
        # next source; defer to STATE's Next Action (the maintained pointer).
        out["match_mode"] = "legacy — sources processed but candidates untagged"
        next_unprocessed = None
        out["processed_of_candidates"] = f"untagged / {len(candidates)}"
        out["notes"].append("This project predates the batch-ledger wiring: sources have been "
                            "processed this phase but no candidate is tagged [PROCESSED], so the "
                            "next source cannot be derived from the file. Trust the STATE Next "
                            "Action below. Sources processed from now on tag their candidate, and "
                            "derivation becomes exact.")
    out["skipped"] = n_skipped
    out["next_unprocessed"] = next_unprocessed
    emit(out, as_json)

def emit(out, as_json):
    if as_json:
        print(json.dumps(out, indent=2)); return
    if not out.get("active_protocol"):
        print("\n".join(out["notes"])); return
    print(f"ACTIVE RESEARCH PROJECT — {out.get('phase') or '(phase unread)'}")
    print(f"  cycle step         : {out.get('cycle_step') or '(unread)'}")
    print(f"  sources since x-ref: {out.get('sources_since_cross_ref')}"
          f"{'  ⚠ CROSS-REF DUE' if out.get('cross_ref_due') else ''}")
    if "candidate_count" in out:
        print(f"  batch              : {out.get('processed_of_candidates')} candidates processed"
              f"  [{out.get('match_mode')}]")
        nu = out.get("next_unprocessed")
        if nu:
            print(f"  NEXT SOURCE        : {nu['title'][:70]}\n                       {nu['url']}")
        elif out.get("match_mode", "").startswith("exact"):
            print("  NEXT SOURCE        : none pending — batch complete for this phase")
        else:
            print("  NEXT SOURCE        : (not derivable — see STATE Next Action)")
    if out.get("next_action"):
        print(f"  STATE Next Action  : {out['next_action'][:100]}")
    for n in out["notes"]:
        print(f"  note: {n}")

if __name__ == "__main__":
    main()
