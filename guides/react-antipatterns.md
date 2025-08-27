# React Performance Patterns

_Performance optimization patterns and anti-patterns for the Specification Builder._

<!-- AI_QUICK_REF
Overview: React performance patterns and mandatory requirements
Key Rules: Context optimization, Performance validation, Anti-pattern detection
Avoid: Dual fetching, Missing context memoization, Unstable dependencies causing loops
-->

<!-- RELATED_DOCS
Core Patterns: react-core.md (Component architecture and React.memo patterns), react-hooks.md (Hook patterns and state management)
Loop Prevention: react-loops.md (Preventing infinite loops in useEffect)
Debugging: react-debugging.md (Dependency management and debugging techniques)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Technical Foundation: technical-stack.md (Next.js 15, React 18, and CSS Modules config)
-->

## Executive Summary

This document defines React performance anti-patterns and optimization requirements. Context optimization, performance validation, and identifying specific patterns that cause performance issues.

## ⚠️ **CRITICAL**: Specific Anti-Patterns to Avoid

### ⚠️ **CRITICAL**: Effect Loop Anti-Patterns

- **⚠️ CRITICAL: Dual Fetching**: Don't fetch the same data from both component and context
- **⚠️ CRITICAL: Unstable Dependencies**: Avoid functions that return new objects/arrays in dependency arrays
- **🔥 HIGH: Cross-Context Updates**: One context update should not trigger another context cyclically
- **🔥 HIGH: Ignored Dependency Warnings**: Always address React Hook dependency warnings

### 🔥 **HIGH**: Performance Anti-Patterns

- **🔥 HIGH: Missing useCallback**: Event handlers not wrapped in useCallback
- **🔥 HIGH: Missing useMemo**: Derived state computed on every render
- **🔥 HIGH: Unnecessary Re-renders**: Components not memoized when receiving stable props
- **⚠️ CRITICAL: Large Component Files**: Components exceeding 150 lines without splitting

## 🔥 **HIGH**: Mandatory Performance Requirements

**All components must use React.memo, all handlers must use useCallback, and all derived state must use useMemo.**

### 🔥 **CRITICAL**: Performance Validation Checklist

- ✅ React.memo applied to all components
- ✅ useCallback applied to all event handlers
- ✅ useMemo applied to all derived state
- ✅ Context providers properly optimized

## Context Provider Optimization

### ✅ Correct: Optimized Context Provider

```typescript
import { createContext, useContext, useState, useMemo, useCallback } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ✅ Stable callback that won't change between renders
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // ✅ Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return { isDarkMode, toggleTheme };
  }, [isDarkMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### ❌ Incorrect: Inefficient Context Implementation

```typescript
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ❌ BAD: Function recreated on every render
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // ❌ BAD: Object created inline without memoization
  // This causes all consumers to re-render on EVERY render of the provider
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## Server vs Client Component Optimization

### ✅ Correct: Proper Server/Client Component Separation

```typescript
// app/products/page.tsx - Server Component (no directive needed)
import ProductGrid from './ProductGrid';
import { getProducts } from '@/lib/data';

export default async function ProductsPage() {
  // Data fetching at the server level
  const products = await getProducts();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <ProductGrid initialProducts={products} />
    </div>
  );
}
```

```typescript
// app/products/ProductGrid.tsx - Client Component
'use client';
import { useState, useCallback, useMemo } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

type Props = {
  initialProducts: Product[];
};

export default function ProductGrid({ initialProducts }: Props): JSX.Element {
  const [filter, setFilter] = useState('');

  // ✅ useCallback for event handler
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  // ✅ useMemo for derived state
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p =>
      p.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [initialProducts, filter]);

  return (
    <div>
      <input
        type="text"
        placeholder="Filter products..."
        value={filter}
        onChange={handleFilterChange}
        className="p-2 border mb-4"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### ❌ Incorrect: Mixing Client/Server Concerns

```typescript
// ❌ BAD: Mixing client-side interactivity in what should be a server component
import { useState } from 'react';

export default async function ProductsPage() {
  const products = await fetch('/api/products').then(res => res.json());

  // ❌ Error: Using client hooks in a server component
  const [filter, setFilter] = useState('');

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {/* Rest of component */}
    </div>
  );
}
```
