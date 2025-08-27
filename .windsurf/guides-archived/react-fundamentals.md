# React Fundamentals

_Essential React patterns, hooks, and TypeScript requirements for the spec Builder._

<!-- AI_QUICK_REF
Overview: Core React patterns - hooks, TypeScript, component basics
Key Rules: useCallback for event handlers, useMemo for derived state, explicit return types, proper dependency arrays
Avoid: Missing useCallback/useMemo, Missing return types, Unstable dependencies, Functions in render
-->

<!-- RELATED_DOCS
Component Architecture: react-components.md (Server vs Client components), react-patterns.md (React.memo and composition)
Advanced Patterns: react-advanced.md (Custom hooks), react-loops.md (Loop prevention), react-debugging.md (Debugging techniques)
Performance: react-antipatterns.md (Performance anti-patterns), react-styling.md (UI patterns)
Testing: react-testing.md (Testing patterns)
-->

## Executive Summary

This document defines essential React patterns: hooks, TypeScript requirements, and component fundamentals. Critical patterns for preventing infinite loops, ensuring performance, and maintaining type safety.

## Key Principles

1. **Memoization First**: All event handlers must use useCallback and all computed values must use useMemo with appropriate dependency arrays to prevent unnecessary re-renders.

2. **Stable References**: Never create objects, arrays, or functions directly in render or dependency arrays; always memoize or extract them.

3. **Explicit Dependencies**: All hooks must have exhaustive, properly memoized dependency arrays with no unstable references.

4. **Effect Discipline**: Every useEffect must have a clearly defined purpose, proper cleanup, and carefully managed dependencies.

## ⚠️ **CRITICAL**: React Effect Loop Prevention

React useEffect hooks can cause infinite loops if not properly managed. These patterns are mandatory:

1. **⚠️ CRITICAL: Functions that update state must be wrapped in `useCallback`**
2. **⚠️ CRITICAL: Derived state must use `useMemo`**
3. **🔥 HIGH: Context interactions must have clear ownership**

### ⚠️ **CRITICAL**: useCallback Pattern (Required)

```typescript
// ✅ Correct: Stable event handler
const handleSubmit = useCallback((data: FormData): void => {
  setSubmitting(true)
}, [])

// ✅ Correct: Callback with dependencies
const handleFilterChange = useCallback(
  (categoryId: string): void => {
    setSelectedCategory(categoryId)
    onCategoryChange(categoryId)
  },
  [onCategoryChange]
)

// ❌ BLOCKS DEPLOYMENT: Creates new function on every render
const handleSubmit = (data: FormData): void => {
  setSubmitting(true)
}
```

### ⚠️ **CRITICAL**: useMemo Pattern (Required)

```typescript
// ✅ Correct: Memoized derived state
const filteredProducts = useMemo(
  () => products.filter((product) => product.brand === selectedBrand),
  [products, selectedBrand]
)

// ✅ Correct: Memoized complex calculations
const expensiveCalculation = useMemo(() => {
  return products.reduce((acc, product) => {
    return acc + product.price * product.quantity
  }, 0)
}, [products])

// ❌ BLOCKS DEPLOYMENT: Creates new array on every render
const filteredProducts = products.filter((product) => product.brand === selectedBrand)
```

### 🔥 **HIGH**: useEffect Pattern (Required)

```typescript
// ✅ Correct: Effect with proper dependencies
useEffect(() => {
  const fetchData = async (): Promise<void> => {
    const data = await getProducts(categoryId)
    setProducts(data)
  }

  fetchData()
}, [categoryId])

// ✅ Correct: Effect with cleanup
useEffect(() => {
  const subscription = subscribeToUpdates((data) => {
    setLiveData(data)
  })

  return () => {
    subscription.unsubscribe()
  }
}, [])

// ❌ BLOCKS DEPLOYMENT: Missing dependencies
useEffect(() => {
  fetchProducts(categoryId)
}, []) // Missing categoryId dependency
```

### 🔥 **HIGH**: Context Interaction Guidelines

- **Single Source of Truth**: One context should own data fetching
- **No Circular Dependencies**: Avoid circular dependencies between contexts
- **Clear Ownership**: Define which context is responsible for loading specific data
- **No Dual Fetching**: Never duplicate data fetching logic

## ⚠️ **CRITICAL**: Server vs Client Component Hook Usage

### ❌ CRITICAL: Server Components - Forbidden Patterns

```typescript
// ❌ BLOCKS DEPLOYMENT: NEVER in Server Components
'use client' // Don't add this to Server Components
const [state, setState] = useState() // Hooks not allowed
useEffect(() => {}, []) // Browser APIs not available
```

### ✅ REQUIRED: Client Components - Required Patterns

```typescript
'use client';
// ✅ Required for any component using hooks
export default function InteractiveComponent(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      const data = await getProducts();
      setProducts(data);
    };

    fetchProducts();
  }, []);

  return <div>{/* render products */}</div>;
}
```

## 🔥 **HIGH**: TypeScript Return Types (Required)

**All React components, hooks, and handlers must have explicit TypeScript return types.**

### ✅ Components Return Types

```typescript
// ✅ Correct: Component return types
const MyComponent = (props: Props): JSX.Element => {
  return <div>{props.children}</div>;
};

// ✅ Correct: Async component return types
const MyAsyncComponent = async (): Promise<JSX.Element> => {
  const data = await fetchData();
  return <div>{data}</div>;
};

// ❌ BLOCKS DEPLOYMENT: Missing return types
const MyComponent = (props: Props) => {
  return <div>{props.children}</div>;
};
```

### ✅ Custom Hook Return Types

```typescript
// ✅ Correct: Explicit return types for custom hooks
const useFormWizard = (
  initialData: FormData
): {
  currentStep: number
  formData: FormData
  nextStep: () => void
  prevStep: () => void
  updateFormData: (stepData: Partial<FormData>) => void
} => {
  // Hook implementation
}

// ✅ Correct: Generic hook return types
const useAsyncOperation = <T>(
  operation: () => Promise<T>
): {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => Promise<void>
} => {
  // Hook implementation
}

// ❌ BLOCKS DEPLOYMENT: Missing return types
const useFormWizard = (initialData: FormData) => {
  // Hook implementation
}
```

### ✅ Event Handler Return Types

```typescript
// ✅ Correct: Event handler return types
const handleSubmit = useCallback((data: FormData): void => {
  setSubmitting(true)
}, [])

const handleClick = useCallback(
  (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault()
    onClick()
  },
  [onClick]
)

// ❌ BLOCKS DEPLOYMENT: Missing return types
const handleSubmit = useCallback((data: FormData) => {
  setSubmitting(true)
}, [])
```
