# React Testing

_Anti-patterns, dual fetching issues, and testing strategies for React effects._

<!-- AI_QUICK_REF
Overview: React anti-patterns and testing strategies for effect hooks
Key Rules: Avoid dual fetching, Use stable references, Test for infinite loops
Avoid: Dual fetching, Unstable references, Object/array literals in dependency arrays
-->

<!-- RELATED_DOCS
Core Patterns: react-loops.md (Effect loop prevention), react-fundamentals.md (Core hook patterns)
Performance: react-antipatterns.md (Performance anti-patterns), react-debugging.md (Debugging techniques)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config)
-->

## Executive Summary

This document covers specific anti-patterns that cause React effect loops and testing strategies to identify and prevent them. It focuses on dual fetching issues, unstable references, and practical testing approaches. All developers must understand these patterns to maintain optimal performance and prevent infinite loops.

## Specific Anti-Patterns to Avoid

### 1. Dual Fetching (⚠️ CRITICAL)

**Problem:** Fetching the same data in both component and context.

```jsx
// ❌ WRONG: Both context and component fetch user data
// In UserContext
useEffect(() => fetchUserData(userId), [userId])
// In UserProfile component
useEffect(() => fetchUserData(userId), [userId])

// ✅ CORRECT: Only context fetches data
// In UserContext
useEffect(() => fetchUserData(userId), [userId])
// In UserProfile component
const { user } = useUserContext() // Just consume data
```

### 2. Unstable References (⚠️ CRITICAL)

**Problem:** Object/array literals in dependency arrays.

```jsx
// ❌ WRONG: New object/function in dependency array
useEffect(() => doSomething(), [{ id: userId }]) // New object every render
useEffect(() => fetchData(), [() => formatData(data)]) // New function every render
function MyComponent({ initialData = [] }) {
  useEffect(() => processData(initialData), [initialData]) // New array reference!
}

// ✅ CORRECT: Use primitive values, memoized objects, or stable constants
useEffect(() => doSomething(), [userId]) // Stable primitive value
const formatDataFn = useCallback(() => formatData(data), [data])
useEffect(() => fetchData(), [formatDataFn]) // Stable function reference
const EMPTY_ARRAY = []
function MyComponent({ initialData = EMPTY_ARRAY }) {
  useEffect(() => processData(initialData), [initialData]) // Stable reference
}
```

## Testing for Infinite Loops

1. **Monitor network traffic** for repeated API calls
2. Add **console.log statements** in useEffect to check execution frequency
3. Use **React DevTools Profiler** to identify excessive re-renders
4. Implement **error boundaries** that catch render limits

## Common Effect Loop Patterns to Watch For

1. useEffect → setState → trigger useEffect (infinite loop)
2. useEffect with function dependency not wrapped in useCallback
3. Context value changing causing subscriber effects to re-run
4. Derived state calculated in useEffect instead of useMemo
5. Object/array dependencies changing every render
