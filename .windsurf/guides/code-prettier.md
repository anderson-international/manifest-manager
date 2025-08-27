# Code Prettier

_Prettier formatting standards for consistent code formatting._

<!-- AI_QUICK_REF
Overview: Prettier configuration and formatting standards
Key Rules: Single quotes, Semicolons, 2-space indentation, Trailing commas
Avoid: Inconsistent formatting, Mixed quote styles, Varying indentation
-->

<!-- RELATED_DOCS
Quality Standards: code-eslint.md (ESLint rules), code-typescript.md (Type safety), code-structure.md (Project structure)
React Patterns: react-patterns.md (Component patterns), react-fundamentals.md (Hook patterns)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config)
-->

## Executive Summary

This document defines mandatory Prettier configuration for consistent code formatting across the project. Prettier handles all formatting concerns automatically, ensuring consistent code style regardless of individual developer preferences. The configuration covers quote styles, semicolons, indentation, line breaks, and other formatting rules. All code must be formatted with Prettier before commit.

## Key Principles

1. **Consistent Formatting**: All code follows identical formatting rules
2. **Automated Enforcement**: Prettier runs automatically in development and CI/CD
3. **Zero Configuration Conflicts**: Prettier integrates seamlessly with ESLint
4. **Team Consistency**: Individual formatting preferences are overridden
5. **Readable Code**: Formatting optimizes for readability and maintainability

## Prettier Configuration

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "arrowParens": "avoid",
  "printWidth": 100,
  "endOfLine": "lf",
  "jsxSingleQuote": true,
  "quoteProps": "as-needed",
  "bracketSameLine": false,
  "embeddedLanguageFormatting": "auto"
}
```

## Configuration Rules Explained

### Quote Styles

- **`singleQuote: true`**: Use single quotes for strings
- **`jsxSingleQuote: true`**: Use single quotes in JSX attributes
- **`quoteProps: "as-needed"`**: Quote object properties only when needed

### Semicolons and Punctuation

- **`semi: true`**: Always include semicolons
- **`trailingComma: "es5"`**: Trailing commas where ES5 allows

### Indentation and Spacing

- **`tabWidth: 2`**: 2 spaces per indentation level
- **`useTabs: false`**: Use spaces instead of tabs
- **`bracketSpacing: true`**: Spaces inside object brackets

### Line Handling

- **`printWidth: 100`**: Maximum line length of 100 characters
- **`endOfLine: "lf"`**: Unix-style line endings
- **`arrowParens: "avoid"`**: Avoid parentheses around single arrow function parameters

### JSX Formatting

- **`jsxBracketSameLine: false`**: JSX closing brackets on new line
- **`bracketSameLine: false`**: Consistent with jsxBracketSameLine

## Integration with Development Tools

### VSCode Integration

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.requireConfig": true,
  "prettier.useEditorConfig": false
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:staged": "prettier --write --staged"
  }
}
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit
npx lint-staged
```

With lint-staged configuration:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,css,scss,md}": ["prettier --write", "git add"]
  }
}
```

## Formatting Examples

### ✅ Correct Formatting

```typescript
// Single quotes, semicolons, proper spacing
const userConfig = {
  name: 'John Doe',
  email: 'john@example.com',
  settings: {
    theme: 'dark',
    notifications: true,
  },
};

// Proper JSX formatting
const UserProfile = ({ user, onEdit }: UserProfileProps): JSX.Element => {
  return (
    <div className='user-profile'>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={onEdit}>Edit Profile</button>
    </div>
  );
};

// Arrow function parameter formatting
const processData = data => data.map(item => item.value);
const processTwoParams = (data, config) => transform(data, config);
```

### ❌ Incorrect Formatting (Before Prettier)

```typescript
// Mixed quotes, inconsistent spacing
const userConfig = {
  name: "John Doe",
  email: 'john@example.com',
  settings: {
    theme: "dark",
    notifications: true
  }
};

// Poor JSX formatting
const UserProfile = ({ user, onEdit }: UserProfileProps): JSX.Element => {
  return (<div className="user-profile">
    <h2>{user.name}</h2>
    <p>{user.email}</p>
    <button onClick={onEdit}>Edit Profile</button></div>);
};

// Inconsistent arrow function formatting
const processData = (data) => data.map((item) => item.value);
const processTwoParams = (data,config) => transform(data,config);
```

## File Type Coverage

Prettier formats these file types:

- **TypeScript**: `.ts`, `.tsx`
- **JavaScript**: `.js`, `.jsx`
- **JSON**: `.json`
- **CSS/SCSS**: `.css`, `.scss`
- **Markdown**: `.md`
- **HTML**: `.html`
- **YAML**: `.yml`, `.yaml`

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
```

### Build Process

Prettier runs automatically during:

- **Development**: Format on save in VSCode
- **Pre-commit**: Format staged files before commit
- **CI/CD**: Verify formatting in build pipeline
- **Manual**: `npm run format` command

## Common Formatting Issues

### Long Lines

```typescript
// ❌ WRONG: Long line (over 100 characters)
const veryLongFunctionName = (parameterOne: string, parameterTwo: number, parameterThree: boolean, parameterFour: object) => {

// ✅ CORRECT: Properly broken line
const veryLongFunctionName = (
  parameterOne: string,
  parameterTwo: number,
  parameterThree: boolean,
  parameterFour: object
) => {
```

### Object Formatting

```typescript
// ✅ CORRECT: Consistent object formatting
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
  },
}
```

### Array Formatting

```typescript
// ✅ CORRECT: Proper array formatting
const colors = ['red', 'green', 'blue', 'yellow']

const complexArray = [
  { id: 1, name: 'Item 1', active: true },
  { id: 2, name: 'Item 2', active: false },
  { id: 3, name: 'Item 3', active: true },
]
```
