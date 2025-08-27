 const { execSync, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const { ROOT_DIR } = require('../utils/paths');

function runEslint(filePath) {
  try {
    const reviewDir = path.join(ROOT_DIR, '.windsurf', 'review');
    const configPath = path.join(reviewDir, '.eslintrc.review.cjs');
    const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
    const cmd = `npx --prefix ${q(reviewDir)} eslint --config ${q(configPath)} --resolve-plugins-relative-to ${q(reviewDir)} --cache --cache-location ${q(path.join(reviewDir, '.eslintcache'))} --max-warnings=0 --no-ignore ${q(filePath)}`;
    execSync(cmd, { stdio: 'pipe', cwd: ROOT_DIR });
    return { errors: [], warnings: [] };
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errors = [];
    const warnings = [];

    output.split('\n').forEach(line => {
      if (line.includes('File ignored because of a matching ignore pattern')) {
        return;
      }
      if (line.includes('error')) {
        // Try to capture: "line:col  error  message  rule"
        let match = line.match(/(\d+):(\d+)\s+error\s+(.+?)(?:\s{2,}([@\w-\/]+))?\s*$/);
        if (match) {
          errors.push({ line: parseInt(match[1]), column: parseInt(match[2]), message: match[3].trim(), rule: match[4] || null });
        }
      } else if (line.includes('warning')) {
        let match = line.match(/(\d+):(\d+)\s+warning\s+(.+?)(?:\s{2,}([@\w-\/]+))?\s*$/);
        if (match) {
          warnings.push({ line: parseInt(match[1]), column: parseInt(match[2]), message: match[3].trim(), rule: match[4] || null });
        }
      }
    });

    return { errors, warnings };
  }
}

// Run ESLint once for all files and return a map of absolutePath -> { errors, warnings }
async function runEslintBatch(filePaths) {
  const resultMap = {};
  try {
    const files = Array.isArray(filePaths) ? filePaths.filter(Boolean) : [];
    if (files.length === 0) return resultMap;
    // Pre-populate map with empty results to avoid per-file fallback when batch output has no findings
    const normalized = files.map(fp => path.resolve(fp));
    for (const abs of normalized) {
      resultMap[abs] = { errors: [], warnings: [] };
    }
    const reviewDir = path.join(ROOT_DIR, '.windsurf', 'review');
    const configPath = path.join(reviewDir, '.eslintrc.review.cjs');
    const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
    const quoted = files.map(fp => q(fp)).join(' ');
    const cmd = `npx --prefix ${q(reviewDir)} eslint --format json --no-ignore --max-warnings=0 --cache --cache-location ${q(path.join(reviewDir, '.eslintcache'))} --config ${q(configPath)} --resolve-plugins-relative-to ${q(reviewDir)} ${quoted}`;
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: ROOT_DIR, maxBuffer: 64 * 1024 * 1024 });
      const raw = String(stdout || stderr || '[]');
      let arr;
      try { arr = JSON.parse(raw); } catch { arr = []; }
      if (!Array.isArray(arr)) arr = [];
      for (const item of arr) {
        const key = path.resolve(item.filePath || '');
        const errors = [];
        const warnings = [];
        const msgs = Array.isArray(item.messages) ? item.messages : [];
        for (const m of msgs) {
          const entry = {
            line: m.line || 0,
            column: m.column || 0,
            endLine: m.endLine || undefined,
            endColumn: m.endColumn || undefined,
            message: (m.message || '').trim(),
            rule: m.ruleId || null,
            fixable: !!m.fix
          };
          if (m.severity === 2) errors.push(entry); else if (m.severity === 1) warnings.push(entry);
        }
        resultMap[key] = { errors, warnings };
      }
    } catch (err) {
      const raw = String((err && (err.stdout?.toString() || err.stderr?.toString())) || '[]');
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            const key = path.resolve(item.filePath || '');
            const errors = [];
            const warnings = [];
            const msgs = Array.isArray(item.messages) ? item.messages : [];
            for (const m of msgs) {
              const entry = {
                line: m.line || 0,
                column: m.column || 0,
                endLine: m.endLine || undefined,
                endColumn: m.endColumn || undefined,
                message: (m.message || '').trim(),
                rule: m.ruleId || null,
                fixable: !!m.fix
              };
              if (m.severity === 2) errors.push(entry); else if (m.severity === 1) warnings.push(entry);
            }
            resultMap[key] = { errors, warnings };
          }
        }
      } catch (_) {
        // If JSON parse fails, fall back to pre-populated empty results
      }
    }
  } catch (_) {}
  return resultMap;
}

module.exports = { runEslint, runEslintBatch };

