#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { applyAutofix } = require('./components/autofix/apply');

const { ROOT_DIR, OUTPUT_DIR, RESULTS_FILE, toRepoRelative, ensureDir } = require('./components/utils/paths');
const { FILE_SIZE_LIMITS, getFileType, isReviewablePath } = require('./components/utils/filters');
const { countLines, writeJson, deleteStaleReports } = require('./components/utils/fs-utils');
const { collectPorcelainFiles } = require('./components/utils/git');
const { mapLimit } = require('./components/utils/concurrency');

const { analyzeComments } = require('./components/per-file/analyze-comments');
const { analyzeReactPatterns } = require('./components/per-file/analyze-react');
const { analyzeConsoleErrors } = require('./components/per-file/analyze-console');
const { runEslint, runEslintBatch } = require('./components/per-file/run-eslint');
const { analyzeTypeScript } = require('./components/per-file/analyze-typescript');
const { analyzeFallbackData } = require('./components/per-file/analyze-fallback');

const { runKnip } = require('./components/repo/run-knip');
const { runJscpd } = require('./components/repo/run-jscpd');
const { runTsc } = require('./components/repo/run-tsc');

const { applyKnipToResults } = require('./components/merge/knip');
const { applyJscpdToResults } = require('./components/merge/jscpd');

const { generateMinimalSummary } = require('./components/summaries');

function printUsage() {
  const usage = [
    'Usage: cmd /c node .windsurf/review/code-review.js <file1> [file2 ...]',
    '',
    'Description:',
    '  Modular code review analyzer for TypeScript/TSX files:',
    '  - File size limits by directory type',
    '  - Disallowed comments (inline, JSDoc, multi-line)',
    '  - React usage patterns',
    '  - console.error/console.warn fail-fast violations',
    '  - ESLint errors/warnings (via npx eslint)',
    '  - TypeScript compiler diagnostics (via npx tsc --noEmit)',
    '  - Fallback data anti-patterns',
    '  - Dead code & unresolved imports (via knip)',
    '  - Duplicate code (via jscpd)',
    '',
    'Flags:',
    '  --porcelain                Auto-select changed TS/TSX files via git porcelain (if no changed files are detected, per-file analyzers are skipped but repo-wide analyzers still run)',
    '  --concurrency <n>          Limit per-file parallelism (default 8)',
    '  --jscpd-min-tokens <n>     Set JSCPD min tokens (default 50)',
    '  --jscpd-include <dirs>     Comma-separated include roots (default: app,components,lib,hooks,types; use "." for repo)',
    '  --no-autofix               Disable default auto-fix of comments/console lines',
    '  --debug                    Print extra debug details; summaries always include total time',
    '  --report-all               Include all files in JSON report if report is written',
    '  --tsconfig <path>          Use a specific tsconfig.json (default: repo root tsconfig.json)',
    '  --ts-scope <auto|project|subtree>  Control TSC config source (default auto: synthesize by merging project + subtree)',
    '  --skip-tsc                 Skip TypeScript compiler checks',
    '',
    'Default behavior:',
    '  • If no files are specified (and not in --porcelain mode), all valid TypeScript files are analyzed',
    '    under: app/, components/, lib/, hooks/, types/ (excluding .d.ts and excluded dirs)',
    '  • A JSON report is always written to .windsurf/review/output/code-review-results.json.',
    '    By default it includes only violating files; use --report-all to include all analyzed files.',
    '    When no violations are found, the report contains a pass summary and guidance (results: []).',
    '  • --ts-scope=auto (default) creates a temporary merged tsconfig for analysis by combining the project',
    '    tsconfig.json with .windsurf/review/tsconfig.eslint.json (project options have precedence).',
    '',
    'Exit codes:',
    '  0  All checks passed',
    '  1  One or more violations found or write error',
  ].join('\n');
  console.log(usage);
}

// Format milliseconds as minutes and seconds, e.g., "2m 03s"
function formatMs(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return '0m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  return `${minutes}m ${ss}s`;
}

