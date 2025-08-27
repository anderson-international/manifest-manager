---
description: Pull the latest .windsurf subtree from the shared subtree repository (no versioning)
---

Prerequisites:
- Remote `windsurf_subtree` points to `https://github.com/anderson-international/.windsurf.git`.
- Commit or stash any local changes under `.windsurf/` to avoid conflicts.

Steps:
1) Optional: verify clean working tree
// turbo
cmd /c git status --porcelain

2) Fetch the subtree remote
// turbo
cmd /c git fetch windsurf_subtree

3) Pull updates into `.windsurf/` using subtree with squash
// turbo
cmd /c git subtree pull --prefix=.windsurf windsurf_subtree main --squash

Notes:
- `--squash` keeps the main repo history clean while updating only `.windsurf/` files.
- If merge conflicts occur, they will be confined to files under `.windsurf/`. Resolve and commit as usual.
- If you need to pull from a non-main branch, replace `main` with the desired branch.
