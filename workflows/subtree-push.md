---
description: Push the .windsurf subtree to the shared subtree repository (no versioning)
---

Prerequisites:
- Remote `windsurf_subtree` points to `https://github.com/anderson-international/.windsurf.git`.
- You have committed your changes under `.windsurf/`.

Steps:
1) Optional: verify clean working tree
// turbo
cmd /c git status --porcelain

2) Optional: fetch and prune
// turbo
cmd /c git fetch --all --prune

3) Create/refresh split branch for `.windsurf/`
// turbo
cmd /c git subtree split --prefix=.windsurf -b windsurf-split

4) Push the split to the subtree repo main branch
// turbo
cmd /c git push windsurf_subtree windsurf-split:main

5) Clean up the ephemeral split branch
// turbo
cmd /c git branch -D windsurf-split

Notes:
- `subtree split` isolates history under `.windsurf/` only.
- Re-running these steps will publish the latest `.windsurf/` state.
- If the remote main branch is protected, push to another branch instead (e.g. `project-<name>`) and open a PR in the subtree repo.
