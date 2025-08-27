# React Components

_Server vs Client component patterns and Next.js App Router architecture._

<!-- AI_QUICK_REF
Overview: Server vs Client component patterns, Next.js App Router architecture
Key Rules: Server components for data fetching, Client components for interactivity, TypeScript return types
Avoid: Mixing server/client concerns, Missing return types, Hooks in server components
-->

<!-- RELATED_DOCS
Core Patterns: react-patterns.md (Core React patterns and memo usage), react-hooks.md (Hook patterns and state management)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Form Integration: form-validation.md (React Hook Form patterns and database integration)
UI Architecture: design-patterns-ui-ux.md (Component styling), react-patterns-ui-ux.md (Component architecture)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config), api-core.md (API integration), api-patterns-auth.md (Authentication)
-->

## Executive Summary

This document defines server vs client component patterns for Next.js App Router architecture. It establishes critical separation between server-side data fetching and client-side interactivity, with mandatory TypeScript return types and proper component export patterns.

## ⚠️ **CRITICAL**: Server vs Client Components

### ✅ REQUIRED: Server Components - Data Fetching Patterns

```typescript
// ✅ Server Component (no directive needed)
// app/products/page.tsx
import ProductGrid from './ProductGrid';
import { getProducts } from '@/lib/data';

export default async function ProductsPage(): Promise<JSX.Element> {
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

### ✅ REQUIRED: Client Components - Interactive Patterns

```typescript
// ✅ Client Component - Required for hooks
// app/products/ProductGrid.tsx
'use client';
import { useState, useCallback, useMemo } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

type Props = {
  initialProducts: Product[];
};

export default function ProductGrid({ initialProducts }: Props): JSX.Element {
  const [filter, setFilter] = useState('');

  // ✅ useCallback and useMemo patterns
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  const filteredProducts = useMemo(() =>
    initialProducts.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [initialProducts, filter]
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Filter products..."
        value={filter}
        onChange={handleFilterChange}
        className="mb-4 p-2 border rounded"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### ❌ CRITICAL: Server Components - Forbidden Patterns

```typescript
// ❌ BAD: Cannot use hooks in server components
export default async function ProductsPage() {
  // ❌ Error: Hooks not allowed in server components
  const [state, setState] = useState(); // Hooks not allowed
  useEffect(() => {}, []); // Browser APIs not available

  return <div>Content</div>;
}
```

### ❌ CRITICAL: Mixing Client/Server Concerns

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

## 🔥 **HIGH**: TypeScript Requirements

**All components must have explicit TypeScript return types.**

## 🔥 **HIGH**: Server Actions Integration

### ✅ Correct: Form Actions with Server Components

```typescript
// Server Action
async function createSpecification(formData: FormData): Promise<void> {
  'use server';

  const data = {
    productId: formData.get('productId') as string,
    // ... other fields
  };

  await prisma.spec.create({ data });
  redirect('/specifications');
}

// In component
export default function CreateForm(): JSX.Element {
  return (
    <form action={createSpecification}>
      <input name="productId" />
      <button type="submit">Create</button>
    </form>
  );
}
```

## 🔥 **HIGH**: Export Patterns

### ✅ Correct: Component Export Standards

```typescript
// ✅ Correct: Named export with React.memo
export const ProductCard = React.memo(({ product }: ProductCardProps): JSX.Element => {
  return <div>{product.name}</div>;
});

// ✅ Correct: Default export for page components
export default function ProductsPage(): JSX.Element {
  return <div>Products</div>;
}
```

## Component Architecture Guidelines

### 🔥 **HIGH**: Separation of Concerns

1. **Server Components**: Use for data fetching, static rendering, and server-side logic
2. **Client Components**: Use for interactivity, hooks, and browser APIs
3. **Hybrid Architecture**: Pass data from server to client components via props
4. **Clear Boundaries**: Never mix server and client concerns in the same component
