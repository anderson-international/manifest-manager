# Database Forms

_Schema-driven form development and multi-step form patterns._

<!-- AI_QUICK_REF
Overview: Schema-driven form development patterns for multi-step forms and database integration
Key Rules: AI_TABLE_PURPOSE annotations, Schema validation patterns, Database transactions
Avoid: Missing schema validation, Non-atomic database operations, Bypassing AI annotations
-->

<!-- RELATED_DOCS
Core Patterns: db-enums.md (Enum integration and field components), form-patterns-validation.md (Form validation strategy)
Implementation: react-fundamentals.md (React Hook Form patterns), code-typescript.md (TypeScript validation)
Database: db-schema.md (Auto-generated schema documentation)
-->

## Schema-Driven Form Development

### AI_TABLE_PURPOSE Annotations

The database schema includes AI-optimized annotations that guide form implementation:

- **⚠️ CRITICAL: `AI_TABLE_PURPOSE`**: Defines primary use case and form complexity
- **🔥 HIGH: `AI_FORM_TYPE`**: Specifies recommended UI component patterns
- **⚙️ MEDIUM: `AI_WORKFLOW`**: Indicates state management requirements
- **🔥 HIGH: `// FORM:`**: Inline field-specific implementation guidance

### Example Annotations

```typescript
// Core specification data - Multi-step wizard
specifications: {
  purpose: "Core specification data - main CRUD operations focus here",
  formType: "Multi-step wizard form (product selection, ratings, review, enums)",
  workflow: "Published → Needs Revision → Under Review"
}

// Junction tables - Multi-select components
spec_cures: { purpose: "Junction table - handle as multi-select in forms", formType: "Multi-select checkboxes or tags" }
```

## Multi-Step Form Implementation

### Specification Creation with Relations

```typescript
// Handle specification creation with junction tables
const createSpecificationWithRelations = async (data: SpecificationFormData) => {
  const { specification, junctionData } = transformSpecificationData(data)

  // Use database transaction for atomic operations
  return await db.transaction(async (trx) => {
    // Create core specification
    const [spec] = await trx('specifications').insert(specification).returning('*')

    // Create junction table entries
    if (junctionData.spec_tasting_notes.length > 0) {
      await trx('spec_tasting_notes').insert(
        junctionData.spec_tasting_notes.map((item) => ({
          ...item,
          specification_id: spec.id,
        }))
      )
    }

    return spec
  })
}
```

### Data Transformation Pattern

For junction table data transformation patterns and detailed implementation, see `db-enums.md` section "Junction Table Data Transformation".

_Database schema annotations are maintained in `.windsurf/project/db-schema.md`. Update annotations when schema changes to maintain form implementation guidance._
