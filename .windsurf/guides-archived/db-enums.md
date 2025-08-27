# Database Enums

_Enum table integration, junction table handling, and field components._

<!-- AI_QUICK_REF
Overview: Enum integration patterns, junction table handling, and reusable field components
Key Rules: Single-select enum fields, Multi-select junction patterns, Enum data caching
Avoid: Redundant enum fetches, Missing junction table transformation, Non-cached enum data
-->

<!-- RELATED_DOCS
Core Patterns: db-forms.md (Schema-driven form development), form-patterns-validation.md (Form validation strategy)
Implementation: react-fundamentals.md (React Hook Form patterns), code-typescript.md (TypeScript validation)
Database: db-schema.md (Auto-generated schema documentation)
-->

## Enum Table Integration

### Single-Select Enum Fields

```typescript
// Schema annotation: FORM: dropdown from enum_product_types, REQUIRED
const ProductTypeSelect = ({ control, errors }: FormFieldProps): JSX.Element => {
  const { data: productTypes } = useProductTypes();
  return (
    <Controller
      name="product_type_id"
      control={control}
      rules={{ required: "Product type is required" }}
      render={({ field }) => (
        <select {...field}>
          <option value="">Select product type...</option>
          {productTypes?.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      )}
    />
  );
};
```

### Enum Data Fetching Pattern

```typescript
// Custom hook for enum data fetching
const useEnumData = (enumType: string) => {
  return useQuery({
    queryKey: ['enum', enumType],
    queryFn: () => fetchEnumData(enumType),
    staleTime: Infinity, // Persistent cache - invalidated only on admin updates
  })
}

// Usage
const { data: productTypes } = useEnumData('product_types')
```

## Junction Table Handling

### Multi-Select Component Pattern

```typescript
// Schema annotation: AI_FORM_TYPE: Multi-select checkboxes or tags
const TastingNotesMultiSelect = ({ control }: FormFieldProps): JSX.Element => {
  const { data: tastingNotes } = useEnumData('tasting_notes');

  return (
    <Controller
      name="tasting_note_ids"
      control={control}
      render={({ field: { value = [], onChange } }) => (
        <div>
          {tastingNotes?.map(note => (
            <label key={note.id}>
              <input
                type="checkbox"
                checked={value.includes(note.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...value, note.id]);
                  } else {
                    onChange(value.filter(id => id !== note.id));
                  }
                }}
              />
              {note.name}
            </label>
          ))}
        </div>
      )}
    />
  );
};
```

### Junction Table Data Transformation

```typescript
// Transform form data for junction table creation
const transformSpecificationData = (formData: SpecificationFormData) => {
  const { tasting_note_ids, cure_ids, tobacco_type_ids, ...coreData } = formData

  return {
    // Core specification data
    specification: coreData,

    // Junction table data arrays
    junctionData: {
      spec_tasting_notes: tasting_note_ids?.map((id) => ({ tasting_note_id: id })) || [],
      spec_cures: cure_ids?.map((id) => ({ cure_id: id })) || [],
      spec_tobacco_types: tobacco_type_ids?.map((id) => ({ tobacco_type_id: id })) || [],
    },
  }
}
```

### Schema Validation for Junction Tables

```typescript
// Schema validation with junction table arrays
const SpecificationFormSchema = z.object({
  // Core fields
  shopify_handle: z.string().min(1, 'Product selection required'),
  product_type_id: z.number().min(1, 'Product type required'),

  // Junction table arrays
  tasting_note_ids: z.array(z.number()).min(1, 'Select at least one tasting note'),
  cure_ids: z.array(z.number()).default([]),

  // Boolean fields with defaults
  is_fermented: z.boolean().default(false),
  is_oral_tobacco: z.boolean().default(false),
})
```

## Field Components

### Boolean Toggle Component

```typescript
// Schema annotation: FORM: checkbox or toggle
const BooleanToggle = ({ name, label, control }: BooleanFieldProps): JSX.Element => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <label>
          <input
            type="checkbox"
            checked={value || false}
            onChange={onChange}
          />
          {label}
        </label>
      )}
    />
  );
};
```

### Star Rating Component

```typescript
// Schema annotation: FORM: 1-5 star rating input
const StarRating = ({ control, name }: RatingFieldProps): JSX.Element => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ min: 1, max: 5, required: "Rating is required" }}
      render={({ field: { value, onChange } }) => (
        <div>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={star <= value ? 'filled' : ''}
            >
              ★
            </button>
          ))}
        </div>
      )}
    />
  );
};
```

## Performance Optimization

### Enum Data Caching

```typescript
// Cache enum data globally to prevent repeated fetches
const useEnumCache = () => {
  const queryClient = useQueryClient()

  const preloadEnums = useCallback(async (): Promise<void> => {
    const enumTypes = [
      'product_types',
      'grinds',
      'nicotine_levels',
      'experience_levels',
      'moisture_levels',
      'product_brands',
      'tasting_notes',
      'cures',
      'tobacco_types',
    ]

    await Promise.all(
      enumTypes.map((type) =>
        queryClient.prefetchQuery({
          queryKey: ['enum', type],
          queryFn: () => fetchEnumData(type),
          staleTime: Infinity, // Persistent cache - invalidated only on admin updates
        })
      )
    )
  }, [queryClient])

  return { preloadEnums }
}
```

_Database schema annotations are maintained in `.windsurf/project/db-schema.md`. Update annotations when schema changes to maintain form implementation guidance._
