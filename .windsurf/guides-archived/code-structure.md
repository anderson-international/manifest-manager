# Code Structure

_Project structure and naming conventions for maintainable code._

<!-- AI_QUICK_REF
Overview: Project structure and naming conventions
Key Rules: PascalCase for components, camelCase for functions, UPPER_SNAKE_CASE for constants
Avoid: Inconsistent naming, Mixed case styles, Unclear file organization
-->

<!-- RELATED_DOCS
Quality Standards: code-eslint.md (ESLint rules), code-prettier.md (Formatting), code-typescript.md (Type safety)
React Patterns: react-patterns.md (Component patterns), react-fundamentals.md (Hook patterns)
Technical Foundation: technical-stack.md (Next.js 15, React 18 config)
-->

## Key Principles

1. **Consistent Naming**: All naming follows established patterns based on context
2. **Logical Organization**: Files and folders are organized by feature and type
3. **Clear Structure**: Project structure is predictable and navigable
4. **Import Organization**: Imports follow consistent grouping and ordering

## Project Structure

```
specifications/
├── app/                     # Next.js 13+ app directory
│   ├── (auth)/login/        # Route groups
│   ├── dashboard/page.tsx   # Route components
│   ├── api/users/           # API routes
│   └── globals.css
├── components/              # Reusable components
│   ├── common/Button/
│   ├── forms/
│   └── layout/
├── hooks/                   # Custom hooks
│   ├── useAuth.ts
│   └── index.ts
├── lib/                     # Utilities
│   ├── api.ts
│   └── utils.ts
├── types/                   # Type definitions
│   └── index.ts
└── styles/                  # Global styles
```

## Naming Conventions

### Variables and Functions

- **Variables**: camelCase, descriptive nouns - `userData`, `isLoading`
- **Functions**: camelCase, descriptive verbs - `fetchUserData`, `calculateTotal`
- **Constants**: UPPER_SNAKE_CASE - `API_URL`, `MAX_RETRY_ATTEMPTS`
- **Private**: Prefix with underscore - `_privateHelper`, `_internalState`
- **Hooks**: Prefix with "use" - `useFormState`, `useApiData`

### Components and Types

- **React Components**: PascalCase - `NavigationBar`, `UserProfile`
- **Interfaces/Types**: PascalCase - `User`, `FormProps`, `ApiResponse`
- **Enums**: PascalCase, singular - `ButtonType`, `UserRole`
- **Generic Types**: Single uppercase letter - `T`, `K`, `V`

### Files and Directories

- **Components**: PascalCase - `Button.tsx`, `UserProfile.tsx`
- **Hooks**: camelCase with "use" prefix - `useAuth.ts`, `useLocalStorage.ts`
- **Utilities**: camelCase - `apiClient.ts`, `formatUtils.ts`
- **Types**: camelCase - `userTypes.ts`, `apiTypes.ts`
- **Directories**: camelCase - `components/`, `hooks/`, `utils/`

## Import Organization

```typescript
// 1. React/Next.js
import React, { useState, useEffect } from 'react'
// 2. Third-party (alphabetical)
import { Typography, Button } from '@mui/material'
// 3. Internal - hooks, utils, context
import { useAuth } from '@/hooks/useAuth'
// 4. Components
import UserAvatar from '@/components/UserAvatar'
// 5. Types
import type { User } from '@/types'
// 6. Styles (last)
import styles from './Component.module.css'
```

**Groups**: React/Next.js → Third-party → Internal → Components → Types → Styles

## Component Organization

```typescript
// Component structure: imports → types → component
import React, { useState, useEffect } from 'react';
import { fetchUserData } from '@/lib/api';
import type { User } from '@/types';

interface UserProfileProps {
  userId: string;
  isEditable?: boolean;
  onUpdate?: (user: User) => void;
}

export const UserProfile = ({ userId, isEditable = false, onUpdate }: UserProfileProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData(userId).then(setUser).finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {isEditable && <button onClick={() => onUpdate?.(user)}>Edit</button>}
    </div>
  );
};
```

## Naming Convention Examples

### ✅ Correct Examples

```typescript
// Variables and functions
const userSettings = getUserSettings()
const isAuthenticated = checkAuthStatus()
const MAX_RETRY_ATTEMPTS = 3

function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price, 0)
}

// Components and types
interface UserProfileProps {
  user: User
  isEditable?: boolean
}
type FilterOptions = 'active' | 'archived' | 'all'

class UserRepository {
  private _connection: Connection
  public async findById(id: string): Promise<User | null> {
    /* Implementation */
  }
}

// Constants and enums
const API_ENDPOINTS = { USERS: '/api/users', PRODUCTS: '/api/products' } as const
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
```

## File Organization Best Practices

### Component Structure

```
components/Button/
├── Button.tsx
├── Button.module.css
└── index.ts
```

### Barrel Exports

```typescript
// components/index.ts
export { Button } from './Button'
export { Modal } from './Modal'
```

### Size Limits

- **Components**: Max 150 lines
- **Hooks**: Max 100 lines
- **Utils**: Max 50 lines
- **Types**: Max 100 lines

**When exceeded**: Extract to custom hooks, utilities, sub-components, or separate type files.
