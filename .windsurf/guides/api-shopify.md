# API Shopify

_Shopify integration patterns, GraphQL usage, and sync strategies._

<!-- AI_QUICK_REF
Overview: Shopify GraphQL integration, product sync, rate limiting, webhook processing
Key Rules: GraphQL only (no REST), 40 calls/second limit, Webhook signature verification, Fail-fast errors
Avoid: Shopify REST API, Silent error handling, Missing rate limiting, Fallback procedures
-->

<!-- RELATED_DOCS
Core Patterns: api-errors.md (Error handling), api-design.md (API strategy)
Implementation: db-sync.md (Product sync patterns), technical-stack.md (Environment config)
-->

## Shopify Integration

**Implementation**: You must use the Shopify GraphQL API. Do not use the REST API.

### API Configuration

- **Store Domain**: Configure via SHOPIFY_STORE_URL environment variable
- **Admin Access Token**: Read permissions for products via SHOPIFY_ADMIN_ACCESS_TOKEN
- **API Version**: Configure via SHOPIFY_API_VERSION environment variable

### GraphQL Integration

- **GraphQL Client**: Simple wrapper for Shopify GraphQL queries
- **Direct Queries**: Avoid complex SDK dependencies for straightforward needs
- **Error Handling**: Follow error handling patterns from `api-errors.md` for Shopify API errors
- **Rate Limiting**: Respect Shopify API limits with appropriate retry logic

```typescript
interface ShopifyConfig {
  storeUrl: string
  adminAccessToken: string
  apiVersion: string
}

interface ShopifyError {
  message: string
  code: string
  locations?: Array<{ line: number; column: number }>
  extensions?: Record<string, any>
}
```

### Product Sync Implementation

- **Scheduled Sync**: pg_cron every 6 hours for incremental updates using `updated_at` timestamps
- **Manual Refresh**: Admin API endpoint `/api/admin/refresh-products` for on-demand sync
- **Soft Delete Strategy**: Mark removed products as inactive rather than deleting
- **Error Handling**: Use retry logic from `api-errors.md` with exponential backoff for API failures

### Integration Patterns

- **Rate Limiting**: Respect Shopify's API limits (40 calls/second)
- **Webhook Processing**: Real-time product updates via webhook endpoints
- **Fallback Procedures**: Follow fail-fast principles from `api-errors.md` - no fallbacks, report errors to user
- **Data Validation**: Verify webhook signatures and sanitize incoming data

### Service Layer Pattern

- **External API Logic**: Separate from route handlers
- **Error Mapping**: Convert external API errors to consistent internal format
- **Timeout Handling**: Implement reasonable timeouts for external calls
- **Environment Config**: Use environment variables for API credentials

```typescript
class ShopifyService {
  private async executeGraphQLQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(
      `${this.config.storeUrl}/admin/api/${this.config.apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.config.adminAccessToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    )

    if (!response.ok) {
      throw new ShopifyAPIError(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new ShopifyAPIError(data.errors[0].message)
    }

    return data.data
  }
}
```

### Webhook Implementation

- **Signature Verification**: Verify webhook signatures for security
- **Payload Validation**: Validate incoming webhook data
- **Idempotency**: Handle duplicate webhook deliveries
- **Error Responses**: Return appropriate HTTP status codes

```typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const computedSignature = hmac.digest('base64')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))
}
```

By following these guidelines and patterns, we can ensure our Shopify integration is robust and maintainable.
