# API Auth

_Authentication strategy for the Specification Builder project._

<!-- AI_QUICK_REF
Overview: Magic link email authentication with role-based access control, no password storage
Key Rules: Magic link auth, Role-based access, DevAuth for dev only, Fail-fast auth failures
Avoid: Password storage, Complex permission matrices, Development shortcuts in production, Silent auth failures
-->

<!-- RELATED_DOCS
Core Patterns: api-design.md (API strategy), api-errors.md (Error handling)
Implementation: technical-stack.md (Next.js auth), feature-requirements.md (Auth requirements)
-->

## Overview

This document provides strategic guidance for authentication decisions and patterns. Focus is on simplicity and security for a solo hobbyist project with role-based access control.

## Authentication Strategy

**Core Approach**: Magic link email authentication with no password storage or management.

### Production Strategy

- **Magic Links**: Email-based authentication tokens sent to user's email
- **No Passwords**: Eliminate password storage, reset flows, and security complexity
- **Session Management**: Secure session handling with appropriate expiration
- **Database Integration**: User authentication data stored in main database

### Development Strategy

- **User Selection**: Direct user selection from database for rapid development testing
- **Never Production**: Development shortcuts must never reach production environment
- **Fast Iteration**: Minimize authentication friction during development

## Role Management

**Philosophy**: Simple role-based access control without complex permission systems.

### Role Strategy

- **Database-Driven**: Roles stored in database enum tables for flexibility
- **Route Protection**: Middleware-based route protection by role
- **Component Access**: Role-based component rendering and feature access
- **Admin Override**: Administrative users have full system access

### Access Control Patterns

- **Route Level**: Protect entire routes based on user role
- **Component Level**: Conditionally render features based on permissions
- **API Level**: Validate user permissions on API endpoints
- **Simple Rules**: Avoid complex permission matrices

## Error Handling Philosophy

**Approach**: Follow error handling patterns from `api-errors.md` for authentication failures.

### Core Principles

- **Fail-Fast**: Surface authentication failures immediately (see `api-errors.md`)
- **No Silent Failures**: Never hide errors or use fallback states
- **Clear Messages**: Use `ErrorResponse` format from `api-errors.md` for authentication issues
- **Redirect Strategy**: Handle authentication failures with appropriate redirects

## Integration Patterns

### Application Integration

- **Context Management**: Global authentication state via React Context
- **Hook Patterns**: Custom hooks for authentication state and actions
- **Middleware**: Server-side authentication validation for protected routes
- **Type Safety**: Strongly typed user objects and authentication states

### API Integration

- **Session Validation**: Validate authentication on API route access
- **Role Verification**: Check user permissions for API operations
- **Error Responses**: Consistent authentication error response patterns
- **Token Handling**: Secure token generation and validation

## Development Workflow

### Environment Separation

- **Clear Boundaries**: Strict separation between development and production auth
- **Environment Flags**: Use environment variables to control auth strategy
- **Testing Isolation**: Authentication testing in isolated environments

### Security Considerations

- **Token Security**: Secure token generation and storage practices
- **Session Management**: Appropriate session timeout and cleanup
- **Database Security**: Secure user data storage and access patterns

This document focuses on strategic authentication guidance. Implementation details should reference current authentication libraries and patterns.
