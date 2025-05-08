# Verifying React Query Integration Fix

This document provides steps to verify that the community membership functionality works correctly with or without React Query available.

## Testing Environments

### 1. With React Query Provider

In environments where React Query is properly set up:

```jsx
// In _app.jsx or equivalent
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

### 2. Without React Query Provider

In environments where React Query is not set up or available:

```jsx
// In _app.jsx or equivalent
function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

## Test Cases

### Test Case 1: Join Community

1. Navigate to a community you're not a member of
2. Open browser console and check for any React Query errors
3. Click "Join Community" button
4. Verify in the console that:
   - No React Query errors are shown
   - Log shows "React Query not available for cache invalidation" (if provider is missing)
   - Join operation completes successfully
   - UI updates correctly to show membership status

### Test Case 2: Leave Community

1. Navigate to a community you're a member of
2. Open browser console and check for any React Query errors
3. Click "Leave Community" button
4. Verify in the console that:
   - No React Query errors are shown
   - Log shows "React Query not available for cache invalidation" (if provider is missing)
   - Leave operation completes successfully
   - UI updates correctly to show membership status

### Test Case 3: Network Retry With React Query

1. Enable network throttling in dev tools (Slow 3G)
2. Try to join a community
3. Check console logs to ensure:
   - Retry logic works properly
   - No React Query errors even if operations take longer
   - Cache invalidation attempts are handled properly

## Expected Results

### For Environments WITH React Query Provider

1. Join/Leave operations work normally
2. Cache invalidation occurs after membership changes:
   ```
   [Query] - Invalidating queries for ["community", "slug"]
   [Query] - Invalidating queries for ["membershipStatus", "slug"]
   [Query] - Invalidating queries for ["communities"]
   ```
3. No errors related to React Query in console

### For Environments WITHOUT React Query Provider

1. Join/Leave operations work normally
2. Console shows logs:
   ```
   React Query not available for cache invalidation
   ```
3. No errors related to React Query in console
4. UI updates manually through state management (without cache invalidation)

## Troubleshooting

If issues are still encountered:

1. Check console for specific error messages
2. Verify that the defensive coding in hooks is working:
   - `useQueryClient` usage is wrapped in try-catch
   - `queryClient` is null-checked before use
   - Cache invalidation is wrapped in try-catch
3. Review component tree to ensure React Query hooks aren't used in unexpected places 