// Auto-discover reviewable TS/TSX files across valid repo roots
function discoverReviewableTypeScriptFiles() {
  const includeRoots = ['app', 'components', 'lib', 'hooks', 'types'];
  const excludeDirs = new Set(['node_modules', '.git', '.windsurf', 'test']);
  const out = [];

  function walk(dirAbs) {
    let entries;
    try {
      entries = fs.readdirSync(dirAbs, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dirAbs, ent.name);
      if (ent.isDirectory()) {
        if (excludeDirs.has(ent.name)) continue;
        walk(full);
      } else {
        // Build repo-relative path and reuse isReviewablePath()
        const rel = path.relative(ROOT_DIR, full).replace(/\\/g, '/');
        if (isReviewablePath(rel)) out.push(full);
      }
    }
  }

  for (const root of includeRoots) {
    const abs = path.join(ROOT_DIR, root);
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) walk(abs);
    } catch (_) {}
  }

  return out;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse args
  let concurrency = 8;
  let jscpdMinTokens = undefined;
  let jscpdIncludeRoots = undefined;
  let debugMode = false;
  let reportAll = false;
  let tsconfigOverride = undefined;
  let skipTsc = false;
  let porcelainMode = false;
  let noAutofix = false;
  let tsScope = 'auto'; // auto|project|subtree
  // actionable output is always on; no flag needed

  const files = [];
  let hadExplicitFiles = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--concurrency') {
      const v = args[++i];
      const n = parseInt(v, 10);
      if (!Number.isNaN(n) && n > 0) concurrency = n;
      continue;
    }
    if (a.startsWith('--concurrency=')) {
      const v = a.split('=')[1];
      const n = parseInt(v, 10);
      if (!Number.isNaN(n) && n > 0) concurrency = n;
      continue;
    }
    if (a === '--jscpd-min-tokens') { jscpdMinTokens = parseInt(args[++i], 10); continue; }
    if (a.startsWith('--jscpd-min-tokens=')) { const v = a.split('=')[1]; const n = parseInt(v, 10); if (!Number.isNaN(n)) jscpdMinTokens = n; continue; }
    if (a === '--jscpd-include') { const v = args[++i]; if (typeof v === 'string') jscpdIncludeRoots = v.split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (a.startsWith('--jscpd-include=')) { const v = a.split('=')[1]; if (typeof v === 'string') jscpdIncludeRoots = v.split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (a === '--debug') { debugMode = true; continue; }
    if (a === '--report-all') { reportAll = true; continue; }
    if (a === '--no-autofix') { noAutofix = true; continue; }
    // actionable flags removed; always actionable
    if (a === '--tsconfig') { const v = args[++i]; if (typeof v === 'string') tsconfigOverride = path.isAbsolute(v) ? v : path.join(ROOT_DIR, v); continue; }
    if (a.startsWith('--tsconfig=')) { const v = a.split('=')[1]; if (typeof v === 'string') tsconfigOverride = path.isAbsolute(v) ? v : path.join(ROOT_DIR, v); continue; }
    if (a === '--ts-scope') { const v = String(args[++i] || '').trim(); if (v === 'auto' || v === 'project' || v === 'subtree') tsScope = v; continue; }
    if (a.startsWith('--ts-scope=')) { const v = String(a.split('=')[1] || '').trim(); if (v === 'auto' || v === 'project' || v === 'subtree') tsScope = v; continue; }
    if (a === '--skip-tsc') { skipTsc = true; continue; }
    if (a === '--porcelain') { porcelainMode = true; continue; }
    files.push(a);
    hadExplicitFiles = true;
  }

  const t0 = Date.now();

  // Porcelain collection
  if (porcelainMode && files.length === 0) {
    const collected = collectPorcelainFiles();
    for (const f of collected) files.push(f);
    if (debugMode) {
      const rels = files.map(toRepoRelative);
      console.log(`Porcelain selected ${rels.length} file(s): ${rels.join(', ')}`);
    }
  }

  if (files.length === 0) {
    if (!porcelainMode) {
      // Auto-discover all reviewable TypeScript files under valid roots (non-porcelain mode)
      const discovered = discoverReviewableTypeScriptFiles();
      if (debugMode) console.log(`Auto-discovered ${discovered.length} reviewable file(s).`);
      if (discovered.length === 0) {
        console.error('No reviewable TypeScript files found under app/, components/, lib/, hooks/, types/.');
        process.exit(1);
      }
      for (const f of discovered) files.push(f);
    }
    // In porcelain mode with zero files, proceed with empty per-file set but still run repo analyzers.
  }

  // Delete stale legacy reports
  try { deleteStaleReports(); } catch (_) {}

  // Normalize to absolute paths and filter reviewable TS/TSX
  const absFilesIn = files.map(fp => path.isAbsolute(fp) ? fp : path.join(ROOT_DIR, fp));
  const absFiles = absFilesIn.filter(p => isReviewablePath(path.relative(ROOT_DIR, p).replace(/\\/g, '/')));

  // Optional autofix
  const autofix = { enabled: !noAutofix && process.env.CODE_REVIEW_NO_AUTOFIX !== '1', filesProcessed: 0, commentsRemoved: 0, consolesRemoved: 0, errors: 0 };
  const tAutofix0 = Date.now();
  if (autofix.enabled) {
    try {
      const stats = await applyAutofix(absFiles, { concurrency });
      autofix.filesProcessed = stats.filesProcessed || 0;
      autofix.commentsRemoved = stats.commentsRemoved || 0;
      autofix.consolesRemoved = stats.consolesRemoved || 0;
      autofix.errors = stats.errors || 0;
    } catch (err) {
      // Continue without blocking the rest of the analysis
    }
  }
  const tAutofix1 = Date.now();

  // Resolve tsconfig for TSC based on scope/settings
  function readJsonSafe(p) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return undefined; }
  }
  function uniq(arr) { return Array.from(new Set((Array.isArray(arr) ? arr : []).filter(Boolean))); }
  function writeSyntheticTsconfig(baseTsconfigPath, subtreeTsconfigPath) {
    const outDir = path.join(OUTPUT_DIR, '.tmp', 'tsc');
    ensureDir(outDir);
    const synthPath = path.join(outDir, 'tsconfig.runtime.json');
    const baseJson = baseTsconfigPath ? readJsonSafe(baseTsconfigPath) : {};
    const subtreeJson = subtreeTsconfigPath ? readJsonSafe(subtreeTsconfigPath) : {};
    const baseCO = (baseJson && baseJson.compilerOptions) || {};
    const subtreeCO = (subtreeJson && subtreeJson.compilerOptions) || {};
    // Build compilerOptions: subtree wins on conflicts, otherwise include keys from either
    const mergedCO = { ...baseCO, ...subtreeCO };
    const prefixToRoot = path.relative(outDir, ROOT_DIR).replace(/\\/g, '/');
    const normalizeJoin = (base, rel) => {
      const pathPosix = require('path').posix;
      const b = String(base || '').replace(/\\/g, '/');
      let r = String(rel || '').replace(/\\/g, '/');
      if (!r) return r;
      if (/^[A-Za-z]:/.test(r)) return r; // absolute windows path
      // strip leading ./ and ../ segments so we always anchor to repo root prefix
      while (r.startsWith('./')) r = r.slice(2);
      while (r.startsWith('../')) r = r.slice(3);
      if (r.startsWith('/')) r = r.slice(1);
      // join and normalize using posix semantics
      const joined = b ? pathPosix.join(b, r) : r;
      return pathPosix.normalize(joined);
    };
    const ensurePrefixed = (pat) => normalizeJoin(prefixToRoot, pat);

    // Includes: intelligent union. Start with union(project, subtree) and essential entries.
    const projectInclude = Array.isArray(baseJson?.include) ? baseJson.include : [];
    const subtreeInclude = Array.isArray(subtreeJson?.include) ? subtreeJson.include : [];
    let includeUnion = uniq([...projectInclude, ...subtreeInclude, 'next-env.d.ts', '.next/types/**/*.ts']);
    const hasAllTs = includeUnion.some((p) => String(p).includes('**/*.ts'));
    const hasAllTsx = includeUnion.some((p) => String(p).includes('**/*.tsx'));
    includeUnion = includeUnion.filter((p) => {
      const s = String(p || '');
      if (s === 'next-env.d.ts' || s === '.next/types/**/*.ts') return true;
      if (hasAllTs && s !== '**/*.ts' && s.includes('**/*.ts')) return false;
      if (hasAllTsx && s !== '**/*.tsx' && s.includes('**/*.tsx')) return false;
      return true;
    });
    let include = includeUnion.map(ensurePrefixed);
    include = uniq(include);
    if (!include.length) include = [ensurePrefixed('**/*.ts'), ensurePrefixed('**/*.tsx')];

    // Excludes: union(project, subtree) plus enforced minimum set
    const projectExclude = Array.isArray(baseJson?.exclude) ? baseJson.exclude : [];
    const subtreeExclude = Array.isArray(subtreeJson?.exclude) ? subtreeJson.exclude : [];
    const enforced = ['node_modules', '.windsurf', '.next', 'dist', 'build'];
    let exclude = uniq([...projectExclude, ...subtreeExclude, ...enforced]).map(ensurePrefixed);
    exclude = uniq(exclude);

    // Ensure baseUrl when paths exist but baseUrl is missing
    const hasPaths = mergedCO && mergedCO.paths && Object.keys(mergedCO.paths).length > 0;
    if (hasPaths) {
      // Always force baseUrl to repo root for correctness in standalone synthetic config
      mergedCO.baseUrl = prefixToRoot || '.';
    }

    // Write standalone synthetic config (no extends)
    const synthetic = {};
    if (Object.keys(mergedCO).length) synthetic.compilerOptions = mergedCO;
    if (include.length) synthetic.include = include;
    if (exclude.length) synthetic.exclude = exclude;
    fs.writeFileSync(synthPath, JSON.stringify(synthetic, null, 2), 'utf8');
    return synthPath;
  }
  function resolveTsconfigPath() {
    if (tsconfigOverride) return tsconfigOverride;
    const projectTs = path.join(ROOT_DIR, 'tsconfig.json');
    const subtreeTs = path.join(ROOT_DIR, '.windsurf', 'review', 'tsconfig.eslint.json');
    const hasProject = (() => { try { return fs.existsSync(projectTs); } catch (_) { return false; } })();
    const hasSubtree = (() => { try { return fs.existsSync(subtreeTs); } catch (_) { return false; } })();
    if (tsScope === 'project') return hasProject ? projectTs : (hasSubtree ? subtreeTs : undefined);
    if (tsScope === 'subtree') return hasSubtree ? subtreeTs : (hasProject ? projectTs : undefined);
    // auto: synthesize merged (project preferred)
    if (hasProject || hasSubtree) return writeSyntheticTsconfig(hasProject ? projectTs : undefined, hasSubtree ? subtreeTs : undefined);
    return undefined;
  }
  const resolvedTsconfigPath = resolveTsconfigPath();

  // Start repo-wide analyzers concurrently right after autofix (they will run in parallel with ESLint batch and per-file work)
  const tRepo0 = Date.now();
  const repoBreakdown = {};
  const pKnip = (async () => {
    const s = Date.now();
    const d = await runKnip();
    repoBreakdown.knipMs = Date.now() - s;
    return d;
  })();
  const pJscpd = (async () => {
    const s = Date.now();
    const d = await runJscpd({ includeRoots: jscpdIncludeRoots, minTokens: jscpdMinTokens });
    repoBreakdown.jscpdMs = Date.now() - s;
    return d;
  })();
  const pTsc = (async () => {
    const s = Date.now();
    const d = skipTsc
      ? { byFile: {}, totalErrors: 0, tsconfigPath: (resolvedTsconfigPath || path.join(ROOT_DIR, 'tsconfig.json')) }
      : await runTsc(resolvedTsconfigPath);
    repoBreakdown.tscMs = Date.now() - s;
    return d;
  })();

  // Optional ESLint batch (single run) to speed up per-file phase
  const useEslintBatch = process.env.CODE_REVIEW_ESLINT_BATCH !== '0';
  let eslintMap = {};
  let eslintBatchMs = 0;
  if (useEslintBatch) {
    const tEslintBatch0 = Date.now();
    try {
      const CHUNK_SIZE = 200;
      for (let i = 0; i < absFiles.length; i += CHUNK_SIZE) {
        const chunk = absFiles.slice(i, i + CHUNK_SIZE);
        const partial = await runEslintBatch(chunk);
        for (const [k, v] of Object.entries(partial)) {
          eslintMap[k] = v;
        }
      }
    } catch (_) {}
    eslintBatchMs = Date.now() - tEslintBatch0;
    if (debugMode) console.log(`[eslint-batch] analyzed ${Object.keys(eslintMap).length} file(s) in ${formatMs(eslintBatchMs)}`);
  }

  // Per-file analysis in parallel
  const tFiles0 = Date.now();
  const results = await mapLimit(absFiles, concurrency, async (filePath) => {
    const rel = toRepoRelative(filePath);
    const fileType = getFileType(filePath);
    const limit = FILE_SIZE_LIMITS[fileType];
    const tLines0 = Date.now();
    const lines = countLines(filePath);
    const linesMs = Date.now() - tLines0;
    const size = { lines, limit, status: (typeof limit === 'number' && lines > limit) ? 'FAIL' : 'PASS' };
    
    const tComments0 = Date.now();
    const commentsArr = analyzeComments(filePath);
    const commentsMs = Date.now() - tComments0;
    const comments = { count: commentsArr.length, status: commentsArr.length === 0 ? 'PASS' : 'FAIL', violations: commentsArr };
    
    const tReact0 = Date.now();
    const react = analyzeReactPatterns(filePath);
    const reactMs = Date.now() - tReact0;

    const tConsole0 = Date.now();
    const consoleErrors = analyzeConsoleErrors(filePath);
    const consoleMs = Date.now() - tConsole0;

    const tEslint0 = Date.now();
    const eslint = useEslintBatch ? (eslintMap[filePath] || runEslint(filePath)) : runEslint(filePath);
    const eslintMs = Date.now() - tEslint0;

    const tTs0 = Date.now();
    const typescript = analyzeTypeScript(filePath);
    const typescriptMs = Date.now() - tTs0;

    const tFallback0 = Date.now();
    const fallbackData = analyzeFallbackData(filePath);
    const fallbackMs = Date.now() - tFallback0;

    const timing = { linesMs, commentsMs, reactMs, consoleMs, eslintMs, typescriptMs, fallbackMs };

    return { filePath: filePath, relPath: rel, fileType, size, comments, react, consoleErrors, eslint, typescript, fallbackData, timing };
  });
  const tFiles1 = Date.now();

  // Repo-wide analyzers results
  const [knipData, jscpdData, tscData] = await Promise.all([pKnip, pJscpd, pTsc]);
  const tRepo1 = Date.now();

  // Attach TSC per-file
  try {
    const byFile = tscData && tscData.byFile ? tscData.byFile : {};
    for (const r of results) {
      const key = toRepoRelative(r.filePath);
      const errs = byFile[key] || [];
      r.typescriptCompiler = { errorCount: errs.length, errors: errs, status: errs.length === 0 ? 'PASS' : 'FAIL' };
    }
  } catch (_) {}

  // Merge repo-wide results (knip merge is async due to bounded file scans)
  const knipAgg = await applyKnipToResults(results, knipData || {}, { concurrency });
  const jscpdAgg = applyJscpdToResults(results, jscpdData || {});

  // Compute suppression of TSC errors for files Knip marks as unused
  const knipUnusedSet = new Set(
    Array.isArray(knipAgg.details?.unusedFiles)
      ? knipAgg.details.unusedFiles.map((p) => {
          let s = String(p || '').replace(/\\/g, '/');
          if (s.startsWith('./')) s = s.slice(2);
          if (s.startsWith('.windsurf/review/')) s = s.slice('.windsurf/review/'.length);
          return s;
        })
      : []
  );
  const tscByFile = (tscData && tscData.byFile) ? tscData.byFile : {};
  const filteredByFile = {};
  const suppressed = [];
  for (const [file, errs] of Object.entries(tscByFile)) {
    const norm = String(file || '').replace(/\\/g, '/');
    if (knipUnusedSet.has(norm)) {
      const count = Array.isArray(errs) ? errs.length : 0;
      if (count > 0) suppressed.push({ file: norm, count });
      continue;
    }
    filteredByFile[file] = errs;
  }
  const filteredTotalErrors = Object.values(filteredByFile).reduce((a, arr) => a + ((Array.isArray(arr) ? arr.length : 0)), 0);

  // Repo-wide violation detection and summary
  const repoViolation = (filteredTotalErrors > 0) ||
    (knipAgg.summary.unusedFiles > 0 ||
     knipAgg.summary.unusedExports > 0 ||
     knipAgg.summary.unusedTypes > 0 ||
     (knipAgg.summary.unusedExportedTypes || 0) > 0 ||
     knipAgg.summary.unusedEnumMembers > 0 ||
     knipAgg.summary.unusedClassMembers > 0 ||
     knipAgg.summary.unlistedDependencies > 0 ||
     knipAgg.summary.unresolvedImports > 0) ||
    (jscpdAgg.summary.groups > 0 ||
     jscpdAgg.summary.duplicatedLines > 0 ||
     jscpdAgg.summary.percentage > 0);

  const repoSummary = {
    knip: knipAgg.summary,
    jscpd: jscpdAgg.summary,
    tsc: { totalErrors: filteredTotalErrors, tsconfigPath: (tscData.tsconfigPath ? String(tscData.tsconfigPath).replace(/\\/g, '/') : null) }
  };

  // Summaries and result JSON (with timing)
  const t1 = Date.now();
  const timing = {
    autofixMs: (tAutofix1 - tAutofix0),
    perFileMs: (tFiles1 - tFiles0),
    repoMs: (tRepo1 - tRepo0),
    totalMs: (t1 - t0),
    eslintBatchMs,
    repoBreakdown
  };

  const reviewMode = porcelainMode ? 'Touched Files Only' : (hadExplicitFiles ? 'File List Supplied' : 'Full Project Scan');
  const minimalSummary = generateMinimalSummary(results, { timing, debugMode, repo: repoSummary, reportPath: toRepoRelative(RESULTS_FILE), reviewMode });
  console.log(minimalSummary);

  // Determine if any violations exist
  const perFileViolation = results.some(r =>
    r.eslint.errors.length > 0 || r.eslint.warnings.length > 0 ||
    r.comments.status === 'FAIL' || r.size.status === 'FAIL' ||
    r.typescript.status === 'FAIL' || (r.typescriptCompiler && r.typescriptCompiler.status === 'FAIL') ||
    r.consoleErrors.status === 'FAIL' || r.fallbackData.status === 'FAIL' ||
    (r.deadCode && r.deadCode.status === 'FAIL') || (r.duplicates && r.duplicates.status === 'FAIL')
  );
  const anyViolation = perFileViolation || repoViolation;

  // Write JSON report always (concise payload on zero violations)
  try {
    ensureDir(OUTPUT_DIR);
    const hasViolations = anyViolation;
    const resultsToWrite = hasViolations
      ? (reportAll ? results : results.filter(r => (
          r.eslint.errors.length > 0 || r.eslint.warnings.length > 0 || r.comments.status === 'FAIL' || r.size.status === 'FAIL' || r.typescript.status === 'FAIL' || r.consoleErrors.status === 'FAIL' || r.fallbackData.status === 'FAIL' || (r.typescriptCompiler && r.typescriptCompiler.status === 'FAIL') || (r.deadCode && r.deadCode.status === 'FAIL') || (r.duplicates && r.duplicates.status === 'FAIL')
        )))
      : (reportAll ? results : []);

    // Ensure TSC-only repo failures still surface error details in results
    // Use UNSUPPRESSED error count; if all errors are suppressed, do NOT emit synthetic entry
    if (hasViolations && resultsToWrite.length === 0 && (filteredTotalErrors || 0) > 0) {
      // Flatten filteredByFile errors to represent unsuppressed diagnostics
      const flatErrors = [];
      for (const arr of Object.values(filteredByFile)) {
        if (Array.isArray(arr)) flatErrors.push(...arr);
      }
      const synthetic = {
        filePath: '(repo) TypeScript Compiler',
        relPath: '__global__',
        fileType: 'ts',
        size: { lines: 0, limit: null, status: 'PASS' },
        comments: { count: 0, status: 'PASS' },
        react: { hooks: [], components: [], status: 'PASS' },
        consoleErrors: { count: 0, lines: [], status: 'PASS' },
        eslint: { errors: [], warnings: [] },
        typescript: { issues: [], status: 'PASS' },
        fallbackData: { findings: [], status: 'PASS' },
        typescriptCompiler: { errorCount: filteredTotalErrors || 0, errors: flatErrors, status: (filteredTotalErrors || 0) > 0 ? 'FAIL' : 'PASS' },
        timing: { linesMs: 0, commentsMs: 0, reactMs: 0, consoleMs: 0, eslintMs: 0, typescriptMs: 0, fallbackMs: 0 }
      };
      resultsToWrite.push(synthetic);
    }

    // Build minimal per-file results: only include failing categories and guidance
    const minimalizeFile = (r) => {
      const out = { relPath: r.relPath || toRepoRelative(r.filePath) };
      if (r.eslint && ((r.eslint.errors && r.eslint.errors.length) || (r.eslint.warnings && r.eslint.warnings.length))) {
        out.eslint = {
          errors: r.eslint.errors || [],
          warnings: r.eslint.warnings || []
        };
      }
      if (r.comments && r.comments.status === 'FAIL') {
        out.comments = {
          count: r.comments.count || 0,
          violations: r.comments.violations || []
        };
      }
      if (r.size && r.size.status === 'FAIL') {
        out.size = {
          lines: r.size.lines || 0,
          limit: r.size.limit || 0
        };
      }
      if (r.consoleErrors && r.consoleErrors.status === 'FAIL') {
        out.console = {
          violations: r.consoleErrors.violations || []
        };
      }
      if (r.typescript && r.typescript.status === 'FAIL') {
        out.typescriptHeuristics = {
          missingReturnTypes: r.typescript.missingReturnTypes || 0,
          details: r.typescript.details || []
        };
      }
      if (r.typescriptCompiler && r.typescriptCompiler.status === 'FAIL') {
        out.typescriptCompiler = {
          errorCount: r.typescriptCompiler.errorCount || 0,
          errors: r.typescriptCompiler.errors || []
        };
      }
      if (r.fallbackData && r.fallbackData.status === 'FAIL') {
        out.fallbackData = {
          violations: r.fallbackData.violations || []
        };
      }
      if (r.deadCode && r.deadCode.status === 'FAIL') {
        const dc = {};
        // unusedExports → array of names when present
        if ((r.deadCode.unusedExports || 0) > 0 && Array.isArray(r.deadCode.unusedExportNames) && r.deadCode.unusedExportNames.length) {
          dc.unusedExports = r.deadCode.unusedExportNames;
        }
        // unusedTypes → array of names when present
        if ((r.deadCode.unusedTypes || 0) > 0 && Array.isArray(r.deadCode.unusedTypeNames) && r.deadCode.unusedTypeNames.length) {
          dc.unusedTypes = r.deadCode.unusedTypeNames;
        }
        // unusedExportedTypes → array of names when present
        if ((r.deadCode.unusedExportedTypes || 0) > 0 && Array.isArray(r.deadCode.unusedExportedTypeNames) && r.deadCode.unusedExportedTypeNames.length) {
          dc.unusedExportedTypes = r.deadCode.unusedExportedTypeNames;
        }
        // unusedEnumMembers → array of { enum, members[] } when present
        if ((r.deadCode.unusedEnumMembers || 0) > 0 && Array.isArray(r.deadCode.unusedEnumMemberNames) && r.deadCode.unusedEnumMemberNames.length) {
          dc.unusedEnumMembers = r.deadCode.unusedEnumMemberNames;
        }
        // unusedClassMembers → array of { class, members[] } when present
        if ((r.deadCode.unusedClassMembers || 0) > 0 && Array.isArray(r.deadCode.unusedClassMemberNames) && r.deadCode.unusedClassMemberNames.length) {
          dc.unusedClassMembers = r.deadCode.unusedClassMemberNames;
        }
        // unresolvedImports → include specifiers only when violations exist
        if ((r.deadCode.unresolvedImports || 0) > 0 && Array.isArray(r.deadCode.unresolvedImportSpecifiers) && r.deadCode.unresolvedImportSpecifiers.length) {
          dc.unresolvedImportSpecifiers = r.deadCode.unresolvedImportSpecifiers;
        }
        // unlistedDependencies → include modules only when violations exist
        if ((r.deadCode.unlistedDependencies || 0) > 0 && Array.isArray(r.deadCode.unlistedDependencyModules) && r.deadCode.unlistedDependencyModules.length) {
          dc.unlistedDependencyModules = r.deadCode.unlistedDependencyModules;
        }
        // Only attach deadCode if any keys were added
        if (Object.keys(dc).length > 0) {
          out.deadCode = dc;
        }
      }
      if (r.duplicates && r.duplicates.status === 'FAIL') {
        out.duplicates = {
          count: r.duplicates.count || 0,
          segments: r.duplicates.segments || []
        };
      }
      // Build normalized actionable issues and actions (always on)
        const issues = [];
        const actions = [];
        // Size
        if (out.size && (out.size.lines || 0) > (out.size.limit || 0)) {
          issues.push({ source: 'size', type: 'file-size', line: 0, column: 0, message: `File has ${out.size.lines} lines (limit ${out.size.limit}).`, guidance: 'Analyze the file to determine a logical decomposition into separate concerns. Do not resolve by compression tricks. This rule enforces intelligent separation of concerns.' });
          actions.push('Analyze and refactor the file into clear, separate concerns; do not compress code just to reduce line count.');
        }
        // ESLint
        if (out.eslint) {
          const pushMsg = (arr) => { for (const m of arr) issues.push({ source: 'eslint', type: 'lint', rule: m.rule || null, line: m.line || 0, column: m.column || 0, endLine: m.endLine, endColumn: m.endColumn, message: m.message, fixable: m.fixable || false, guidance: 'Address ESLint rule violation.' }); };
          if (Array.isArray(r.eslint.errors)) pushMsg(r.eslint.errors);
          if (Array.isArray(r.eslint.warnings)) pushMsg(r.eslint.warnings);
          actions.push('Run ESLint autofix where safe: npx eslint <this file> --config .windsurf/review/.eslintrc.review.cjs --fix');
        }
        // Comments
        if (out.comments && Array.isArray(out.comments.violations) && out.comments.violations.length) {
          for (const v of out.comments.violations) {
            issues.push({ source: 'comments', type: v.type || 'comment', line: v.line || 0, column: 0, message: `Disallowed comment: ${String(v.content || '').slice(0,200)}` , guidance: 'Remove the comment from source. Use docs instead.' });
          }
          actions.push(`Remove disallowed comments at lines: ${out.comments.violations.map(v => v.line).filter(Boolean).slice(0,50).join(', ')}`);
        }
        // Console
        if (out.console && Array.isArray(out.console.violations) && out.console.violations.length) {
          for (const v of out.console.violations) {
            issues.push({ source: 'console', type: v.method || 'console', line: v.line || 0, column: 0, message: v.content || 'console usage', guidance: v.guidance || 'Replace console with proper error handling.' });
          }
          actions.push(`Replace console.warn/error with throwing at lines: ${out.console.violations.map(v => v.line).filter(Boolean).slice(0,50).join(', ')}`);
        }
        // TS heuristics
        if (out.typescriptHeuristics && Array.isArray(out.typescriptHeuristics.details) && out.typescriptHeuristics.details.length) {
          for (const d of out.typescriptHeuristics.details) {
            issues.push({ source: 'ts-heuristics', type: 'missing-return-type', line: d.line || 0, column: 0, message: `Add explicit return type for ${d.name || 'function'}`, guidance: 'Add explicit return types to exported/public functions and callbacks.' });
          }
          actions.push(`Add explicit return types for: ${out.typescriptHeuristics.details.map(d => `${d.name || 'fn'}@${d.line || '?'}`).slice(0,20).join(', ')}`);
        }
        // TSC compiler
        if (r.typescriptCompiler && Array.isArray(r.typescriptCompiler.errors) && r.typescriptCompiler.errors.length) {
          for (const e of r.typescriptCompiler.errors) {
            issues.push({ source: 'tsc', type: e.code || 'TS', line: e.line || 0, column: e.column || 0, message: e.message || '', guidance: 'Resolve TypeScript compiler error.' });
          }
          actions.push('Run: npx tsc --noEmit and fix compiler errors in this file.');
        }
        // Fallbacks
        if (out.fallbackData && Array.isArray(out.fallbackData.violations) && out.fallbackData.violations.length) {
          for (const v of out.fallbackData.violations) {
            issues.push({ source: 'fallback', type: v.type || 'fallback', line: v.line || 0, column: 0, message: v.content || '', guidance: v.advice || 'Avoid silent fallbacks; use explicit validation and throw composed errors.' });
          }
          actions.push('Replace silent fallbacks with explicit validation and thrown errors where appropriate.');
        }
        // Intentionally omit generic per-file deadCode action to avoid duplicating repo-level knip guidance
        if (out.duplicates && out.duplicates.count) {
          actions.push('Refactor duplicated code into shared utilities/components.');
        }
        if (issues.length) out.issues = issues;
        if (actions.length) out.actions = actions;
      return out;
    };

    const minimalResults = resultsToWrite.map(minimalizeFile);
    // Build per-file category presence maps for deduplication of repo-level details
    const perFileCategorySets = (() => {
      const toSet = () => new Set();
      const sets = {
        unusedExports: toSet(),
        unusedTypes: toSet(),
        unusedExportedTypes: toSet(),
        unusedEnumMembers: toSet(),
        unusedClassMembers: toSet(),
        unresolvedImports: toSet(),
        unlistedDependencies: toSet(),
      };
      for (const r of minimalResults) {
        const file = r.relPath;
        const dc = r.deadCode || {};
        if (Array.isArray(dc.unusedExports) && dc.unusedExports.length) sets.unusedExports.add(file);
        if (Array.isArray(dc.unusedTypes) && dc.unusedTypes.length) sets.unusedTypes.add(file);
        if (Array.isArray(dc.unusedExportedTypes) && dc.unusedExportedTypes.length) sets.unusedExportedTypes.add(file);
        if (Array.isArray(dc.unusedEnumMembers) && dc.unusedEnumMembers.length) sets.unusedEnumMembers.add(file);
        if (Array.isArray(dc.unusedClassMembers) && dc.unusedClassMembers.length) sets.unusedClassMembers.add(file);
        if (Array.isArray(dc.unresolvedImportSpecifiers) && dc.unresolvedImportSpecifiers.length) sets.unresolvedImports.add(file);
        if (Array.isArray(dc.unlistedDependencyModules) && dc.unlistedDependencyModules.length) sets.unlistedDependencies.add(file);
      }
      return sets;
    })();

    // Build minimal repo-level failures only
    const repoOut = {};
    if ((filteredTotalErrors || 0) > 0 || suppressed.length > 0) {
      const tscOut = {
        totalErrors: filteredTotalErrors || 0,
        tsconfigPath: (tscData.tsconfigPath ? String(tscData.tsconfigPath).replace(/\\/g, '/') : null),
        suppressed: suppressed,
        guidance: 'TypeScript errors for files reported as unused by Knip are suppressed at repo level to prioritize actionable fixes. Run npx tsc --noEmit and resolve remaining errors.'
      };
      // Only include details (byFile/raw) when there are UNSUPPRESSED errors
      if ((filteredTotalErrors || 0) > 0) {
        const details = {};
        if (filteredByFile && Object.keys(filteredByFile).length > 0) details.byFile = filteredByFile;
        if (tscData.raw) details.raw = tscData.raw;
        if (Object.keys(details).length > 0) tscOut.details = details;
      }
      repoOut.tsc = tscOut;
    }
    const knipFail = (
      knipAgg.summary.unusedFiles > 0 ||
      knipAgg.summary.unusedExports > 0 ||
      knipAgg.summary.unusedTypes > 0 ||
      knipAgg.summary.unusedEnumMembers > 0 ||
      knipAgg.summary.unusedClassMembers > 0 ||
      knipAgg.summary.unlistedDependencies > 0 ||
      knipAgg.summary.unresolvedImports > 0
    );
    if (knipFail) {
      const knip = {};
      const d = knipAgg.details || {};
      // Normalize repo-detail paths: forward slashes and strip leading '.windsurf/review/' (and optional './')
      const _normRepoPath = (p) => {
        let s = String(p || '').replace(/\\/g, '/');
        if (s.startsWith('./.windsurf/review/')) s = s.slice('./.windsurf/review/'.length);
        else if (s.startsWith('.windsurf/review/')) s = s.slice('.windsurf/review/'.length);
        else if (s.startsWith('./')) s = s.slice(2);
        return s;
      };
      const _normFileObjArr = (arr) => Array.isArray(arr)
        ? arr.map(x => ({ ...x, file: _normRepoPath(x.file) }))
        : arr;
      const _normFileStrArr = (arr) => Array.isArray(arr)
        ? arr.map(p => _normRepoPath(p))
        : arr;

      // Seed counts from authoritative summary to ensure repo-level visibility without duplicating per-file details
      const s = knipAgg.summary || {};
      if ((s.unusedFiles || 0) > 0) knip.unusedFiles = s.unusedFiles;
      if ((s.unusedExports || 0) > 0) knip.unusedExports = s.unusedExports;
      if ((s.unusedTypes || 0) > 0) knip.unusedTypes = s.unusedTypes;
      if ((s.unusedExportedTypes || 0) > 0) knip.unusedExportedTypes = s.unusedExportedTypes;
      if ((s.unusedEnumMembers || 0) > 0) knip.unusedEnumMembers = s.unusedEnumMembers;
      if ((s.unusedClassMembers || 0) > 0) knip.unusedClassMembers = s.unusedClassMembers;
      if ((s.unlistedDependencies || 0) > 0) knip.unlistedDependencies = s.unlistedDependencies;
      if ((s.unresolvedImports || 0) > 0) knip.unresolvedImports = s.unresolvedImports;

      // Deduplicate: exclude files already represented per-file for the same category
      if (Array.isArray(d.unresolvedImports) && d.unresolvedImports.length) {
        const arr = d.unresolvedImports.filter(x => !perFileCategorySets.unresolvedImports.has(x.file));
        if (arr.length) knip.unresolvedImportDetails = _normFileObjArr(arr);
      }
      if (Array.isArray(d.unlistedDependencies) && d.unlistedDependencies.length) {
        const arr = d.unlistedDependencies.filter(x => !perFileCategorySets.unlistedDependencies.has(x.file));
        if (arr.length) knip.unlistedDependencyDetails = _normFileObjArr(arr);
      }
      if (Array.isArray(d.unusedFiles) && d.unusedFiles.length) {
        // unusedFiles has only file paths; leave as-is (not duplicated per-file)
        knip.unusedFileDetails = _normFileStrArr(d.unusedFiles);
      }
      if (Array.isArray(d.unusedExports) && d.unusedExports.length) {
        const arr = d.unusedExports.filter(x => !perFileCategorySets.unusedExports.has(x.file));
        if (arr.length) knip.unusedExportDetails = _normFileObjArr(arr);
      }
      if (Array.isArray(d.unusedTypes) && d.unusedTypes.length) {
        const arr = d.unusedTypes.filter(x => !perFileCategorySets.unusedTypes.has(x.file));
        if (arr.length) knip.unusedTypeDetails = _normFileObjArr(arr);
      }
      if (Array.isArray(d.unusedExportedTypes) && d.unusedExportedTypes.length) {
        const arr = d.unusedExportedTypes.filter(x => !perFileCategorySets.unusedExportedTypes.has(x.file));
        if (arr.length) knip.unusedExportedTypeDetails = _normFileObjArr(arr);
      }
      if (Array.isArray(d.unusedEnumMembers) && d.unusedEnumMembers.length) {
        const arr = d.unusedEnumMembers.filter(x => !perFileCategorySets.unusedEnumMembers.has(x.file));
        if (arr.length) knip.unusedEnumMemberDetails = _normFileObjArr(arr);
      }
      if (Array.isArray(d.unusedClassMembers) && d.unusedClassMembers.length) {
        const arr = d.unusedClassMembers.filter(x => !perFileCategorySets.unusedClassMembers.has(x.file));
        if (arr.length) knip.unusedClassMemberDetails = _normFileObjArr(arr);
      }

      // Build due-diligence guidance with category-specific addenda
      const gParts = [
        '*DO NOT SEEK APPROVAL* Findings are high-confidence. Perform minimal due diligence before destructive changes (where delete is uncertain, stop and report).'
      ];
      // Avoid redundant analyzer work to save time
      gParts.push('Do not manually re-run analyzers; focus on applying fixes.');
      if ((knip.unusedFiles || 0) > 0) gParts.push('Remove files not referenced anywhere.');
      if ((knip.unusedExports || 0) > 0) gParts.push('Remove unused exported symbols or their references. Prefer removing the symbol if truly unused; otherwise, fix the references.');
      if ((knip.unusedTypes || 0) > 0) gParts.push('Remove truly unused type aliases/interfaces. Ensure no indirect references (e.g., via index barrels) before deletion.');
      if ((knip.unusedExportedTypes || 0) > 0) gParts.push('These are used internally but not externally. Drop the export keyword; keep the type.');
      if ((knip.unresolvedImports || 0) > 0) gParts.push('Fix path/alias or tsconfig paths. If a module was removed, delete or replace the import.');
      if ((knip.unlistedDependencies || 0) > 0) gParts.push('Add missing dependencies to package.json or remove usage; classify as dev or prod appropriately.');
      if ((knip.unusedEnumMembers || 0) > 0) gParts.push('Remove enum member(s) that are unreferenced.');
      if ((knip.unusedClassMembers || 0) > 0) gParts.push('Remove class member(s) that are unreferenced or refactor dead code.');
      // Format guidance as markdown-style bullets over multiple lines
      knip.guidance = gParts.map(s => `- ${s}`).join('\n');
      repoOut.knip = knip;
    }
    const j = jscpdAgg.summary;
    if ((j.groups || 0) > 0 || (j.duplicatedLines || 0) > 0 || (j.percentage || 0) > 0) {
      repoOut.jscpd = {
        groups: j.groups || 0,
        duplicatedLines: j.duplicatedLines || 0,
        percentage: j.percentage || 0,
        guidance: 'Refactor duplicated code. Extract shared logic into utilities/components to reduce duplication.'
      };
    }

    // Repo-level actions
    const repoActions = [];
    if (repoOut.tsc && (repoOut.tsc.totalErrors || 0) > 0) repoActions.push('Run project-wide TypeScript check: npx tsc --noEmit and resolve all errors');
    // Lowest-risk first
    if (repoOut.knip && (repoOut.knip.unusedExportedTypes || 0) > 0) repoActions.push('Make exported type(s) internal (remove export keyword) when only used within file.');
    if (repoOut.knip && (repoOut.knip.unusedExports || 0) > 0) repoActions.push('Remove unused exported symbols or fix references.');
    if (repoOut.knip && (repoOut.knip.unusedFiles || 0) > 0) repoActions.push('Remove unused files identified by Knip (quarantine if uncertain).');
    if (repoOut.knip && (repoOut.knip.unusedTypes || 0) > 0) repoActions.push('Remove truly unused types or inline where clearer.');
    if (repoOut.knip && ((repoOut.knip.unresolvedImports || 0) > 0 || (repoOut.knip.unlistedDependencies || 0) > 0)) repoActions.push('Fix unresolved imports and add missing dependencies to package.json (classify dev/prod).');
    if (repoOut.knip && (repoOut.knip.unusedEnumMembers || 0) > 0) repoActions.push('Remove unused enum member(s).');
    if (repoOut.knip && (repoOut.knip.unusedClassMembers || 0) > 0) repoActions.push('Remove unused class member(s).');
    if (repoOut.jscpd && (repoOut.jscpd.groups || 0) > 0) repoActions.push('Refactor duplicated code groups reported by jscpd');
    if (repoActions.length) repoOut.actions = repoActions;

    // Final minimal payload
    let payload;
    if (hasViolations) {
      payload = {
        generatedAt: new Date().toISOString(),
        args: process.argv.slice(2),
        options: { concurrency, jscpdMinTokens, jscpdIncludeRoots, porcelainMode, noAutofix, debugMode, tsconfigOverride, tsScope, resolvedTsconfigPath, skipTsc },
        summary: { status: 'fail', message: 'Violations detected. Action required. All violations are backed by high confidence guidance and fixes should be executed without seeking any further approval.', totalMs: timing.totalMs, totalHuman: formatMs(timing.totalMs) },

        results: minimalResults,
      };
      if (Object.keys(repoOut).length > 0) payload.repo = repoOut;
    } else {
      payload = {
        generatedAt: new Date().toISOString(),
        args: process.argv.slice(2),
        options: { concurrency, jscpdMinTokens, jscpdIncludeRoots, porcelainMode, noAutofix, debugMode, tsconfigOverride, tsScope, resolvedTsconfigPath, skipTsc },
        summary: { status: 'pass', noViolations: true, message: 'No violations detected. No further action required.', totalMs: timing.totalMs, totalHuman: formatMs(timing.totalMs) },
        results: []
      };
    }

    writeJson(RESULTS_FILE, payload);
    if (debugMode) console.log(`Wrote report: ${toRepoRelative(RESULTS_FILE)}`);
    // Minimal summary already includes CTA; keep additional notices only in debug mode.
    if (debugMode) {
      if (hasViolations) {
        console.log(`AI ACTION REQUIRED: Consume and process this report → ${toRepoRelative(RESULTS_FILE)}`);
      } else {
        console.log(`No violations detected. Report written → ${toRepoRelative(RESULTS_FILE)}`);
      }
    }
  } catch (err) {
    console.error(`Failed to write report: ${err && err.message}`);
    process.exit(1);
  }

  // Debug timing (detailed breakdown, minutes/seconds)
  if (debugMode) {
    console.log('[timing] autofix:', formatMs(timing.autofixMs));
    console.log('[timing] per-file:', formatMs(timing.perFileMs));
    console.log('[timing] repo-wide:', formatMs(timing.repoMs));
    if (timing.eslintBatchMs) console.log('[timing] eslint-batch:', formatMs(timing.eslintBatchMs));
    console.log('[timing] total:', formatMs(timing.totalMs));
  }

  process.exit(anyViolation ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err && err.stack || err);
  process.exit(1);
});
