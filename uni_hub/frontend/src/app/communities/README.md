# Communities Feature (`/communities`)

This directory contains all frontend code related to the Communities feature in Uni Hub, leveraging the Next.js App Router.

## Overview

The communities feature allows users to:
*   Discover and browse existing communities (`/communities`).
*   View detailed information, posts, and interact within a specific community (`/communities/[slug]`).
*   Create new communities (`/communities/create`).

## Folder Structure

```
communities/
├── [slug]/             # Dynamic route for individual community pages
│   └── page.tsx        # Renders the main content for /communities/[slug]
├── create/             # Route for the community creation form
│   └── page.tsx        # Renders the form at /communities/create
├── README.md           # This file
└── page.tsx            # Renders the main community listing at /communities
```

*   **`page.tsx`**: Displays the main list of communities, allowing users to browse and navigate to individual community pages or the creation page.
*   **`create/page.tsx`**: Contains the `CreateCommunityForm` component and handles the logic for creating a new community.
*   **`[slug]/page.tsx`**: The core page for viewing a specific community. It fetches community data and posts based on the `slug` parameter and renders various sub-components to display this information.

## Key Components

The following are some of the important components used within this feature (located in `src/components/communities/`):

*   `CommunityCard.tsx`: Displays a summary of a community (used in `communities/page.tsx`).
*   `CreateCommunityForm.tsx`: The form used in `communities/create/page.tsx`.
*   `CommunityHeader.tsx`: Displays the banner, image, name, and actions (like join/leave) for a specific community page.
*   `CommunityTabs.tsx`: Handles navigation between different sections (Posts, Members, About) on a community page.
*   `CommunityPostsFeed.tsx`: Displays the list of posts within a community, including filtering and search options.
*   `CreatePostForm.tsx`: A mini-form embedded in the post feed for quickly creating a new post.
*   `PostCard.tsx`: Renders an individual post within the feed.
*   `CommunitySidebar.tsx`: Displays contextual information like community rules, moderators, or related communities.

## Routing

*   `/communities` maps to `communities/page.tsx`.
*   `/communities/create` maps to `communities/create/page.tsx`.
*   `/communities/:slug` (e.g., `/communities/cadsc`) maps to `communities/[slug]/page.tsx`.

## Data Fetching

Data is primarily fetched using custom hooks defined in `src/hooks/useCommunities.ts`:

*   `useCommunities`: Fetches a list of communities, optionally with filters.
*   `useCommunity`: Fetches details for a specific community by slug.
*   `useCommunityPosts`: Fetches posts for a specific community by slug, optionally with filters.
*   `useCommunityMembers`: Fetches members for a specific community by slug.
*   `useCreateCommunity`: Provides a function to create a new community.

These hooks typically utilize an underlying `useApi` hook which likely handles caching, error handling, and communication with the backend API services (`communityApi`, `postApi`).

## Potential Improvements & TODOs

*   Implement missing functionality marked with `// TODO:` comments (membership status checks, join/leave actions, post filtering/searching, upvoting).
*   Create dedicated hooks for specific actions if needed (e.g., `useJoinCommunity`, `useMembershipStatus`).
*   Optimize prop drilling further, potentially by using context where appropriate or refining component responsibilities.
*   Enhance loading states (e.g., use skeleton loaders within `CommunityPostsFeed`).
*   Improve user feedback for errors and actions (e.g., using toasts/notifications).
*   Ensure comprehensive test coverage. 