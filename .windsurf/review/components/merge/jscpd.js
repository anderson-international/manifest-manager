const { toRepoRelative } = require('../utils/paths');

function applyJscpdToResults(results, jscpdData) {
  const segmentsByFile = new Map();
  const dups = Array.isArray(jscpdData?.duplicates) ? jscpdData.duplicates : [];

  function pushSegment(fileRel, seg) {
    if (!segmentsByFile.has(fileRel)) segmentsByFile.set(fileRel, []);
    segmentsByFile.get(fileRel).push(seg);
  }

  for (const dup of dups) {
    const first = dup.firstFile || {};
    const second = dup.secondFile || {};
    const firstRel = toRepoRelative(first.name || '');
    const secondRel = toRepoRelative(second.name || '');
    const lines = typeof dup.lines === 'number' ? dup.lines : (first.end - first.start + 1 || 0);
    const tokens = typeof dup.tokens === 'number' ? dup.tokens : 0;

    pushSegment(firstRel, {
      otherFile: secondRel,
      lines,
      tokens,
      startLine: first.start,
      endLine: first.end,
      otherStartLine: second.start,
      otherEndLine: second.end
    });

    pushSegment(secondRel, {
      otherFile: firstRel,
      lines,
      tokens,
      startLine: second.start,
      endLine: second.end,
      otherStartLine: first.start,
      otherEndLine: first.end
    });
  }

  for (const r of results) {
    const key = toRepoRelative(r.filePath);
    const segs = segmentsByFile.get(key) || [];
    r.duplicates = {
      count: segs.length,
      segments: segs,
      status: segs.length > 0 ? 'FAIL' : 'PASS',
      recommendations: segs.length > 0 ? ['Extract shared logic into a utility/component to remove duplication.'] : []
    };
  }

  const totalStats = (jscpdData && (jscpdData.statistics?.total || jscpdData.statistic?.total)) || {};
  const summary = {
    groups: totalStats.clones || 0,
    duplicatedLines: totalStats.duplicatedLines || 0,
    percentage: totalStats.percentage || 0
  };
  return { summary };
}

module.exports = { applyJscpdToResults };
