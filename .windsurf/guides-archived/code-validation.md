# Code Validation

_Centralized registry of validation patterns for AI compliance checking._

<!-- AI_QUICK_REF
Overview: Centralized registry for all validation patterns used in automated compliance checking
Key Rules: React performance patterns, TypeScript typing requirements, Form validation patterns, API design validation
Avoid: Missing useCallback/useMemo, 'any' type usage, Unvalidated form inputs, Missing error response formats
-->

<!-- RELATED_DOCS
React Patterns: react-patterns.md (Performance optimization)
TypeScript Rules: code-typescript.md (Type safety standards)
Form Patterns: db-forms.md (Form validation)
API Design: api-errors.md (Error handling)
-->

## Overview

This document serves as the centralized registry of all validation patterns. We use these for automated compliance checking. Each pattern includes:

- A unique identifier
- The validation regex or rule
- Source document reference
- Priority level
- Description of what it validates

## React Validation Patterns

Source: react-patterns.md

### Performance Patterns

| ID                 | Pattern                                      | Priority    | Description                                      |
| ------------------ | -------------------------------------------- | ----------- | ------------------------------------------------ |
| REACT_CALLBACK_001 | `/const\s+\w+\s*=\s*useCallback\(/`          | ⚠️ CRITICAL | Event handlers wrapped in useCallback            |
| REACT_MEMO_001     | `/const\s+\w+\s*=\s*useMemo\(/`              | ⚠️ CRITICAL | Derived state computed with useMemo              |
| REACT_MEMO_002     | `/export.*React\.memo\(/`                    | 🔥 HIGH     | Components with props wrapped in React.memo      |
| REACT_EFFECT_001   | Check stable references in dependency arrays | 🔥 HIGH     | No functions in dependencies without useCallback |
| REACT_EFFECT_002   | No object/array literals in dependencies     | 🔥 HIGH     | Objects memoized before use in dependencies      |

### Component Patterns

| ID               | Pattern                                         | Priority    | Description                                |
| ---------------- | ----------------------------------------------- | ----------- | ------------------------------------------ |
| REACT_COMP_001   | Component line count < 150                      | ⚠️ CRITICAL | Components don't exceed maximum line count |
| REACT_CLIENT_001 | `/'use client';/` presence in client components | ⚠️ CRITICAL | Correct client component declaration       |
| REACT_SERVER_001 | No hooks in server components                   | ⚠️ CRITICAL | Prevents React hooks in server components  |

## TypeScript Validation Patterns

Source: code-typescript.md

### Type Safety

| ID             | Pattern                               | Priority    | Description                                |
| -------------- | ------------------------------------- | ----------- | ------------------------------------------ |
| TS_RETURN_001  | `/: (void\|Promise<\w+>\|\w+)/`       | ⚠️ CRITICAL | Explicit function return types             |
| TS_ANY_001     | Reject `/: any\|any\[\]/`             | ⚠️ CRITICAL | Prevents usage of 'any' type               |
| TS_CONSOLE_001 | Allow only `/console\.(warn\|error)/` | 🔥 HIGH     | Restricts console usage to warn/error only |

### Code Organization

| ID            | Pattern                                   | Priority  | Description                       |
| ------------- | ----------------------------------------- | --------- | --------------------------------- |
| TS_IMPORT_001 | Require blank lines between import groups | 🔥 HIGH   | Proper import organization        |
| TS_NAME_001   | Component files use PascalCase            | ⚙️ MEDIUM | Naming conventions for components |
| TS_NAME_002   | Utility files use camelCase               | ⚙️ MEDIUM | Naming conventions for utilities  |

## Form Management Validation Patterns

Source: db-forms.md

### React Hook Form

| ID              | Pattern                | Priority    | Description                             |
| --------------- | ---------------------- | ----------- | --------------------------------------- |
| FORM_HOOK_001   | `/const.*=.*useForm</` | ⚠️ CRITICAL | React Hook Form usage                   |
| FORM_SUBMIT_001 | `/handleSubmit\(/`     | ⚠️ CRITICAL | Form submission wrapped in handleSubmit |
| FORM_REG_001    | `/\{\.\.\.register\(/` | 🔥 HIGH     | Field registration with register        |
| FORM_ERROR_001  | `/formState\.errors/`  | 🔥 HIGH     | Error handling with formState.errors    |

## API Design Validation Patterns

Source: api-errors.md

### API Route Structure

| ID             | Pattern                                           | Priority    | Description              |
| -------------- | ------------------------------------------------- | ----------- | ------------------------ |
| API_ROUTE_001  | Next.js route handler files organized by resource | ⚠️ CRITICAL | API route structure      |
| API_STATUS_001 | All responses include appropriate status codes    | ⚠️ CRITICAL | Proper HTTP status codes |
| API_ERR_001    | Error responses include error code and message    | 🔥 HIGH     | Error response format    |
| API_VALID_001  | Input validation before processing                | ⚠️ CRITICAL | All inputs validated     |

## Usage Guidelines

1. **For AI Tools**: Reference validation patterns by their unique ID. Use this when checking code compliance.
2. **For Documentation Updates**: Add new validation rules to individual documents. Also add them to this registry.
3. **For Rule Changes**: Update both this registry and the source document. Do this when modifying validation rules.
4. **For Priority Changes**: Any changes to priority levels must be reflected in both locations. Update this registry and the source document.
