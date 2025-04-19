# Frontend Services Module

This directory contains modules responsible for interacting with backend APIs and providing shared utilities related to data fetching, caching, and error handling within the Uni Hub frontend application.

## Directory Structure

```
services/
├── api/
│   ├── auth/          # Authentication related API service calls
│   ├── community/     # Community related API service calls
│   ├── landing/       # Landing page related API service calls
│   ├── user/          # User related API service calls
│   ├── apiClient.ts   # Configured Axios instance for making API requests
│   └── index.ts       # Exports all API service modules
├── utils/
│   ├── cacheManager.ts  # Utilities for managing client-side caching
│   └── errorHandling.ts # Utilities for standardized API error handling
└── README.md        # This file
```

## Core Components

### `api/`

This subdirectory houses all the logic related to making requests to the backend API. It is further organized by feature or resource type.

-   **`apiClient.ts`**:
    -   Initializes and configures the primary HTTP client (likely Axios or Fetch) used for all backend communication.
    -   Sets up base URL, default headers (e.g., `Content-Type`), and potentially interceptors for handling authentication tokens (e.g., adding `Authorization` headers) or global error responses.
-   **Resource Subdirectories (`auth/`, `community/`, `landing/`, `user/`)**:
    -   Each directory contains service files specific to a particular API resource or feature area.
    -   Files within these directories define functions that encapsulate specific API endpoints (e.g., `loginUser`, `fetchCommunityDetails`, `updateUserProfile`).
    -   These functions utilize the configured `apiClient` to perform the actual HTTP requests.
-   **`index.ts`**:
    -   Acts as a central export point for all API service modules, making them easily importable throughout the application.

### `utils/`

This subdirectory contains shared utility functions that support the API services or other parts of the application that deal with data fetching and management.

-   **`cacheManager.ts`**:
    -   Provides functions or classes for implementing client-side caching strategies.
    -   This might involve using `localStorage`, `sessionStorage`, or in-memory caches to store frequently accessed data, reducing redundant API calls and improving performance.
    -   Could include logic for cache invalidation based on time or specific actions.
-   **`errorHandling.ts`**:
    -   Offers standardized functions for handling errors returned from API calls.
    -   May include functions to parse error responses, extract meaningful error messages for the user, log errors, or classify different types of errors (e.g., network errors, validation errors, server errors).

## Usage

To use an API service, import the required function from the relevant module, typically accessed via the central `api/index.ts` export.

```typescript
import { authApi, userApi } from '@/services/api'; // Assuming index.ts exports like this

async function handleLogin(credentials) {
  try {
    const user = await authApi.login(credentials);
    // Handle successful login
  } catch (error) {
    // Use error handling utilities if needed
    console.error("Login failed:", error);
  }
}

async function fetchProfile(userId) {
  try {
    const profile = await userApi.getProfile(userId);
    // Use profile data
  } catch (error) {
    // Handle error
  }
}
```

Utilities like the `cacheManager` or `errorHandling` can be imported directly from the `utils` directory where needed. 