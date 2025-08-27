# Review Subtree

Self-contained code review tooling located in `.windsurf/review/`. All dependencies and configs are local to this folder for subtree portability.

## Highlights
- Type-aware ESLint with local config: `.eslintrc.review.cjs`
- Inlined TypeScript configs: `tsconfig.eslint.json`, `tsconfig.review.json` (no root extends)
- Repo-wide analyzers: ESLint, TSC, Knip, JSCPD
- Analyzer writes report to: `.windsurf/review/output/code-review-results.json`
- Policy: ESLint warnings are treated as failures (`--max-warnings=0`)

## Running (Windows cmd)
Use these npm scripts from `.windsurf/review/`:

```cmd
cmd /c npm run review:porcelain  // Changed TS/TSX files only (git porcelain)
cmd /c npm run review:repo       // Full project scan under app/, components/, lib/, hooks/, types/, pages/
cmd /c npm run review:debug      // Full scan with debug output and report-all
cmd /c npm run tsc               // TypeScript diagnostics only (noEmit)
cmd /c npm run lint:repo         // ESLint only, repo-wide
```

From repo root, you can also use `--prefix`:
```cmd
cmd /c npm --prefix .windsurf\review run review:repo -- --help
```

### Troubleshooting
- **Error: `npm error Missing script: "review:repo"`**
  - Cause: running from repo root without `--prefix`.
  - Fix: either run within `.windsurf\review\`, or from root with:
    ```cmd
    cmd /c npm --prefix .windsurf\review run review:porcelain
    ```

If dependencies are missing, install locally:
```cmd
cmd /c npm ci
```

## ESLint cache
ESLint caching is enabled for both batch and per-file runs to speed up repeat analyses.

- Cache location: `.windsurf/review/.eslintcache`
- VCS: the cache file is ignored by `.windsurf/review/.gitignore`
- Effect: unchanged files are skipped by ESLint on subsequent runs

Clear the cache if needed:

```cmd
cmd /c del .windsurf\review\.eslintcache
```

## Performance tips
- **Concurrency**
  - Default is 8. Increase if your machine has spare CPU; decrease on CI/shared runners to reduce contention.
  - You can override explicitly via flag: `--concurrency <n>`.
- **When to clear the ESLint cache**
  - After changing ESLint/TypeScript config, parser options, plugin versions, or when results appear stale.
  - After large refactors or file moves if caching seems to miss updates.
- **Warm vs cold runs**
  - First run after a clean checkout or config change is a cold run; subsequent runs benefit from the cache.

## Notes
- Tools resolve plugins/binaries relative to this folder; no global installs required.
- ESLint uses `tsconfig.eslint.json` for type-aware rules; TSC uses `tsconfig.review.json`.
- The analyzer exits non-zero if any violations are found (including warnings).
