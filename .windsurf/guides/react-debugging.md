# React Debugging

_Dependency management and debugging techniques_

<!-- AI_QUICK_REF
Overview: React debugging and dependency management techniques
Key Rules: Dependency array debugging, Effect management, Re-render tracking
Avoid: Unstable dependencies, Missing cleanup, Infinite loops
-->

<!-- RELATED_DOCS
Core Patterns: react-core.md (Component architecture and React.memo patterns), react-hooks.md (Hook patterns and state management)
Performance Patterns: react-performance-patterns.md (Anti-patterns and optimization requirements)
Loop Prevention: react-loops.md (Preventing infinite loops in useEffect)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Technical Foundation: technical-stack.md (Next.js 15, React 18, and CSS Modules config)
-->

## Executive Summary

This document defines React debugging techniques and dependency management patterns. It covers proper useEffect patterns, dependency array debugging, and component re-render tracking techniques. All developers must understand these patterns to debug performance issues and prevent infinite loops.

## useEffect Dependency Management

### ✅ Correct: Proper useEffect with Stable Dependencies

```typescript
import { useState, useEffect, useCallback } from 'react';

function DataFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Stable fetch function with useCallback
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      setData(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // Only depends on userId

  // ✅ Clean effect with proper dependencies
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      await fetchUserData();
      // Only update state if component is still mounted
      if (!isMounted) return;
    };

    loadData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [fetchUserData]); // Correctly depends on memoized fetch function

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : data ? (
        <UserProfile userData={data} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}
```

### ❌ Incorrect: Unstable Dependencies Causing Loops

```typescript
function DataFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // ❌ BAD: Creating function inside effect without cleanup
    const fetchData = async () => {
      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      setData(userData);
    };

    fetchData();

    // ❌ BAD: Missing cleanup for async operations
    // No cleanup function
  }, [userId]);

  // ❌ BAD: Object created inline in render
  const userConfig = { id: userId, timestamp: Date.now() };

  useEffect(() => {
    console.log('User config changed:', userConfig);
    // ❌ BAD: This will run on EVERY render because userConfig is a new object each time
  }, [userConfig]);

  return <div>{/* Component JSX */}</div>;
}
```

## Performance Debugging Techniques

### 🔥 **HIGH**: Component Re-render Debugging

```typescript
// Add this to components to debug re-renders
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
};

// Usage in component
const ProductCard = ({ product }: Props): JSX.Element => {
  const renderCount = useRenderCount('ProductCard');

  return <div>{product.name}</div>;
};
```

### 🔥 **HIGH**: Dependency Array Debugging

```typescript
const useDependencyDebug = (deps: any[], label: string) => {
  const prevDeps = useRef(deps)

  useEffect(() => {
    const changedDeps = deps
      .map((dep, index) => {
        if (prevDeps.current[index] !== dep) {
          return { index, prev: prevDeps.current[index], current: dep }
        }
        return null
      })
      .filter(Boolean)

    if (changedDeps.length > 0) {
      console.log(`${label} dependencies changed:`, changedDeps)
    }

    prevDeps.current = deps
  })
}

// Usage
useEffect(() => {
  // Effect logic
}, [userId, categoryId])

useDependencyDebug([userId, categoryId], 'DataFetcher')
```

### 🔥 **HIGH**: Effect Cleanup Patterns

```typescript
// ✅ Cleanup for subscriptions, intervals, and event listeners
useEffect(() => {
  const subscription = subscribeToUpdates(setLiveData)
  return () => subscription.unsubscribe()
}, [])

useEffect(() => {
  const interval = setInterval(() => setCurrentTime(new Date()), 1000)
  return () => clearInterval(interval)
}, [])

useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth)
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

## Common Debugging Scenarios

### 🔥 **HIGH**: Debugging Infinite Loops

```typescript
const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previous = useRef<Record<string, any>>()

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props })
      const changedProps: Record<string, any> = {}

      allKeys.forEach((key) => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = { from: previous.current![key], to: props[key] }
        }
      })

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps)
      }
    }

    previous.current = props
  })
}
```

### 🔥 **HIGH**: Memory Leak Detection

```typescript
// ✅ Pattern to detect memory leaks
const useMemoryLeakDetection = (componentName: string) => {
  const mounted = useRef(true)

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [componentName])

  const safeSetState = useCallback(
    (setter: () => void) => {
      if (mounted.current) {
        setter()
      } else {
        console.warn(`${componentName}: State update after unmount`)
      }
    },
    [componentName]
  )

  return safeSetState
}
```

## Essential Debugging Utilities

### 🔥 **HIGH**: Performance and State Tracking

```typescript
// ✅ Simple performance monitor
const usePerformanceMonitor = (name: string) => {
  const renderStart = useRef<number>()
  renderStart.current = performance.now()

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current!
    if (renderTime > 16) {
      console.warn(`${name} slow render: ${renderTime.toFixed(2)}ms`)
    }
  })
}

// ✅ State change logger
const useStateLogger = <T>(value: T, name: string) => {
  const prevValue = useRef<T>()

  useEffect(() => {
    if (prevValue.current !== value) {
      console.log(`${name}:`, { from: prevValue.current, to: value })
    }
    prevValue.current = value
  }, [value, name])
}
```
