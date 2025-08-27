# Code TypeScript

_TypeScript return types and type safety standards._

<!-- AI_QUICK_REF
Overview: TypeScript type safety and return type requirements
Key Rules: Explicit return types, No 'any' type, Type guards, Union types
Avoid: Missing return types, Using 'any' type, Unsafe type assertions
-->

<!-- RELATED_DOCS
Quality Standards: code-eslint.md (ESLint rules), code-prettier.md (Formatting), code-structure.md (Project structure)
React Patterns: react-patterns.md (Component patterns), react-fundamentals.md (Hook patterns)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config)
-->

## Executive Summary

This document defines mandatory TypeScript type safety standards and return type requirements. All functions must have explicit return types, use of 'any' type is prohibited, and specific patterns must be followed for type safety. The standards ensure consistent, type-safe code that catches errors at compile time rather than runtime.

## Key Principles

1. **Explicit Return Types**: All functions must declare their return types
2. **No 'Any' Type**: Prohibit use of 'any' type in favor of specific types
3. **Type Guards**: Use proper type checking and validation
4. **Union Types**: Prefer union types over 'any' for multiple possibilities
5. **Type Assertions**: Use safe type assertions with proper validation

## Mandatory Return Type Examples

### ✅ Correct: Explicit Return Types

```typescript
// Function declaration
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Arrow function
const getFullName = (user: User): string => `${user.firstName} ${user.lastName}`;

// Async function
async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

// React component
function UserProfile({ user }: UserProfileProps): JSX.Element {
  return <div><h1>{user.name}</h1><p>{user.email}</p></div>;
}

// Void/Generic/Union types
function logActivity(action: string): void { console.log(action); }
function identity<T>(arg: T): T { return arg; }
function parseResponse(data: string): User | null {
  try { return JSON.parse(data); } catch { return null; }
}
```

### ❌ Incorrect: Missing Return Types

```typescript
// ❌ Missing return types
function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }
const getFullName = (user) => `${user.firstName} ${user.lastName}`;
async function fetchUserData(userId) { return fetch(`/api/users/${userId}`).then(r => r.json()); }
function UserProfile({ user }) { return <div><h1>{user.name}</h1></div>; }
```

## Type Safety Examples

### ✅ Correct: Proper Type Definitions

```typescript
// Specific types instead of 'any'
function processUserData(user: User): ProcessedUser {
  return { id: user.id, name: user.name, formattedEmail: formatEmail(user.email) }
}

// Union types
function handleResponse(data: SuccessResponse | ErrorResponse): void {
  if ('error' in data) console.error(data.error.message)
  else processData(data.result)
}

// Unknown with type guards
function parseApiResponse(response: unknown): ParsedData {
  if (typeof response !== 'object' || !response) throw new Error('Invalid format')
  const data = response as Record<string, unknown>
  if (!('id' in data) || typeof data.id !== 'string') throw new Error('Missing ID')
  return { id: data.id, name: typeof data.name === 'string' ? data.name : 'Unknown' }
}

// Generic constraints
function filterArray<T extends { id: string }>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate)
}
```

### ❌ Incorrect: Using 'Any' Type

```typescript
// ❌ Using 'any' instead of proper typing
function processUserData(user: any): any {
  return { id: user.id, name: user.name }
}
function sortItems(items: any[]): any[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}
function parseApiResponse(response: any): ParsedData {
  return { id: response.id, name: response.name }
}
```

## Interface and Type Definitions

### ✅ Correct: Well-Defined Types

```typescript
// Interface definitions
interface User {
  readonly id: string
  name: string
  email: string
  createdAt: Date
  preferences?: UserPreferences
}

interface UserPreferences {
  theme: 'light' | 'dark'
  notifications: boolean
  language: string
}

// Type aliases and generics
type Status = 'loading' | 'success' | 'error'
type UserRole = 'admin' | 'user' | 'guest'

interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

// Utility types
type PartialUser = Partial<User>
type UserEmail = Pick<User, 'email'>
type UserWithoutId = Omit<User, 'id'>
```

### ❌ Incorrect: Poor Type Definitions

```typescript
// ❌ Overly generic or missing specific types
interface User {
  [key: string]: any
}
interface UserPreferences {
  theme: string
  notifications: any
}
interface ApiResponse {
  data: any
  success: any
}
```

## Advanced Type Patterns

```typescript
// Discriminated unions
interface LoadingState {
  status: 'loading'
}
interface SuccessState {
  status: 'success'
  data: User[]
}
interface ErrorState {
  status: 'error'
  error: string
}
type AsyncState = LoadingState | SuccessState | ErrorState
function isErrorState(state: AsyncState): state is ErrorState {
  return state.status === 'error'
}

// Conditional and template literal types
type ApiResult<T> = T extends string ? { message: T } : { data: T }
type EventName = `on${Capitalize<string>}`
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
```

## React-Specific TypeScript Patterns

```typescript
// Component props
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button = ({ children, onClick, variant = 'primary', disabled }: ButtonProps): JSX.Element => (
  <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>{children}</button>
);

// Hook return types
function useCounter(initialValue: number): [number, () => void, () => void] {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  return [count, increment, decrement];
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  handleChange: (field: keyof T, value: any) => void;
  handleSubmit: () => void;
  isValid: boolean;
}
```

## Prisma Repository Type Safety

### CRITICAL: Reference Canonical Types First

**Before writing repository/service code:**
1. Examine existing type patterns in codebase
2. Use established Prisma types not generic `any`
3. Reference specific model types from schema

### ✅ Correct: Prisma Types

```typescript
// Use specific Prisma model types
function createUser(tx: Prisma.TransactionClient, data: Prisma.usersCreateInput): Promise<User> {
  return tx.users.create({ data })
}

// Use existing type aliases
type SpecWithRelations = Prisma.specificationsGetPayload<{ include: typeof SPEC_INCLUDE }>

// Specific junction table types
interface SpecTastingNoteData {
  specification_id: number
  enum_tasting_note_id: number
}

function createTastingNotes(tx: Prisma.TransactionClient, data: SpecTastingNoteData[]): Promise<Prisma.BatchPayload> {
  return tx.spec_tasting_notes.createMany({ data, skipDuplicates: true })
}
```

### ❌ Incorrect: Any Types

```typescript
// ❌ Using 'any' instead of Prisma types
function createUser(tx: any, data: any): Promise<any> {
  return tx.users.create({ data })
}

function updateRecord(tx: Prisma.TransactionClient, model: any, id: number, data: any): Promise<any> {
  return model.update({ where: { id }, data })
}
```
