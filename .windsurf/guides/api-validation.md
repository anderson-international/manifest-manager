# API Validation

_Schema-based validation strategy and performance guidelines for API endpoints._

<!-- AI_QUICK_REF
Overview: Input/output validation, schema validation, performance optimization for API routes
Key Rules: Schema validation, Type safety, Early validation, Lightweight routes, Efficient queries
Avoid: Missing validation, Inconsistent response formats, Large response payloads, Null handling gaps
-->

<!-- RELATED_DOCS
Core Patterns: api-errors.md (Error handling), api-design.md (API strategy)
Implementation: api-shopify.md (External API validation), code-typescript.md (Type safety)
-->

## Validation Strategy

**Approach**: Schema-based validation with explicit error messages.

### Input Validation

- **Schema Validation**: Use validation libraries for request body validation
- **Type Checking**: Leverage TypeScript for compile-time validation
- **Sanitization**: Clean and validate user input before processing
- **Early Validation**: Validate requests at the route entry point

```typescript
interface ValidationSchema {
  body?: Record<string, any>
  query?: Record<string, any>
  params?: Record<string, any>
}
```

### Response Validation

- **Consistent Structure**: Use canonical response formats from `api-errors.md`
- **Type Safety**: Ensure response types match expected client contracts
- **Data Transformation**: Convert database results to API response format
- **Null Handling**: Explicit handling of missing or null data

### Validation Implementation

- **Request Validation**: Validate incoming requests before processing
- **Response Validation**: Ensure outgoing responses match expected schema
- **Error Handling**: Use `ValidationResponse` format from `api-errors.md` for 422 status
- **Type Guards**: Use TypeScript type guards for runtime validation

```typescript
function validateRequest<T>(schema: ValidationSchema, data: any): T {
  const errors: ValidationError[] = []

  // Validate each field against schema
  Object.keys(schema).forEach((key) => {
    if (!isValid(data[key], schema[key])) {
      errors.push({
        field: key,
        message: `Invalid ${key}`,
        code: 'VALIDATION_ERROR',
      })
    }
  })

  if (errors.length > 0) {
    throw new ValidationException(errors)
  }

  return data as T
}
```

## Performance Guidelines

### Route Optimization

- **Lightweight Routes**: Keep API route handlers simple and focused
- **Database Efficiency**: Use efficient database queries and connection patterns
- **Caching Strategy**: Implement caching where appropriate for read-heavy operations
- **Response Size**: Return only necessary data in API responses

### Database Performance

- **Query Optimization**: Use Prisma select/include for efficient data fetching
- **Connection Pooling**: Leverage Prisma's built-in connection pooling
- **Index Strategy**: Index frequently queried fields
- **Pagination**: Implement cursor-based pagination for large datasets

```typescript
// Efficient query pattern
const specifications = await prisma.specification.findMany({
  select: {
    id: true,
    name: true,
    product: {
      select: { name: true, shopify_handle: true },
    },
  },
  take: 20,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { created_at: 'desc' },
})
```

### Response Optimization

- **Data Transformation**: Transform data efficiently before response
- **Compression**: Use gzip compression for large responses
- **Field Selection**: Allow clients to specify required fields
- **Batch Operations**: Support batch requests where appropriate

```typescript
interface QueryOptions {
  select?: string[]
  include?: string[]
  limit?: number
  offset?: number
}

function transformResponse(data: any, options: QueryOptions) {
  if (options.select) {
    return pick(data, options.select)
  }
  return data
}
```

By validating both input and output data, we can ensure our API is robust and provides accurate results while maintaining optimal performance.
