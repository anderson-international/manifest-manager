# API Response

_Standardized API response structure for consistent, AI-centric integration across all endpoints._

<!-- AI_QUICK_REF Overview: Canonical API response format for all endpoints. Data always wrapped, ISO timestamp required, strict error structure. Key Rules: All responses use ApiResponse or ApiError. No flat or legacy formats. Dynamic route params never awaited. Field names match schema. Error surfaced, never silent. Canonical format enforced in cache and edge. Avoid: Bypassing response wrappers, flat responses, silent errors, inconsistent field names, missing status codes. --> 

<!-- RELATED_DOCS Core Patterns: api-design.md (API strategy), api-errors.md (Error handling) Implementation: api-validation.md (Input validation), technical-stack.md (Response serialization) -->

## Canonical Response Structure

```typescript
interface ApiResponse {
  data: T
  timestamp: string
  message?: string
}

interface ApiError {
  error: string
  details?: unknown
  timestamp: string
}
```

- All endpoints: responses must use ApiResponse or ApiError.
- `data` is required for success, `error` for failure.
- `timestamp` always present, ISO 8601 format.
- Field names must match schema (e.g., `review`, not `review_text`).

## Implementation Requirements

### API Endpoint Standards

- All endpoints wrapped in `withErrorHandling`.
- Dynamic route params: never use `await params`; always parse/validate IDs.
- No bypasses or direct JSON responses.

```typescript
const { id: idString } = params
const id = parseInt(idString, 10)
if (isNaN(id)) {
  return NextResponse.json(
    { error: "Invalid ID parameter", timestamp: new Date().toISOString() },
    { status: 400 }
  )
}
```

```typescript
export async function GET(request: NextRequest): Promise {
  return withErrorHandling(async () => {
    const data = await fetchData()
    return { data, timestamp: new Date().toISOString() }
  })
}
```

### Frontend Integration

- All hooks must expect `response.data.*`.
- Error handling: check `response.error`, never rely on flat or legacy structures.

```typescript
const response = await fetch('/api/endpoint')
const json = await response.json()
const specifications = json.data.specifications
if (json.error) throw new Error(json.error)
```

### Cache and Edge

- Cache must return canonical response format.
- Edge runtime: response format must remain consistent, including for large payloads.

### Testing and Compliance

- All endpoints must return `data` and `timestamp` on success, `error` and `timestamp` on failure.
- Automated tests must enforce canonical format.

```typescript
expect(json).toHaveProperty('data')
expect(json).toHaveProperty('timestamp')
expect(json).not.toHaveProperty('error')
```

## Critical API Anti-Patterns

1. Bypassing response wrappers.
2. Awaiting non-Promise params.
3. Flat or inconsistent response formats.
4. Missing status codes or error fields.
5. Silent error handling.