# AI Context Critical

_Essential constraints and patterns that AIs regularly forget - reload this frequently._

<!-- AI_QUICK_REF
Overview: Critical constraints for AI coding tasks
Key Rules: Code file size limits, React loop prevention, Schema commands, Context requests
Avoid: Exceeding file size limits, React infinite loops, Missing context
-->

## Code File Size Limits (MANDATORY)

- **Components**: Max 150 lines
- **Hooks**: Max 100 lines
- **Utils**: Max 50 lines
- **Types**: Max 100 lines
- **API Routes**: Max 100 lines (thin controllers)
- **Services**: Max 100 lines (business logic)
- **Repositories**: Max 100 lines (data access)

**When exceeded**: Extract to custom hooks, services, repositories, or separate type files. Minimise all comments.

## Thin Controller Pattern

- Route files: Pure HTTP handling (request/response, validation, status codes)
- Services: Business logic and orchestration
- Repositories: Database queries and data access

## React Loop Prevention (MANDATORY)

- Always wrap functions in useCallback
- Always wrap expensive calculations in useMemo
- Never define objects/arrays inline in JSX
- Always include proper dependency arrays

### Example Pattern

```typescript
const MyComponent = () => {
  const handleClick = useCallback(() => {
    // Handle click logic
  }, [dependency1, dependency2]);

  const expensiveValue = useMemo(() => {
    return calculateExpensiveValue(data);
  }, [data]);

  return <button onClick={handleClick}>Click</button>;
};

## TypeScript Requirements (MANDATORY)

- **All functions**: Must have explicit return types
- **Never use**: 'any' type - use specific types or unions
- **React components**: Must return JSX.Element
- **Async functions**: Must return Promise<Type>

**Type Creation Protocol - MANDATORY VERIFICATION**: Before creating ANY new interface or type:

1. **Search for Existing Types** (REQUIRED):
   ```bash
   cmd /c npx grep-search "interface.*ApiResponse|type.*ApiResponse" --include="*.ts" --include="*.tsx"
   cmd /c npx grep-search "interface.*[YourTypeName]|type.*[YourTypeName]" --include="*.ts" --include="*.tsx"
   ```

2. **Verification Checklist** (ALL MUST PASS):
   - [ ] Searched codebase with specific grep commands
   - [ ] Confirmed no existing type matches functionality
   - [ ] Confirmed no existing type can be extended/composed
   - [ ] If similar type exists, documented why extension isn't viable

3. **Type Duplication**: If ANY existing type covers >70% of your use case, you MUST extend it rather than create duplicate.

## React Anti-Patterns (MANDATORY)

- **Dual Fetching**: Don't fetch same data from component AND context
- **Unstable Dependencies**: No functions returning new objects/arrays in deps
- **Ignored Warnings**: Always address React Hook dependency warnings
- **Missing Cleanup**: Always cleanup effects and subscriptions

## API Error Handling (MANDATORY)

- **Retry**: 5xx errors, timeouts, 429 rate limits (max 3-5 attempts)
- **Fail-fast**: 4xx errors, auth failures, validation errors
- **Always**: Exponential backoff with jitter
- **Never**: Retry 4xx client errors

## Database Form Patterns (MANDATORY)

- **AI_TABLE_PURPOSE**: Defines form complexity (multi-step vs simple)
- **Junction tables**: Always multi-select components
- **// FORM: annotations**: Follow inline field guidance
- **Atomic transactions**: All related data in single transaction

## Ultra Minimalist Comments Policy (MANDATORY)
- **Always**: Remove all comments before starting a task
- **Never**: Add comments to code
