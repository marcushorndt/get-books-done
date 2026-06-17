# Git conventions

GBD versions both the prose (`manuscript/`) and the planning tree (`.book/`).
If the book folder is not a git repo, `/gbd:new-book` offers to `git init`.

## Commit format

`{type}({chapter}-{plan}): {scene-or-task name}`

| type | when |
|---|---|
| `draft` | new prose written for a scene |
| `revise` | substantive rework of existing prose |
| `edit` | line/copy edits applied (gbd-edit-applier) |
| `fix` | continuity / fact correction |
| `outline` | OUTLINE.md or chapter structure change |
| `bible` | story bible update |
| `chore(book)` | `.book/` metadata (CONTEXT, PLAN, SUMMARY, STATE) |

Examples:
```
draft(03-01): Mara finds the letter
revise(03-02): tighten the confrontation, cut throat-clearing
edit(03-01): copy pass — em-dashes, "grey"->"gray" per style sheet
fix(07-02): Mara's eyes blue not green (see bible/CHARACTERS.md)
chore(book): lock chapter 3 context decisions
```

## Granularity

One commit per scene drafted, per applied edit batch, per artifact written.
`config.planning.commit_docs=false` suppresses `.book/` metadata commits for authors
who only want prose history.
