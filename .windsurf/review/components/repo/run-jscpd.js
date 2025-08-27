const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { ROOT_DIR, TMP_JSCPD_DIR } = require('../utils/paths');

async function runJscpd(apiOpts = {}) {
  const tmpDir = TMP_JSCPD_DIR;
  try {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  } catch (_) {}

  const tmpScript = path.join(tmpDir, 'inline-jscpd.js');
  const reviewDir = path.join(ROOT_DIR, '.windsurf', 'review');
  const includeRoots = Array.isArray(apiOpts.includeRoots) && apiOpts.includeRoots.length > 0
    ? apiOpts.includeRoots
    : ["app", "components", "lib", "hooks", "types"]; // default project roots only
  const minTokens = typeof apiOpts.minTokens === 'number' && !Number.isNaN(apiOpts.minTokens)
    ? apiOpts.minTokens
    : 50; // default threshold
  const scriptSource = [
    "const path = require('path');",
    "const { createRequire } = require('module');",
    `const reviewDir = ${JSON.stringify(reviewDir)};`,
    "const reviewRequire = createRequire(path.join(reviewDir, 'package.json'));",
    "const { detectClones } = reviewRequire('jscpd');",
    '(async () => {',
    `  const includeRoots = ${JSON.stringify(includeRoots)};`,
    `  const minTokens = ${JSON.stringify(minTokens)};`,
    '  const opts = {',
    '    path: includeRoots && includeRoots.length ? includeRoots : ["." ],',
    '    pattern: "**/*.{ts,tsx,js}",',
    '    format: "typescript,tsx,javascript",',
    '    ignore: ["**/{.next,node_modules,dist,build}/**"],',
    '    minTokens: minTokens,',
    '    absolute: true,',
    '    gitignore: false,',
    '    silent: true,',
    '    reporters: ["silent"]',
    '  };',
    "  const files = reviewRequire('@jscpd/finder').getFilesToDetect(opts);",
    '  const debug = { filesCount: Array.isArray(files) ? files.length : 0, samplePaths: (Array.isArray(files) ? files.slice(0,5).map(f => f.path) : []), includeRoots, minTokens };',
    '  const hc = { log: console.log, info: console.info, warn: console.warn };',
    '  let clones;',
    '  try {',
    '    console.log = () => {};',
    '    console.info = () => {};',
    '    console.warn = () => {};',
    '    clones = await detectClones(opts);',
    '  } finally {',
    '    console.log = hc.log;',
    '    console.info = hc.info;',
    '    console.warn = hc.warn;',
    '  }',
    '  debug.clonesShape = { isArray: Array.isArray(clones), type: typeof clones, keys: clones && Object.keys(clones) };',
    '  const safeNum = (v) => typeof v === "number" ? v : 0;',
    '  const raw = Array.isArray(clones) ? clones : ((clones && (clones.clones || clones.duplicates)) || []);',
    '  const dups = (Array.isArray(raw) ? raw : []).map(c => {',
    '    const a = c.duplicationA || {};',
    '    const b = c.duplicationB || {};',
    '    const aStart = a.start || {};',
    '    const aEnd = a.end || {};',
    '    const bStart = b.start || {};',
    '    const bEnd = b.end || {};',
    '    const lines = safeNum((safeNum(aEnd.line) - safeNum(aStart.line)) + 1);',
    '    return {',
    '      firstFile: { name: a.sourceId || "", start: safeNum(aStart.line), end: safeNum(aEnd.line) },',
    '      secondFile: { name: b.sourceId || "", start: safeNum(bStart.line), end: safeNum(bEnd.line) },',
    '      lines,',
    '      tokens: 0',
    '    };',
    '  }).filter(d => d.firstFile.name && d.secondFile.name && d.lines > 0);',
    '  const stats = {',
    '    total: {',
    '      clones: dups.length,',
    '      duplicatedLines: dups.reduce((a, c) => a + (c.lines || 0), 0),',
    '      percentage: 0',
    '    }',
    '  };',
    '  const result = { duplicates: dups, statistics: stats, debug };',
    '  console.log(JSON.stringify(result));',
    '})().catch(err => {',
    '  console.error(JSON.stringify({ error: String(err && err.message || err) }));',
    '  process.exit(1);',
    '});'
  ].join('\n');

  try {
    fs.writeFileSync(tmpScript, scriptSource, 'utf8');
    const { stdout, stderr } = await execAsync(`node "${tmpScript}"`, { cwd: ROOT_DIR, maxBuffer: 64 * 1024 * 1024 });
    const out = String(stdout || stderr || '');
    try {
      return JSON.parse(out);
    } catch (parseErr) {
      return { error: `Failed to parse jscpd API output: ${parseErr.message}`, raw: out };
    }
  } catch (error) {
    const raw = error && (error.stdout?.toString() || error.stderr?.toString()) || '';
    try {
      return JSON.parse(raw);
    } catch (_) {
      return { error: `Failed to run jscpd API: ${error.message}`, raw };
    }
  } finally {
    try { if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript); } catch (_) {}
  }
}

module.exports = { runJscpd };
