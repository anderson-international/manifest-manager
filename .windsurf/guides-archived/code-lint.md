# Code Lint

_Troubleshooting guide for common linting errors and code quality issues._

<!-- AI_QUICK_REF
Overview: Troubleshooting common linting errors - TypeScript, React, and ESLint issues
Key Rules: Explicit return types, useCallback/useMemo, No 'any' type, Complete hook dependencies
Avoid: Missing return types, Console.log in production, Empty destructuring, Missing Next/Image
-->

<!-- RELATED_DOCS
Quality Standards: code-typescript.md (TypeScript rules), code-prettier.md (Formatting)
React Patterns: react-patterns.md (Hook patterns), react-fundamentals.md (Component patterns)
Project Structure: code-structure.md (Organization)
-->

## Overview

This guide addresses the most common linting errors encountered during development. Focus is on practical solutions for issues that break builds or cause runtime problems.

## Critical ESLint Rules

**Essential rules that prevent errors:**

- `@typescript-eslint/explicit-function-return-type` - All functions must have return types
- `@typescript-eslint/no-explicit-any` - Prevents 'any' type usage
- `react-hooks/exhaustive-deps` - Ensures complete hook dependencies
- `no-console` - Allows only console.warn/error in production

## Most Common Issues

### 1. Missing Return Types

**Problem:** TypeScript functions without explicit return types.

**Solutions:**

```typescript
// ❌ WRONG
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ CORRECT
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### 2. Using 'Any' Type

**Problem:** Using `any` type bypasses TypeScript's type checking.

**Solutions:**

```typescript
// ❌ WRONG
function processData(data: any): any {
  return data.someProperty
}

// ✅ CORRECT
interface DataType {
  someProperty: string
}
function processData(data: DataType): string {
  return data.someProperty
}
```

#### Junction Relation Access Patterns

**Problem:** Using `any` type when accessing Prisma junction relations.

**Root Cause:** Incorrectly accessing junction properties instead of using nested include structure.

**Critical Rule:** ALWAYS examine existing codebase patterns before creating types.

```typescript
// ❌ WRONG: Creating any types for non-existent properties
sources.flatMap(s => s.spec_junction_tasting_notes.map((tn: any) => tn.enum_tasting_note_id))

// ✅ CORRECT: Use proper nested include structure from existing patterns
sources.flatMap(s => s.spec_junction_tasting_notes?.map(tn => tn.spec_enum_tasting_notes.id) || [])
```

**How to Fix Junction `any` Types:**

1. **Find similar usage**: Search codebase for same junction table access
2. **Check include structure**: Review Prisma include configuration  
3. **Use existing pattern**: Copy the correct nested access pattern
4. **Never create new types**: Use established Prisma-generated types

**Common Junction Patterns:**

```typescript
// Tasting notes junction
specification.spec_junction_tasting_notes?.map(tn => tn.spec_enum_tasting_notes.id)

// Cures junction  
specification.spec_junction_cures?.map(c => c.spec_enum_cures.id)

// Tobacco types junction
specification.spec_junction_tobacco_types?.map(tt => tt.spec_enum_tobacco_types.id)
```

### 3. Unused Variables

**Problem:** Variables, imports, or parameters declared but never used.

**Solutions:**

- Remove unused imports
- Use underscore prefix: `catch (_err) { throw new Error() }`
- Remove unused parameters

```typescript
// ❌ WRONG
import { useState, useEffect, useMemo } from 'react' // Only useState used

// ✅ CORRECT
import { useState } from 'react'
```

### 4. Console Statements in Production

**Problem:** Console.log statements in production code.

**Solutions:**

```typescript
// ❌ WRONG
console.log('User data:', userData)

// ✅ CORRECT
console.warn('Validation warning:', errors)
console.error('API Error:', error)
```

### 5. No-Useless-Catch Errors

**Problem:** ESLint flags catch blocks as "useless" when they simply re-throw.

**Rule:** **NEVER DELETE** catch blocks - apply error composition instead.

**Solutions:**

```typescript
// ❌ WRONG: Useless catch
try {
  await riskyOperation()
} catch (error) {
  throw error // Flagged by ESLint
}

// ✅ CORRECT: Error composition by context
// Service layer
try {
  await riskyOperation()
} catch (error) {
  throw new Error(`Service operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
}

// API route
try {
  await riskyOperation()
} catch (error) {
  return handleApiError(error)
}

// Utility function
try {
  await riskyOperation()
} catch (error) {
  throw new Error(`Utility operation failed: ${error instanceof Error ? error.message : String(error)}`)
}
```

### 6. No-Console with Fail-Fast

**Problem:** `console.warn` statements mask data integrity violations.

**Rule:** Replace silent failures with explicit error throwing.

**Solutions:**

```typescript
// ❌ WRONG: Silent failure masks problems
try {
  const result = await fetchProducts()
  return result
} catch (error) {
  console.warn('Product lookup failed, continuing without data:', error)
  return []
}

// ✅ CORRECT: Fail-fast error composition
try {
  const result = await fetchProducts()
  return result
} catch (error) {
  throw new Error(`Product lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
```

**Exception:** Keep `console.error()` for actual logging before throwing:

```typescript
// ✅ ACCEPTABLE: Log then throw
try {
  return await operation()
} catch (error) {
  console.error('Critical operation failed:', error)
  throw error
}
```

## React Issues

### 1. Missing Hook Dependencies

**Problem:** Missing dependencies in hook arrays cause stale closures.

**Solutions:**

```typescript
// ❌ WRONG: Missing dependencies
const selectedOptions = useMemo(() => {
  return items.map((id) => availableTastingNotes.find((n) => n.id === id))
}, []) // Missing items, availableTastingNotes

// ✅ CORRECT: All dependencies included
const selectedOptions = useMemo(() => {
  return items.map((id) => availableTastingNotes.find((n) => n.id === id))
}, [items, availableTastingNotes])
```

### 2. Using HTML img Instead of Next/Image

**Problem:** Using HTML `<img>` instead of Next.js optimized `<Image>`.

**Solutions:**

```tsx
// ❌ WRONG
;<img src={product.image_url} alt={product.title} />

// ✅ CORRECT
import Image from 'next/image'
;<Image src={product.image_url} alt={product.title} width={80} height={80} />
```

### 3. Missing useCallback for Event Handlers

**Problem:** Event handlers not wrapped in useCallback cause unnecessary re-renders.

**Solutions:**

```typescript
// ❌ WRONG
const handleClick = () => {
  doSomething()
}

// ✅ CORRECT
const handleClick = useCallback(() => {
  doSomething()
}, [])
```

## Quick Fixes

**Most Common Commands:**

- `npm run lint` - Check for issues
- `npm run lint -- --fix` - Auto-fix simple issues
- Add explicit return types to all functions
- Import `Image` from 'next/image' instead of using `<img>`
