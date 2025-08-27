# React Effect Loops

_Preventing infinite loops and performance issues in React effect hooks._

<!-- AI_QUICK_REF
Overview: Core patterns for preventing React effect infinite loops
Key Rules: useCallback for functions, useMemo for derived state, Include all dependencies
Avoid: Functions not wrapped in useCallback, Missing dependencies, Object/array literals in dependency arrays
-->

<!-- RELATED_DOCS
Core Patterns: react-fundamentals.md (Core hook patterns), react-debugging.md (Debugging techniques)
Performance: react-antipatterns.md (Performance anti-patterns), react-advanced.md (Advanced patterns)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config)
-->

## Executive Summary

This guide focuses specifically on preventing infinite loops in React effects. Advanced loop prevention patterns and dependency management techniques.

## Common Causes of React Effect Loops

| Priority        | Issue                 | Description                                                     |
| --------------- | --------------------- | --------------------------------------------------------------- |
| ⚠️ **CRITICAL** | Function dependencies | State setters or functions that aren't wrapped in `useCallback` |
| ⚠️ **CRITICAL** | Derived state         | Calculated values not wrapped in `useMemo`                      |
| 🔥 **HIGH**     | Object/array literals | New objects/arrays created on each render                       |
| 🔥 **HIGH**     | Context interactions  | Circular dependencies between contexts                          |
| ⚙️ **MEDIUM**   | Missing dependencies  | Not including all dependencies used in effect                   |

## Best Practices for Preventing Loops

### 1. Function Dependencies (⚠️ CRITICAL)

**Problem:** Functions created during render cause infinite loops when used in dependency arrays.

**Solution:** Always wrap functions in `useCallback` when used in dependency arrays.

**Critical Rule:** Only include dependencies used in ALL execution paths.

```jsx
// ❌ WRONG: onSelectionChange not used in multi-select path
const handleSelect = useCallback((item) => {
  if (mode === 'single') {
    onSelectionChange(item); // Used here
  } else {
    // onSelectionChange NOT used here
  }
}, [mode, onSelectionChange]); // Causes unnecessary re-renders

// ✅ CORRECT: Conditional dependencies
}, mode === 'single' ? [mode, onSelectionChange] : [mode]);
```

### 2. Derived State Dependencies (⚠️ CRITICAL)

**Problem:** Calculated values change identity on each render, triggering effects.

**Solution:** Memoize derived values with `useMemo`.

### 3. Context Interactions (🔥 HIGH)

**Problem:** Multiple contexts updating each other create circular dependencies.

```jsx
// ❌ WRONG: UserContext and DataContext update each other
// In UserContext
useEffect(() => {
  if (dataContext.data) {
    setUser(buildUserFromData(dataContext.data))
  }
}, [dataContext.data])

// In DataContext
useEffect(() => {
  if (userContext.user) {
    fetchDataForUser(userContext.user.id)
  }
}, [userContext.user])
```

**Solutions:**

- ✅ One context should own data fetching; others should only consume
- ✅ Establish clear hierarchies between contexts
- ✅ Avoid circular updates between contexts

```jsx
// ✅ CORRECT: Clear ownership - UserContext owns user data
// In UserContext (data owner)
useEffect(() => {
  fetchUser(userId)
  if (user) {
    fetchDataForUser(user.id)
  }
}, [userId, user])

// DataContext just consumes, doesn't fetch
```

### 4. Dependency Array Management (🔥 HIGH)

**Problem:** Incomplete or incorrect dependency arrays.

```jsx
// ❌ WRONG: Missing dependencies
useEffect(() => {
  const filtered = items.filter((item) => item.category === selectedCategory)
  setFilteredItems(filtered)
}, []) // Missing items and selectedCategory
```

**Solutions:**

- ✅ Include ALL dependencies used inside the effect
- ✅ Use the ESLint react-hooks/exhaustive-deps rule
- ✅ Prefer primitive values over objects in dependency arrays

```jsx
// ✅ CORRECT: All dependencies included
useEffect(() => {
  const filtered = items.filter((item) => item.category === selectedCategory)
  setFilteredItems(filtered)
}, [items, selectedCategory, setFilteredItems])
```
