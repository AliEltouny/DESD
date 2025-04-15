# Uni Hub Frontend

A modern, responsive web application for university communities built with Next.js, TypeScript, and Tailwind CSS.

## Project Structure

```
uni_hub/frontend/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # Reusable UI components
│   │   ├── auth/      # Authentication components
│   │   ├── communities/ # Community-related components
│   │   ├── dashboard/ # Dashboard components
│   │   ├── landing/   # Landing page components
│   │   ├── layout/    # Layout components (header, footer, etc.)
│   │   └── ui/        # Shared UI components
│   ├── contexts/      # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and other services
│   │   ├── api/       # API modules by domain
│   │   ├── apiClient.ts  # Base API configuration
│   │   ├── errorHandling.ts # Error handling utilities
│   │   └── cacheManager.ts  # Cache management utilities
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
└── ...
```

## Key Architectural Patterns

### API Layer

The API layer is structured with a domain-driven approach:

1. **Base API Client (`apiClient.ts`)**
   - Configures Axios with shared settings
   - Handles authentication tokens and headers
   - Provides request/response interceptors
   - Exports media URL utilities

2. **Domain-specific API Modules**
   - Located in `src/services/api/`
   - Organized by domain: `communityApi.ts`, `authApi.ts`, etc.
   - Each exports a singleton instance

3. **Error Handling**
   - Centralized in `errorHandling.ts`
   - Standardized handling across the application
   - Provides fallback values and user-friendly messages

4. **Caching Strategy**
   - Two-tier caching: memory (fast) and localStorage (persistent)
   - Automatic cache invalidation and expiration
   - Configurable per API call

> **Note:** For detailed API architecture documentation, see [services/README.md](src/services/README.md)

### Component Architecture

1. **Presentational Components**
   - Focus on UI rendering
   - Located in `components/ui/`
   - Accept data via props

2. **Container Components**
   - Handle state and data fetching
   - Use hooks to interact with the API layer
   - Pass data to presentational components

3. **Layout Components**
   - Provide consistent page structure
   - Handle responsive layouts

### State Management

1. **React Context**
   - Used for global state (auth, theme, etc.)
   - Located in `contexts/`

2. **Custom Hooks**
   - Abstract API calls and state management
   - Enable code reuse across components
   - Located in `hooks/`

## Key Patterns

### Data Fetching

```typescript
// Example using custom hooks
const { communities, loading, error } = useCommunities(filters);

// With error handling
if (loading) return <LoadingSpinner />;
if (error) return <ErrorAlert message={error} />;
```

### API Service Pattern

```typescript
// Domain-specific API services with standardized methods
class CommunityAPI {
  async getCommunities(filters?: CommunityFilters): Promise<Community[]> {
    try {
      // API call and caching logic
    } catch (error) {
      return handleApiError(error, "fetching communities", {
        fallbackValue: [],
        rethrow: false
      });
    }
  }
}
```

### Caching Pattern

```typescript
// Two-tier caching strategy
if (!filters && memoryCache.isValid('communities')) {
  return memoryCache.get('communities');
}

// API call and then cache
const data = await api.get('/communities/');
memoryCache.set('communities', data);
```

## Development Guidelines

1. **API Services**
   - Create domain-specific API modules in `services/api/`
   - Use standard error handling and caching patterns
   - Export singleton instances

2. **Components**
   - Keep components small and focused
   - Use TypeScript interfaces for props
   - Implement responsive design with Tailwind

3. **State Management**
   - Use contexts for global state
   - Create custom hooks for reusable logic
   - Keep state close to where it's used

4. **Error Handling**
   - Always handle API errors
   - Provide user-friendly error messages
   - Use fallback values where appropriate

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
