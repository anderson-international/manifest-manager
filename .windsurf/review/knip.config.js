module.exports = {
  entry: [
    // Next.js runtime roots (do NOT include entire repo here)
    'app/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'next-env.d.ts',
  ],

  project: [
    // Project-wide TypeScript with excludes
    '**/*.{ts,tsx}',

    // Excludes
    '!node_modules/**',
    '!.next/**',
    '!dist/**',
    '!build/**',
    '!test/**',
    '!.windsurf/**',
  ],

  // Include script-specific dependencies
  ignore: [
    // Intentionally left empty; prefer explicit scopes above
  ],

  // Include dependencies used by scripts
  ignoreDependencies: [
    // Intentionally left empty; prefer explicit scopes above
  ]
};
