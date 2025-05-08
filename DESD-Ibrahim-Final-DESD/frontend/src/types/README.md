# Frontend Type Definitions

This directory (`src/types`) is the central repository for all shared TypeScript type definitions and interfaces used throughout the Uni Hub frontend application.

## Purpose

Defining types centrally provides several key advantages:

-   **Type Safety:** Helps catch errors during development by ensuring data structures are used consistently.
-   **Code Clarity:** Makes the codebase easier to understand by explicitly defining the shape of data.
-   **Maintainability:** Simplifies refactoring and updates as data structures evolve.
-   **Developer Experience:** Enables better autocompletion and code intelligence in IDEs.

## Directory Structure

```
types/
├── api.ts           # General API related types (Responses, Errors, Pagination, Filters)
├── community.ts     # Types related to Community data structures
├── testimonial.ts   # Types related to Testimonial data structures
├── user.ts          # Types related to User and Profile data structures
└── README.md        # This file
```

## Core Files

-   **`api.ts`**: Contains generic types used across multiple API interactions, such as standardized response wrappers, error formats, pagination structures, and potentially common filter/query parameter types.
    -   *Note:* This file is quite comprehensive. For improved organization as the application grows, consider splitting it further. Generic types could remain here or move to `common.ts`, while API-specific request/response types could move to files matching their domain (e.g., `types/authApi.ts`, `types/communityApi.ts`).
-   **`community.ts`**: Defines the structure for community objects, member details, etc.
-   **`testimonial.ts`**: Defines the structure for testimonial data.
-   **`user.ts`**: Defines the structure for user objects, user profiles, authentication details, etc.

## Usage

Import types directly into your components, services, or state management files where needed.

```typescript
import { User } from '@/types/user';
import { Community } from '@/types/community';
import { ApiResponse } from '@/types/api';

interface UserProfileProps {
  user: User;
}

async function fetchCommunities(): Promise<ApiResponse<Community[]>> {
  // ... fetch logic
}
```

## Contribution Guidelines

-   When adding new data structures, define their types here.
-   Place types in the most relevant file (e.g., user-related types in `user.ts`).
-   If a type is highly specific to a single component or service and not reused, it can be defined locally within that file.
-   Keep types focused and avoid overly generic names unless necessary.
-   Use JSDoc comments to explain complex types or properties. 