# React Core Patterns

_Fundamental React patterns and component architecture for the spec Builder._

<!-- AI_QUICK_REF
Overview: Core React component patterns and architecture fundamentals
Key Rules: React.memo for components, Component organization, Container/Presentation patterns
Avoid: Missing React.memo, Large component files, Mixed concerns
-->

<!-- RELATED_DOCS
Core Patterns: react-hooks.md (Hook patterns and state management), react-components.md (Server vs Client components)
Quality Rules: code-eslint.md (TypeScript return types and ESLint rules)
Form Integration: form-validation.md (React Hook Form patterns and database integration)
UI Architecture: design-patterns-ui-ux.md (Component styling), react-patterns-ui-ux.md (Component architecture)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config), api-core.md (API integration), api-patterns-auth.md (Authentication)
-->

## Executive Summary

This document defines React component architecture patterns: composition, organization, and structural guidelines. Component design patterns and architectural principles.

## Key Principles

1. **Component Organization**: Keep components under 150 lines. Extract logic to custom hooks.

2. **Single Source of Truth**: Avoid duplicate data fetching. Centralize data access.

3. **Strategic Memoization**: Apply React.memo to components that render frequently.

4. **Container/Presentation Pattern**: Separate data from rendering.

## Component Architecture Patterns

````

## File Size Integration
When components reach 150 lines, apply these patterns:

- Extract logic to custom hooks
- Keep component focused on rendering
- Use container/presentation pattern

```typescript
// Container (manages state and data)
const ProductsContainer = (): JSX.Element => {
  const { products, loading, error } = useProducts();
  return <ProductsList products={products} loading={loading} error={error} />;
};

// Presentation (pure rendering)
const ProductsList = React.memo(({ products, loading, error }: ProductsListProps): JSX.Element => {
  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return (
    <div className="products-list">
      {products.map(product => <ProductCard key={product.id} product={product} />)}
    </div>
  );
});
````

## Component Structure Standards

### ✅ Correct: Props Interface

```typescript
// ✅ Explicit TypeScript interfaces
interface ProductCardProps { product: Product; onSelect: (id: string) => void; className?: string; }

// ✅ Explicit return types
const ProductCard = ({ product, onSelect, className }: ProductCardProps): JSX.Element => (
  <div className={`product-card ${className || ''}`}>
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    <button onClick={() => onSelect(product.id)}>Select Product</button>
  </div>
);

// ✅ Named export with React.memo
export const ProductCard = React.memo(ProductCardComponent);
```

### Composition Patterns

```typescript
// ✅ Composition over inheritance
const CardLayout = ({ children, className }: LayoutProps): JSX.Element => (
  <div className={`card ${className || ''}`}>{children}</div>
);

const ProductCard = ({ product }: ProductCardProps): JSX.Element => (
  <CardLayout className="product-card">
    <h3>{product.name}</h3>
    <p>{product.description}</p>
  </CardLayout>
);
```

## Architecture Guidelines

### Single Responsibility Principle

1. **Props Interface**: Define TypeScript interfaces
2. **Single Purpose**: One responsibility per component
3. **Clear Naming**: Use descriptive names
4. **Separation of Concerns**: Separate data from rendering
