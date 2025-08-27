# API Design

_Core API strategy and route patterns for the Specification Builder project._

<!-- AI_QUICK_REF
Overview: API design strategy - Next.js routes, RESTful CRUD, URL patterns, type safety
Key Rules: Next.js API routes, RESTful principles, Resource-based URLs, Type safety with TypeScript
Avoid: Complex API architectures, Inconsistent naming, Missing type safety, Non-RESTful patterns
-->

<!-- RELATED_DOCS
Core Patterns: api-errors.md (Error handling), api-validation.md (Input validation)
Implementation: api-shopify.md (External API integration), technical-stack.md (Technology stack)
-->

## Overview

This document provides strategic guidance for API design decisions and patterns. Focus is on simplicity and consistency. Designed for a solo hobbyist project with RESTful principles.

## API Strategy

**Core Approach**: Next.js API routes with RESTful patterns and consistent error handling.

### Route Philosophy

- **Next.js API Routes**: Leverage built-in API routing for backend functionality
- **RESTful Principles**: Follow standard REST patterns for CRUD operations
- **Simple Structure**: Avoid complex API architectures for solo development
- **Type Safety**: Integrate with TypeScript for request/response validation

### URL Patterns

- **Resource-Based**: Structure URLs around data resources (specifications, users, etc.)
- **Nested Resources**: Use logical nesting for related data relationships
- **Admin Routes**: Separate admin functionality with dedicated route prefixes
- **Consistent Naming**: Use clear, descriptive resource names

```typescript
// Example URL patterns
;/api/accefiiinopsst / // GET, POST
  api /
  specifications /
  [id] / // GET, PUT, DELETE
  api /
  specifications /
  [id] /
  notes / // GET, POST (nested resources)
  api /
  admin /
  products /
  sync // POST (admin functionality)
```

### HTTP Methods

- **GET**: Retrieve resources (safe, idempotent)
- **POST**: Create new resources
- **PUT**: Update existing resources (idempotent)
- **DELETE**: Remove resources (idempotent)
- **PATCH**: Partial updates (when needed)

### Response Structure

- **Consistent Format**: Use canonical response formats defined in `api-errors.md`
- **Status Codes**: Appropriate HTTP status codes for different scenarios
- **Error Handling**: Follow error response patterns from `api-errors.md`
- **Metadata**: Include relevant metadata (pagination, timestamps)

### Route Implementation

- **Handler Functions**: Clean, focused route handler implementations
- **Middleware**: Use middleware for common functionality (auth, validation)
- **Type Safety**: TypeScript interfaces for request/response types
- **Error Boundaries**: Proper error handling in route handlers

```typescript
// Example route handler structure
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Specification[]>>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetSpecifications(req, res)
      case 'POST':
        return await handleCreateSpecification(req, res)
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
          data: [],
          timestamp: new Date().toISOString(),
        })
    }
  } catch (error) {
    return handleApiError(error, res)
  }
}
```

### Next.js 15 Route Parameters

- **API Routes**: `params: Promise<{id: string}>` + `await params`
- **Client Pages**: `params: Promise<{id: string}>` + `use(params)`

### Authentication Strategy

- **Session-Based**: Use Next.js built-in session handling
- **Route Protection**: Protect sensitive routes with authentication middleware
- **Permission Levels**: Implement role-based access control where needed
- **Token Management**: Secure token storage and validation

### API Documentation
- **Minimise comments**: Do not use JSDoc comments.
- **Self-Documenting**: Use TypeScript interfaces as documentation

By following these design principles, we ensure our API is consistent, maintainable, and scalable for the project's needs.
