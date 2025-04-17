# Uni Hub Frontend

A modern, responsive web application for university communities built with Next.js, TypeScript, and Tailwind CSS.

## Project Structure

```
uni_hub/frontend/
├── .next/               # Next.js build cache
├── node_modules/        # Project dependencies
├── public/              # Static assets (images, fonts, etc.)
│   └── placeholders/    # Placeholder images
├── src/
│   ├── app/             # Next.js App Router directory
│   │   ├── (main)/        # Route groups for layout structure (example)
│   │   │   ├── communities/ # Community pages and routes
│   │   │   │   ├── [slug]/    # Dynamic community detail page
│   │   │   │   │   ├── analytics/ # Community analytics
│   │   │   │   │   ├── posts/     # Community posts
│   │   │   │   │   │   ├── [id]/    # Specific post detail
│   │   │   │   │   │   └── create/  # Create post page
│   │   │   │   │   ├── manage/    # Community management pages
│   │   │   │   │   └── settings/  # Community settings
│   │   │   │   ├── create/    # Create community page
│   │   │   │   └── page.tsx   # Communities list page
│   │   │   ├── dashboard/ # User dashboard
│   │   │   ├── events/    # Events page
│   │   │   ├── messages/  # Messages page
│   │   │   └── profile/   # User profile page
│   │   ├── (auth)/        # Authentication related pages (example route group)
│   │   │   ├── forgot-password/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── reset-password/
│   │   │   └── verify-otp/
│   │   │       └── [email]/ # Dynamic OTP verification page
│   │   ├── privacy-policy/ # Static pages
│   │   ├── terms-of-service/
│   │   ├── globals.css    # Global styles (Correct location)
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Landing page
│   │   └── providers.tsx  # Context providers wrapper
│   ├── components/      # Reusable UI components
│   │   ├── communities/ # Community-specific components
│   │   │   └── slugPage/  # Components specific to the [slug] page
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── landing/     # Landing page components
│   │   ├── layouts/     # Layout components (header, footer, sidebar)
│   │   └── ui/          # General-purpose UI elements (buttons, inputs, etc.)
│   ├── contexts/        # React Context API providers (e.g., AuthContext)
│   ├── hooks/           # Custom React hooks (e.g., useAuth)
│   ├── lib/             # Utility functions, libraries helpers
│   ├── services/        # API interaction and business logic
│   │   ├── api/         # Specific API service modules (communityApi, authApi, etc.)
│   │   ├── apiClient.ts # Base Axios client configuration
│   │   ├── cacheManager.ts # Caching logic
│   │   ├── errorHandling.ts # API error handling
│   │   ├── index.ts     # Barrel file exporting services
│   │   └── communityService.ts # DEPRECATED service file
│   ├── styles/          # Style-related files (potentially redundant globals.css here)
│   ├── types/           # TypeScript type definitions (api.ts, community.ts, etc.)
│   └── middleware.ts    # Next.js middleware
├── .env.example         # Example environment variables (Add if not present)
├── .eslintrc.json       # ESLint configuration (potentially redundant)
├── .gitignore           # Git ignore file
├── Dockerfile           # Production Dockerfile
├── Dockerfile.dev       # Development Dockerfile
├── eslint.config.mjs    # ESLint Flat configuration (Preferred)
├── next.config.js       # Next.js configuration (potentially redundant)
├── next.config.ts       # Next.js configuration (TypeScript - Preferred)
├── next-env.d.ts        # Next.js TypeScript declarations
├── package-lock.json    # Exact dependency versions
├── package.json         # Project dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── README.md            # This file
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
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
