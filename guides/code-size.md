# File Size Management & Decomposition

## Executive Summary
File size constraints enforce maintainable architecture. When files exceed limits, decompose by logical responsibility rather than arbitrary splitting.

## File Size Limits
- **Components**: 150 lines
- **Hooks**: 100 lines  
- **Services**: 100 lines
- **Repositories**: 100 lines
- **Utils**: 50 lines
- **Types**: 100 lines
- **API Routes**: 100 lines

## Decomposition Strategy

### 1. Analyze Existing Patterns
- Examine codebase for established decomposition patterns
- Follow existing architectural precedents
- Maintain naming conventions and directory structure

### 2. Logical Separation Principles

#### By Responsibility
- **Read Operations**: Query/fetch methods → `*-read-*.ts`
- **Write Operations**: Create/update/delete → `*-write-*.ts`
- **Constants**: Large objects/configs → `constants/` or `includes/`
- **Types**: Interfaces/type definitions → `types/`

#### By Feature Domain
- **Core Logic**: Primary business logic
- **Validation**: Input validation and schemas
- **Transformations**: Data mapping and conversion
- **Utilities**: Helper functions

### 3. File Organization Patterns

#### Repository Pattern
```
original-repository.ts (126 lines) →
├── read-repository.ts (35 lines)
├── write-repository.ts (54 lines)  
├── includes/constants.ts (25 lines)
└── types/interfaces.ts (35 lines)
```

#### Service Pattern
```
large-service.ts (180 lines) →
├── core-service.ts (60 lines)
├── validation-service.ts (45 lines)
└── transformer-service.ts (75 lines)
```

#### Component Pattern
```
large-component.tsx (200 lines) →
├── main-component.tsx (80 lines)
├── hooks/use-component-logic.ts (60 lines)
└── utils/component-helpers.ts (45 lines)
```

## Implementation Process

### Phase 1: Analysis
1. Identify file size violation
2. Map content structure and responsibilities
3. Find existing architectural patterns
4. Plan separation boundaries

### Phase 2: Design
1. Design new file structure
2. Ensure each file stays well under limits (leave growth room)
3. Plan import update strategy
4. Identify dependent files

### Phase 3: Execute
1. Create new files with extracted content
2. Update all dependent imports systematically
3. Fix method calls when splitting operations
4. Validate with TypeScript compilation

### Phase 4: Cleanup
1. Delete original file using correct syntax
2. Final compilation and functionality validation

## Validation Strategy

### Immediate Feedback
- TypeScript compilation catches import errors
- Use `grep_search` to find all dependent files
- Test early and often during decomposition

### Systematic Import Updates
```typescript
// Before: Single import
import { Service, Type } from './large-file'

// After: Multiple imports  
import { ReadService } from './read-service'
import { WriteService } from './write-service'
import { Type } from './types/interfaces'
```

## Success Criteria

### Architectural Consistency
- Follows existing patterns, doesn't invent new ones
- Maintains logical cohesion within files
- Uses consistent naming and directory structure

### Size Compliance with Growth Allowance
- Target 60-80% of size limits, not 95-100%
- Allows room for future features
- Prevents immediate re-violation

### Zero Functional Impact
- Pure refactoring with no behavioral changes
- All tests continue to pass
- TypeScript compilation successful

## Anti-Patterns

### Don't
- Split arbitrarily to just meet size limits
- Ignore existing architectural patterns
- Create new directory structures without precedent
- Skip dependent file updates
- Use minimal splits that will immediately re-violate

### Do
- Follow logical responsibility boundaries
- Maintain architectural consistency
- Leave growth room in decomposed files
- Update all imports systematically
- Validate at each step

## Command Reference

### File Operations (Windows)
```bash
# Correct syntax
cmd /c del path\to\file.ts
cmd /c move old.ts new.ts

# Validation
cmd /c npx tsc --noEmit
```

### Search Dependencies
```bash
# Find all imports
grep_search "import.*from.*original-file"

# Find method usage  
grep_search "OriginalClass\."
```

## Result Assessment
Successful decomposition achieves:
- ✅ Size compliance with growth room
- ✅ Architectural consistency  
- ✅ Maintainability improvement
- ✅ Zero functional changes
- ✅ Systematic import updates
- ✅ TypeScript compilation success
