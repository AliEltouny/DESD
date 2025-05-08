# Frontend Context API Implementations

This directory (`src/contexts`) holds implementations of the React Context API. Context provides a way to pass data through the component tree without having to pass props down manually at every level, effectively enabling global state management.

## Purpose

Using the Context API is beneficial for:

-   **Global State:** Sharing data that many components need access to (e.g., authentication status, user data, theme settings).
-   **Avoiding Prop Drilling:** Prevents the need to pass props through intermediate components that don't actually use the data.
-   **Decoupling:** Components can consume global state without needing to know exactly where it originated.

## Contexts

```
contexts/
├── AuthContext.tsx    # Manages authentication state (tokens, login status)
├── UserContext.tsx    # Manages logged-in user profile data
├── ThemeContext.tsx   # Manages UI theme (light/dark)
└── README.md        # This file
```

## Core Contexts

-   **`AuthContext.tsx`**: Provides state and functions related to user authentication status. This typically includes:
    -   `isAuthenticated`: Boolean indicating if a user is logged in.
    -   `isLoading`: Boolean indicating if the initial authentication check is in progress.
    -   `login()`, `logout()`, `signup()`, `verifyOtp()`: Functions to manage the authentication lifecycle.
    -   Manages access/refresh tokens internally (via cookies).

-   **`UserContext.tsx`**: Provides state and functions related to the currently authenticated user's profile data. It depends on `AuthContext`.
    -   `user`: Object containing the logged-in user's details (or null).
    -   `isLoadingProfile`: Boolean indicating if the user profile is being fetched.
    -   `fetchUserProfile()`: Function to manually trigger a profile refresh.
    -   Automatically fetches or clears user data based on changes in `AuthContext`'s `isAuthenticated` state.

-   **`ThemeContext.tsx`**: Manages the application's UI theme.
    -   `theme`: Current theme (`'light'` or `'dark'`).
    -   `toggleTheme()`: Function to switch between light and dark mode.
    -   Persists the selected theme to `localStorage`.
    -   Applies the current theme class to the `<html>` element.

## Usage

1.  **Wrap your application (or relevant part) with the Providers:** Providers should be nested correctly, typically in `src/app/layout.tsx` or `src/pages/_app.tsx`.

    ```typescript
    // Example in src/app/layout.tsx
    import { ThemeProvider } from '@/contexts/ThemeContext';
    import { AuthProvider } from '@/contexts/AuthContext';
    import { UserProvider } from '@/contexts/UserContext';

    export default function RootLayout({ children }) {
      return (
        <html lang="en" suppressHydrationWarning>
          <body>
            <ThemeProvider>
              <AuthProvider>
                <UserProvider>
                  {children}
                </UserProvider>
              </AuthProvider>
            </ThemeProvider>
          </body>
        </html>
      );
    }
    ```

2.  **Consume the context in components using the custom hooks:**

    ```typescript
    import React from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useUser } from '@/contexts/UserContext';
    import { useTheme } from '@/contexts/ThemeContext';

    function UserStatus() {
      const { isAuthenticated, isLoading: isLoadingAuth, logout } = useAuth();
      const { user, isLoadingProfile } = useUser();
      const { theme, toggleTheme } = useTheme();

      const isLoading = isLoadingAuth || isLoadingProfile;

      if (isLoading) {
        return <div>Loading...</div>;
      }

      return (
        <div>
          <p>Current Theme: {theme}</p>
          <button onClick={toggleTheme}>Toggle Theme</button>
          {isAuthenticated && user ? (
            <div>Welcome, {user.first_name}! <button onClick={logout}>Logout</button></div>
          ) : (
            <div>Please login.</div>
          )}
        </div>
      );
    }
    ```

## Contribution Guidelines

-   Use Context for state that needs to be accessed by many components at different nesting levels.
-   Keep contexts focused on a specific piece of global state.
-   Provide a custom hook (e.g., `useAuth`, `useUser`, `useTheme`) alongside your context for easier consumption and better encapsulation.
-   Memoize context values (`React.useMemo`) to prevent unnecessary re-renders. 