# Frontend Custom Hooks

This directory (`src/hooks`) contains custom React Hooks used throughout the Uni Hub frontend application. Custom Hooks are a mechanism to reuse stateful logic between components.

## Purpose

Storing custom hooks here helps:

-   **Promote Reusability:** Encapsulate common logic (like data fetching, form handling, state management) that can be used in multiple components.
-   **Improve Readability:** Keep component files cleaner and focused on the UI by extracting complex logic.
-   **Enhance Maintainability:** Logic updates only need to happen in one place (the hook).
-   **Simplify Testing:** Hooks can often be tested independently.

## Hooks

```
hooks/
├── index.ts          # Exports all hooks from this directory
├── useApi.ts         # Likely a generic hook for handling API request lifecycles (loading, error, data)
├── useCommunities.ts # Hook for fetching and managing community-related data
├── usePosts.ts       # Hook for fetching and managing post-related data
└── README.md         # This file
```

## Core Hooks

-   **`useApi.ts`**: (Presumed) Provides a standardized way to interact with the backend API, potentially handling `fetch` or `axios` calls, managing loading and error states, and returning the fetched data. May be used internally by other hooks.
-   **`useCommunities.ts`**: Manages state related to communities. Likely includes functions to fetch lists of communities, individual community details, handle joining/leaving, etc., along with associated loading and error states.
-   **`usePosts.ts`**: Manages state related to posts. Likely includes functions to fetch posts (perhaps for a specific community or user), create new posts, handle interactions (likes/comments), etc., along with loading and error states.
-   **`index.ts`**: Re-exports the hooks, allowing for convenient imports elsewhere in the application.

## Usage

Import the necessary hook(s) into your functional components.

```typescript
import React from 'react';
import { usePosts } from '@/hooks'; // Import via index.ts

function PostList() {
  const { posts, isLoading, error } = usePosts();

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div>Error loading posts: {error.message}</div>;
  }

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Contribution Guidelines

-   When creating new reusable stateful logic, consider placing it in a custom hook here.
-   Follow the `use` naming convention (e.g., `useFormInput`, `useWindowSize`).
-   Ensure hooks have a clear, single responsibility.
-   Document the hook's purpose, parameters, and return values using JSDoc comments.
-   Export new hooks from `index.ts`. 