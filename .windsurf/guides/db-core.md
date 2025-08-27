# Database Core

_Core database patterns, ORM strategy, and development workflow._

<!-- AI_QUICK_REF
Overview: Core database interaction patterns, Prisma ORM strategy, and development workflow
Key Rules: Prisma singleton, Transaction support, Fix-forward schema changes, Query-based indexing
Avoid: Multiple Prisma instances, Complex rollback procedures, Missing validation
-->

<!-- RELATED_DOCS
Core Patterns: db-sync.md (Product sync strategy), db-forms.md (Schema-driven forms)
Implementation: db-schema.md (Auto-generated schema documentation)
Project Context: technical-stack.md (Technology configuration)
-->

## Database Interaction Patterns

### ORM Strategy

- **Prisma ORM**: Single data access layer for all database operations
- **Type Safety**: Leverage Prisma's generated types throughout application
- **Singleton Pattern**: Use single Prisma client instance across application

### Query Philosophy

- **Validation First**: Always validate data before database operations
- **Prisma First**: Use Prisma queries over raw SQL for type safety and schema consistency
- **Efficient Queries**: Use Prisma's select/include features for performance
- **Transaction Support**: Use Prisma transactions for atomic operations

## Development Workflow

### Schema Changes

- **Simple Approach**: Use direct SQL scripts for schema modifications
- **Fix Forward**: Address issues as they arise rather than complex rollback procedures
- **Document Changes**: Update schema documentation after modifications

### Testing Strategy

- **Separate Environment**: Use test database for development testing
- **Simple Seeding**: Basic data setup for consistent testing
- **Clean Slate**: Reset test data between runs for reliable results

## Performance Guidelines

### Indexing Strategy

- **Query-Based**: Index fields based on actual query patterns
- **Foreign Keys**: Always index relationship fields
- **Monitor Performance**: Adjust indexes based on usage patterns

### Connection Management

- **Prisma Pooling**: Use built-in connection pooling features
- **Environment Limits**: Configure connections based on deployment platform
- **Simple Monitoring**: Basic connection usage tracking

## Development Patterns

### Prisma Client Usage

```typescript
// Singleton pattern for Prisma client
const prisma = new PrismaClient()

// Type-safe queries with select/include
const specifications = await prisma.specification.findMany({
  select: {
    id: true,
    name: true,
    product: {
      select: { name: true, shopify_handle: true },
    },
  },
})
```

### Transaction Handling

```typescript
// Use transactions for atomic operations
const result = await prisma.$transaction(async (tx) => {
  const spec = await tx.specification.create({ data: specData })
  await tx.specTastingNote.createMany({
    data: tastingNotes.map((note) => ({
      specification_id: spec.id,
      tasting_note_id: note.id,
    })),
  })
  return spec
})
```
