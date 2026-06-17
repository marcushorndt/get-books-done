#!/usr/bin/env python3
"""Clean-room overlap scanner: find verbatim word-runs shared between each GBD file
and its GSD ancestor. Reports matching runs of >= MIN_RUN words and a difflib ratio."""
import os, re, sys, difflib

HOME = os.path.expanduser("~")
REPO = os.path.join(HOME, "Documents/repos/get-books-done")
SKILLS = os.path.join(HOME, ".claude/skills")
WF = os.path.join(HOME, ".claude/get-shit-done/workflows")
GBDWF = os.path.join(REPO, "core/workflows")
AG = os.path.join(HOME, ".claude/agents")
GBDAG = os.path.join(REPO, "agents")
MIN_RUN = 8  # consecutive shared words to flag

# (gbd_path, gsd_path, label)
PAIRS = []
# skills
skill_map = {
    "gbd-new-book": "gsd-new-project", "gbd-outline": "gsd-phase",
    "gbd-discuss-chapter": "gsd-discuss-phase", "gbd-plan-chapter": "gsd-plan-phase",
    "gbd-draft-chapter": "gsd-execute-phase", "gbd-read-through": "gsd-verify-work",
    "gbd-editorial-review": "gsd-code-review", "gbd-continuity-review": "gsd-secure-phase",
    "gbd-sensitivity-review": "gsd-secure-phase", "gbd-map-manuscript": "gsd-map-codebase",
    "gbd-story-bible": "gsd-graphify", "gbd-complete-draft": "gsd-complete-milestone",
    "gbd-distribute": "gsd-ship", "gbd-progress": "gsd-progress",
    "gbd-resume-work": "gsd-resume-work", "gbd-stats": "gsd-stats", "gbd-help": "gsd-help",
}
for g, s in skill_map.items():
    PAIRS.append((f"{REPO}/skills/{g}/SKILL.md", f"{SKILLS}/{s}/SKILL.md", f"skill:{g}"))
# workflows
wf_map = {
    "new-book": "new-project", "outline": "phase", "discuss-chapter": "discuss-phase",
    "plan-chapter": "plan-phase", "draft-chapter": "execute-phase",
    "read-through": "verify-work", "editorial-review": "code-review",
    "continuity-review": "secure-phase", "sensitivity-review": "secure-phase",
    "map-manuscript": "map-codebase", "story-bible": "graphify",
    "complete-draft": "complete-milestone", "distribute": "ship", "progress": "progress",
    "resume-work": "resume-work", "stats": "stats", "help": "help",
}
for g, s in wf_map.items():
    PAIRS.append((f"{GBDWF}/{g}.md", f"{WF}/{s}.md", f"workflow:{g}"))
# agents
ag_map = {
    "gbd-planner": "gsd-planner", "gbd-drafter": "gsd-executor", "gbd-verifier": "gsd-verifier",
    "gbd-plan-checker": "gsd-plan-checker", "gbd-book-researcher": "gsd-project-researcher",
    "gbd-chapter-researcher": "gsd-phase-researcher", "gbd-outliner": "gsd-roadmapper",
    "gbd-editor": "gsd-code-reviewer", "gbd-edit-applier": "gsd-code-fixer",
    "gbd-continuity-checker": "gsd-security-auditor", "gbd-sensitivity-reader": "gsd-security-auditor",
    "gbd-bible-mapper": "gsd-codebase-mapper", "gbd-intel-updater": "gsd-intel-updater",
}
for g, s in ag_map.items():
    PAIRS.append((f"{GBDAG}/{g}.md", f"{AG}/{s}.md", f"agent:{g}"))

def words(path):
    if not os.path.exists(path):
        return None, None
    txt = open(path, encoding="utf-8", errors="ignore").read()
    toks = re.findall(r"\S+", txt.lower())
    return toks, txt

def runs(a, b, minrun):
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    out = []
    for blk in sm.get_matching_blocks():
        if blk.size >= minrun:
            out.append(" ".join(a[blk.a:blk.a+blk.size]))
    return out

print(f"Clean-room scan — flag shared runs >= {MIN_RUN} words\n" + "="*70)
flagged = []
for gbd, gsd, label in PAIRS:
    ga, gtxt = words(gbd); sa, stxt = words(gsd)
    if ga is None:
        print(f"\n[{label}] SKIP gbd missing: {gbd}"); continue
    if sa is None:
        print(f"\n[{label}] (no GSD ancestor on disk: {os.path.basename(gsd)}) — original"); continue
    ratio = difflib.SequenceMatcher(None, ga, sa, autojunk=False).ratio()
    r = runs(ga, sa, MIN_RUN)
    status = "FLAG" if r else "ok"
    if r:
        flagged.append(label)
    print(f"\n[{label}] ratio={ratio:.2f} runs>={MIN_RUN}w={len(r)} {status}")
    for run in sorted(r, key=lambda s: -len(s.split()))[:12]:
        print(f"   • ({len(run.split())}w) {run[:160]}")

print("\n" + "="*70)
print(f"FLAGGED ({len(flagged)}): {', '.join(flagged) if flagged else 'none'}")
