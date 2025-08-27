# .windsurf Subtree

Portable developer tooling and documentation shared across Windsurf projects. The `.windsurf/` folder is managed as a Git subtree pointing to an independent repository so that improvements can be pushed from one project and pulled into others without coupling main project history.

What this contains:
- `.windsurf/review/`: review tooling (ESLint, TypeScript, Knip, JSCPD, unified analyzer)
- `.windsurf/workflows/`: common workflows and runbooks
- `.windsurf/guides/`: guides and reference docs
- `.windsurf/tools/`: utility scripts

Policy and intent:
- Treat `.windsurf/` as a portable, shared subtree. Make improvements here, publish them upstream to the subtree repo, and consume them in other projects via subtree pulls.
- Keep your main project history independent by using `--squash` when adding/pulling.

Repository source (upstream of this subtree):
- Remote name: `windsurf_subtree`
- Remote URL: `https://github.com/anderson-international/.windsurf.git`

## 1) Getting started in a new project (no workflows yet)

If your project does not yet have `.windsurf/`, or you want to rebootstrap it:

1. Add the subtree remote
```cmd
cmd /c git remote add windsurf_subtree https://github.com/anderson-international/.windsurf.git
```

2. Ensure your working tree is clean and `.windsurf/` is absent (remove if necessary)
```cmd
cmd /c rmdir /s /q .windsurf
cmd /c git add -A
cmd /c git commit -m "Remove local .windsurf to prepare for subtree"
```

3. Add the subtree from upstream main (use --squash)
```cmd
cmd /c git fetch windsurf_subtree
cmd /c git subtree add --prefix=.windsurf windsurf_subtree main --squash
```

4. Quick verification
```cmd
cmd /c node .windsurf\tools\schema-query.js --help
```

## 2) Everyday use with workflows

Once the project contains `.windsurf/workflows/`, use these:

- Subtree push (publish your local `.windsurf/` improvements upstream)
  - See: `.windsurf/workflows/subtree-push.md`
  - Summary of what it runs:
    ```cmd
    cmd /c git subtree split --prefix=.windsurf -b windsurf-split
    cmd /c git push windsurf_subtree windsurf-split:main
    cmd /c git branch -D windsurf-split
    ```

- Subtree pull (bring down latest upstream improvements into this project)
  - See: `.windsurf/workflows/subtree-pull.md`
  - Summary of what it runs:
    ```cmd
    cmd /c git fetch windsurf_subtree
    cmd /c git subtree pull --prefix=.windsurf windsurf_subtree main --squash
    ```

Notes and troubleshooting:
- Conflicts, if any, will be limited to files under `.windsurf/`. Resolve, then `cmd /c git add -A` and `cmd /c git commit`.
- To keep repos independent, always use `--squash` for `subtree add/pull`.
- If the upstream main branch is protected, push your split to a feature branch (e.g., `project-<name>`) in the subtree repo and open a PR there.
