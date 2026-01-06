# Standardized API Response Format

This document describes the standardized API response format used across the Church Management System API and how to handle responses on the frontend.

## Overview

All API responses follow a consistent format, regardless of success or failure. This standardization makes it easier to handle responses uniformly across the codebase and reduces errors related to inconsistent response handling.

## Response Format

### Standard Response Structure

```typescript
interface PaginationMeta {
  page?: number;                    // Current page number (1-indexed)
  per_page?: number;                // Items per page
  total_count?: number;             // Total number of items
  total_pages?: number;             // Total number of pages
  has_previous_page?: boolean;      // Whether there's a previous page
  has_next_page?: boolean;          // Whether there's a next page
}

interface ApiResponse<T = any> {
  success: boolean;           // Whether the request was successful
  message: string;            // Human-readable message
  data?: T;                   // Response data (if successful)
  error?: any;                // Error details (if failed)
  meta?: PaginationMeta;      // Pagination metadata (optional)
  timestamp: string;          // ISO 8601 timestamp
  path: string;               // Request path
  statusCode: number;         // HTTP status code
}
```

### Success Response Example

```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "id": "123",
    "name": "Church Name",
    "location": "City, Country"
  },
  "timestamp": "2026-01-05T12:00:00.000Z",
  "path": "/churches",
  "statusCode": 200
}
```

### Error Response Example

```json
{
  "success": false,
  "message": "Church context (churchId) is required for this operation",
  "error": {
    "name": "ForbiddenException",
    "statusCode": 403
  },
  "timestamp": "2026-01-05T12:00:00.000Z",
  "path": "/members",
  "statusCode": 403
}
```

## Backend Implementation

### Response Interceptor

The `ResponseInterceptor` (in `src/common/interceptors/response.interceptor.ts`) automatically wraps all controller responses in the standard format.

**Controllers should return only the data**, without wrapping it:

```typescript
// ✅ CORRECT
@Post('setup')
async setupChurch(@Body() body: SetupDto, @GetUser() user: any) {
  const church = await this.authService.setupInitialChurch(...);
  const updatedUser = await this.authService.getProfile(user.id);
  const tokens = this.authService.generateTokens(updatedUser);
  
  // Return just the data - the interceptor will wrap it
  return {
    church,
    user: updatedUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ❌ INCORRECT - Don't double-wrap
@Post('setup')
async setupChurch(...) {
  return {
    success: true,
    data: {
      // ...
    }
  };
}
```

### Error Handling

The `ErrorInterceptor` (in `src/common/interceptors/error.interceptor.ts`) automatically formats all errors:

```typescript
// ✅ CORRECT - Throw NestJS exceptions
if (!user) {
  throw new NotFoundException('User not found');
}

if (user.churchId !== requestedChurchId) {
  throw new ForbiddenException('You do not have access to this church');
}

// ❌ INCORRECT - Don't return error objects
if (!user) {
  return {
    success: false,
    message: 'User not found'
  };
}
```

## Frontend Usage

### Making Requests

Use the `apiRequest` function from `lib/api-client.ts`:

```typescript
// Example in a server action
import { apiRequest } from '@/lib/api-client'

export async function getChurches() {
  const response = await apiRequest({
    requestConfig: {
      method: 'GET',
      url: '/churches',
    },
  })

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}
```

### Handling Responses

All responses from `apiRequest` follow the standard format:

```typescript
// The response is guaranteed to have this structure
const response = await apiRequest({
  requestConfig: {
    method: 'POST',
    url: '/auth/setup',
    data: churchData,
  },
})

// Check success
if (!response.success) {
  console.error('Error:', response.message)
  console.error('Details:', response.error)
  return
}

// Access data directly
const { church, user, accessToken } = response.data
```

### Error Handling

```typescript
try {
  const response = await apiRequest({
    requestConfig: {
      method: 'POST',
      url: '/churches',
      data: churchData,
    },
  })

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('Setup error:', message)
  // Show toast, redirect, etc.
}
```

## Key Principles

### 1. Controllers Return Data Only
Controllers should only return the actual data. The interceptor automatically wraps it in the standard format.

### 2. Throw Exceptions, Don't Return Errors
Use NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`, etc.). The error interceptor will catch and format them.

### 3. Frontend Always Gets Consistent Format
Regardless of how the API was called or what happened, the frontend always receives a response in the standard format.

### 4. Structured Error Information
Errors include:
- `message`: Human-readable error message
- `error`: Structured error details with name and stack trace (in development)
- `statusCode`: HTTP status code
- `timestamp` and `path`: For debugging

## Common Patterns

### Handling 401 Unauthorized

The frontend `api-client.ts` automatically handles token refresh:

```typescript
// If response is 401 and token refresh fails, it redirects to signin
if (response.status === 401) {
  // Token refresh is attempted automatically
  // If it fails, user is redirected to /auth/signin
}
```

### Handling 403 Forbidden

The API returns 403 for permission errors. These are not redirects, just error responses:

```typescript
const response = await apiRequest({
  requestConfig: {
    method: 'GET',
    url: '/churches',
  },
})

if (!response.success && response.statusCode === 403) {
  // Handle permission denied
  console.error('Access denied:', response.message)
}
```

### Handling Network Errors

Network errors are also formatted consistently:

```typescript
if (!response.success && response.statusCode === 0) {
  // Network error or fetch failed
  console.error('Network error:', response.message)
}
```

## Migration Guide

If you find old code that doesn't follow this pattern:

### Controller Before (Old Pattern)
```typescript
return {
  success: true,
  data: {
    /* ... */
  }
}
```

### Controller After (New Pattern)
```typescript
return {
  /* ... */
}
```

### Frontend Before (Old Pattern)
```typescript
const result = response.data.data // Double nesting
```

### Frontend After (New Pattern)
```typescript
const result = response.data // Consistent format
```

## Debugging

Enable detailed logging by checking the browser console and server logs:

```
[API] Request config: { method: 'POST', url: '/auth/setup', skipAuth: false }
[API] POST http://localhost:3001/auth/setup with token: yes
[API] Response status: 201
[API] Response data: { success: true, message: '...', data: {...}, ... }
```

## Benefits

1. **Consistency**: All endpoints follow the same response format
2. **Type Safety**: TypeScript types are guaranteed to match
3. **Easier Debugging**: Standard structure makes it easy to track down issues
4. **Better DX**: Developers don't need to remember different response formats
5. **Error Handling**: Errors are structured and predictable
6. **Automatic Features**: Token refresh and redirects happen automatically

## Questions or Issues?

If you encounter responses that don't follow this format, please update the controller to match this pattern. The interceptors should handle all wrapping and error formatting automatically.
