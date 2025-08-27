# API Errors

_Comprehensive error handling strategy combining retry mechanisms with fail-fast principles._

<!-- AI_QUICK_REF
Overview: Dual error handling strategy - retry for transient errors, fail-fast for client errors
Key Rules: Retry 5xx/429/timeouts, Fail-fast 4xx/auth/business logic, Exponential backoff, Circuit breaker
Avoid: Retrying 4xx errors, Silent error handling, Missing status codes, No retry limits
-->

<!-- RELATED_DOCS
Core Patterns: api-design.md (API strategy), api-shopify.md (Shopify error handling)
Implementation: api-validation.md (Input validation), technical-stack.md (Error logging)
-->

## Error Handling Strategy

**Philosophy**: Comprehensive error resilience. This combines thoughtful retry mechanisms with fail-fast principles.

### ⚠️ **CRITICAL**: Thoughtful Retry Mechanisms

**When to Retry**: Only for transient or recoverable errors where retries can succeed.

#### Retry-Appropriate Scenarios:

- **5xx Server Errors**: Internal server errors, service unavailable (503), gateway timeout (504)
- **Network Timeouts**: Connection timeouts, request timeouts
- **Rate Limiting**: 429 Too Many Requests with retry-after headers
- **External API Transient Failures**: Shopify API temporary unavailability

#### Retry Implementation Requirements:

- **Reasonable Limits**: Maximum 3-5 retry attempts
- **Exponential Backoff**: Increasing delays between retries (1s, 2s, 4s, 8s)
- **Jitter**: Add random variation to prevent thundering herd effects
- **Idempotency**: Ensure operations can be safely repeated
- **Circuit Breaker**: Stop retrying after consecutive failures

```typescript
interface RetryConfig {
  maxAttempts: number // 3-5 attempts maximum
  baseDelay: number // Starting delay in milliseconds
  maxDelay: number // Cap exponential growth
  exponentialBase: number // Backoff multiplier (2.0)
  jitter: boolean // Add randomization
}
```

### 🔥 **HIGH**: Fail-Fast Principles

**When to Fail-Fast**: For persistent or client errors where retries cannot succeed.

#### Fail-Fast Scenarios:

- **Client Errors**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- **Authentication Issues**: Invalid credentials, expired tokens
- **Permission Violations**: Insufficient access rights
- **Business Logic Violations**: Data consistency errors, constraint violations

#### Fail-Fast Implementation:

- **Immediate Response**: Surface errors immediately without delay
- **Clear Error Messages**: Provide actionable feedback to users
- **No Retry Attempts**: Do not waste resources on unrecoverable errors
- **Proper Status Codes**: Use appropriate HTTP status codes for different error types

## Canonical Response Formats

**Standard Response Interface**: Use consistent response structure across all API endpoints.

```typescript
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
  }
}

interface ErrorResponse {
  error: string // User-friendly error message
  details?: string // Technical details for debugging
  code: string // Internal error code
  timestamp: string // ISO timestamp
  retryable: boolean // Whether error is retryable
  retryAfter?: number // Suggested retry delay (seconds)
  success: false // Always false for errors
}

interface ValidationError {
  field: string
  message: string
  code: string
}

interface ValidationResponse {
  error: string
  details?: string
  code: string
  timestamp: string
  success: false
  errors: ValidationError[] // Field-specific validation errors
}
```

### 🔥 **HIGH**: Combined Strategy Implementation

**Principle**: Use both strategies together for comprehensive error handling.

#### Decision Matrix:

```typescript
function shouldRetry(error: ApiError): boolean {
  // Fail-fast for client errors
  if (error.status >= 400 && error.status < 500) {
    return false
  }

  // Retry for server errors and specific transient conditions
  if (error.status >= 500 || error.status === 429) {
    return true
  }

  // Retry for network timeouts
  if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
    return true
  }

  return false
}
```

#### Status Code Classifications:

- **400**: Bad request (invalid data, validation errors) - **FAIL-FAST**
- **401**: Authentication required or failed - **FAIL-FAST**
- **403**: Permission denied - **FAIL-FAST**
- **404**: Resource not found - **FAIL-FAST**
- **409**: Conflict (duplicate resource) - **FAIL-FAST**
- **422**: Validation failed - **FAIL-FAST**
- **429**: Rate limit exceeded - **RETRY with exponential backoff**
- **500**: Internal server error - **RETRY with exponential backoff**
- **502**: Bad gateway - **RETRY with exponential backoff**
- **503**: Service unavailable - **RETRY with exponential backoff**
- **504**: Gateway timeout - **RETRY with exponential backoff**

## Critical API Anti-Patterns

### Common Mistakes to Avoid:

1. Silent error handling (no error response to client)
2. Inconsistent error response formats
3. Missing HTTP status codes or retry classification
4. Retrying non-retryable errors (4xx client errors)
5. No exponential backoff or retry limits
6. Missing authentication on protected routes
7. No circuit breaker for cascade failure prevention

### Implementation Guidelines:

- **Always Surface Errors**: Never swallow exceptions without user feedback
- **Consistent Format**: Use standardized error response structure
- **Proper Classification**: Distinguish between retryable and non-retryable errors
- **Resource Protection**: Implement circuit breakers for external dependencies
- **Monitoring**: Log error patterns for debugging and system health
