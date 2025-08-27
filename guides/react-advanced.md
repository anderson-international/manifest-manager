# React Hooks Advanced

_Custom hook patterns and performance integration for the spec Builder._

<!-- AI_QUICK_REF
Overview: Custom hook patterns, data fetching hooks, and performance integration
Key Rules: Custom hooks for complex state logic, TypeScript return types, Component size integration
Avoid: Missing return types, Complex logic in components, Duplicate hook logic
-->

<!-- RELATED_DOCS
Core Hooks: react-hooks-core.md (Essential hook patterns and useCallback/useMemo)
Core Patterns: react-patterns.md (Component architecture and React.memo patterns), react-components.md (Server vs Client components)
Loop Prevention: react-prevent-effect-loops.md (Preventing infinite loops in useEffect)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Technical Foundation: technical-stack.md (Next.js 15, React 18, and CSS Modules config)
-->

## Executive Summary

This document defines advanced React hook patterns for custom hooks, data fetching patterns, and performance integration. Custom hooks extract complex state logic from components and maintain clean architecture.

## ⚙️ **MEDIUM**: Custom Hook Patterns

### ✅ Correct: Extract Complex State Logic

```typescript
// ✅ Extract complex state logic to custom hooks
const useFormWizard = (initialData: FormData) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(initialData)

  const nextStep = useCallback((): void => {
    setCurrentStep((prev) => prev + 1)
  }, [])

  const prevStep = useCallback((): void => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }, [])

  const updateFormData = useCallback((stepData: Partial<FormData>): void => {
    setFormData((prev) => ({ ...prev, ...stepData }))
  }, [])

  return { currentStep, formData, nextStep, prevStep, updateFormData }
}
```

### ✅ Correct: Data Fetching Hook

```typescript
const useProducts = (categoryId?: string) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const data = await getProducts(categoryId)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, refetch: fetchProducts }
}
```

## 🔥 **HIGH**: TypeScript Requirements

**All custom hooks must have explicit return types.**

## 🛠️ **REFACTOR**: Performance Integration

### ✅ Correct: File Size Integration

When components approach the **⚠️ CRITICAL: 150-line limit**, apply these patterns:

- Extract complex `useState` and `useEffect` logic to custom hooks
- Keep component focused on rendering and event handling
- Use container/presentation pattern to separate concerns

```typescript
// ✅ Extract logic to custom hook
const useProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const selectProduct = useCallback((product: Product): void => {
    setSelectedProduct(product);
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteProductById(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, selectedProduct, loading, selectProduct, deleteProduct };
};

// ✅ Clean component using custom hook
const ProductsContainer = (): JSX.Element => {
  const { products, selectedProduct, loading, selectProduct, deleteProduct } = useProductManagement();

  return (
    <ProductsList
      products={products}
      selectedProduct={selectedProduct}
      loading={loading}
      onSelect={selectProduct}
      onDelete={deleteProduct}
    />
  );
};
```

## 🔥 **HIGH**: Advanced Hook Patterns

### ✅ Correct: State Management Hook

```typescript
const useToggle = (
  initialValue: boolean = false
): [boolean, () => void, () => void, () => void] => {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue((prev) => !prev), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [value, toggle, setTrue, setFalse]
}
```

### ✅ Correct: Local Storage Hook

```typescript
const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value)
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error('Error setting localStorage value:', error)
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
```

### ✅ Correct: Async Operation Hook

```typescript
const useAsyncOperation = <T>(
  operation: () => Promise<T>
): {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => Promise<void>
} => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const result = await operation()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }, [operation])

  return { data, loading, error, execute }
}
```

## Component Architecture Integration

### 🔥 **HIGH**: Custom Hook Best Practices

1. **Single Responsibility**: Each custom hook should handle one specific concern
2. **Explicit Return Types**: Always define TypeScript return types
3. **Proper Dependencies**: Use useCallback and useMemo within custom hooks
4. **Error Handling**: Include proper error handling for async operations
5. **Testability**: Design hooks to be easily testable in isolation
