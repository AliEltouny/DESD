# API Architecture Documentation

## Overview

The API architecture in this project follows a layered approach to ensure clean separation of concerns, maintainability, and type safety.

## File Structure

```
src/services/
├── apiClient.ts               # Base Axios instance with interceptors and config
├── api.ts                     # Compatibility layer (deprecated)
├── errorHandling.ts           # Centralized error handling utilities
├── cacheManager.ts            # Caching mechanisms
├── communityService.ts        # Legacy service functions (deprecated)
├── api/                       # Domain-specific API modules
│   ├── index.ts               # Re-exports API modules
│   ├── authApi.ts             # Authentication API
│   ├── communityApi.ts        # Community API
│   ├── postApi.ts             # Posts API
│   └── userApi.ts             # User API
└── index.ts                   # Main service exports
```

## Layer Descriptions

### 1. `apiClient.ts` - Base API Configuration

The foundation of the API layer, providing:

- Configured Axios instance
- Authentication interceptors
- Token refresh handling
- Error logging
- Media URL utilities

```typescript
import api, { API_URL } from '@/services/apiClient';

// Usage example
const response = await api.get('/communities/');
```

### 2. Domain-Specific API Modules

Located in the `api/` directory, these modules encapsulate related API operations:

- `communityApi.ts` - Community-related operations
- `authApi.ts` - Authentication operations
- `postApi.ts` - Post and comment operations
- `userApi.ts` - User profile operations

Each module:
- Exports a singleton instance (`export const communityApi = new CommunityAPI()`)
- Implements standardized error handling
- Provides caching where appropriate

```typescript
// Example usage
import { communityApi } from '@/services';
const communities = await communityApi.getCommunities();
```

### 3. Error Handling (`errorHandling.ts`)

Centralized error handling with:

- Standardized error messages
- HTTP status code interpretation
- Fallback values for errors
- Rethrow options for propagation

```typescript
return handleApiError(error, "fetching communities", {
  fallbackValue: [],
  rethrow: false
});
```

### 4. Caching (`cacheManager.ts`)

Two-tier caching strategy:

- `memoryCache` - In-memory, fast access cache
- `localStorageCache` - Persistent cache with TTL

```typescript
// Check cache first
if (memoryCache.isValid('communities')) {
  return memoryCache.get('communities');
}

// After API call
memoryCache.set('communities', data);
```

## Deprecated Files

### `api.ts`

A compatibility layer that re-exports from `apiClient.ts`. Use `apiClient.ts` directly instead.

### `communityService.ts`

Legacy functions that now forward to the appropriate API modules. Use the domain API modules directly instead.

## Import Guidelines

### Preferred Imports

```typescript
// Preferred: Import API instances directly
import { communityApi, postApi } from '@/services';

// Preferred: Import types directly from types
import { Community, Post } from '@/types/api';
```

### Deprecated Imports (Avoid)

```typescript
// Deprecated: Importing from legacy files
import { getCommunities } from '@/services/communityService';
```

## Type Definitions

All API-related types are centralized in `@/types/api.ts`:

- API request interfaces
- API response interfaces
- Domain models (Community, Post, etc.)
- Filter interfaces

This ensures type consistency across the application and avoids circular dependencies.

## Best Practices

1. **Use Domain APIs directly**: Prefer `communityApi.getCommunities()` over legacy functions
2. **Consistent error handling**: Always use the `handleApiError` utility
3. **Cache appropriately**: Use caching for read-heavy operations
4. **Type everything**: Leverage TypeScript interfaces for all API calls
5. **API Parameters**: Use proper types for API parameters (filters, form data) 

## Error Handling and Caching Considerations

When working with the API layer, keep these considerations in mind:

1. **User Object Serialization**: The backend cache implementation handles User objects by extracting their IDs to prevent serialization issues. If you're implementing cache-related functionality, make sure to handle non-serializable objects appropriately.

2. **Cache Key Generation**: The cache key generation process includes safeguards for:
   - User objects (converted to `User:{id}`)
   - AnonymousUser objects (converted to `"AnonymousUser"`)
   - Request objects (ignored)

3. **Error Response Structure**: Backend errors follow a standardized format:
   - Validation errors: Field-specific error messages 
   - General errors: `detail` field with error message
   - HTTP status codes: Appropriate codes for different error types (401, 403, 404, 500)

4. **Frontend Error Handling**: The `handleApiError` utility in `errorHandling.ts` processes these standardized errors and provides appropriate feedback to the user interface. 