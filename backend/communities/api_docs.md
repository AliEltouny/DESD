# Communities API Documentation

This document provides details about the API endpoints available in the Communities module of Uni Hub.

## Authentication

All protected endpoints require a JWT token which can be obtained through the `/api/token/` endpoint.

Include the token in the Authorization header as follows:
```
Authorization: Bearer <access_token>
```

## Communities

### List Communities

**GET** `/api/communities`

Retrieves a list of available communities.

**Query Parameters:**
- `category` - Filter by category (academic, social, sports, etc.)
- `search` - Search in name, description, and tags
- `tag` - Filter by specific tag
- `member_of` - If "true", shows only communities the user is a member of
- `order_by` - Sort by: "created_at" (default), "name", "member_count"

**Response:**
```json
[
  {
    "id": 1,
    "name": "Computer Science Club",
    "slug": "computer-science-club",
    "description": "A club for CS students",
    "short_description": "CS students community",
    "category": "academic",
    "tags": "coding,programming,cs",
    "image": "http://example.com/media/communities/images/cs_club.jpg",
    "banner": "http://example.com/media/communities/banners/cs_banner.jpg",
    "creator": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe"
    },
    "rules": "Be respectful to all members",
    "is_private": false,
    "requires_approval": false,
    "member_count": 45,
    "post_count": 23,
    "is_member": true,
    "membership_status": "approved",
    "membership_role": "member",
    "created_at": "2023-07-15T10:30:45Z",
    "updated_at": "2023-09-20T15:20:12Z"
  }
]
```

### Get Community Details

**GET** `/api/communities/{slug}`

Retrieves detailed information about a specific community.

**Response:**
```json
{
  "id": 1,
  "name": "Computer Science Club",
  "slug": "computer-science-club",
  "description": "A club for CS students",
  "short_description": "CS students community",
  "category": "academic",
  "tags": "coding,programming,cs",
  "image": "http://example.com/media/communities/images/cs_club.jpg",
  "banner": "http://example.com/media/communities/banners/cs_banner.jpg",
  "creator": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "rules": "Be respectful to all members",
  "is_private": false,
  "requires_approval": false,
  "member_count": 45,
  "post_count": 23,
  "is_member": true,
  "membership_status": "approved",
  "membership_role": "member",
  "created_at": "2023-07-15T10:30:45Z",
  "updated_at": "2023-09-20T15:20:12Z",
  "recent_posts": [
    {
      "id": 5,
      "title": "Welcome to our club!",
      "content": "Hello everyone...",
      "author": {
        "id": 2,
        "username": "johndoe",
        "email": "john@example.com",
        "full_name": "John Doe"
      },
      "post_type": "announcement",
      "is_pinned": true,
      "created_at": "2023-09-10T08:15:30Z"
    }
  ],
  "admins": [
    {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe"
    }
  ]
}
```

### Create Community

**POST** `/api/communities`

Creates a new community.

**Request Body:**
```json
{
  "name": "New Club",
  "description": "This is a new club",
  "short_description": "New club for students",
  "category": "social",
  "tags": "fun,social,club",
  "is_private": false,
  "requires_approval": false,
  "rules": "Be kind and respectful"
}
```

**Response:**
```json
{
  "id": 10,
  "name": "New Club",
  "slug": "new-club",
  "description": "This is a new club",
  "short_description": "New club for students",
  "category": "social",
  "tags": "fun,social,club",
  "image": null,
  "banner": null,
  "creator": {
    "id": 3,
    "username": "janesmith",
    "email": "jane@example.com",
    "full_name": "Jane Smith"
  },
  "rules": "Be kind and respectful",
  "is_private": false,
  "requires_approval": false,
  "member_count": 1,
  "post_count": 0,
  "is_member": true,
  "membership_status": "approved",
  "membership_role": "admin",
  "created_at": "2023-10-05T14:20:30Z",
  "updated_at": "2023-10-05T14:20:30Z"
}
```

### Join Community

**POST** `/api/communities/{slug}/join`

Join a community.

**Response:**
```json
{
  "detail": "You have successfully joined this community."
}
```

### Leave Community

**POST** `/api/communities/{slug}/leave`

Leave a community.

**Response:**
```json
{
  "detail": "You have successfully left this community."
}
```

### List Community Members

**GET** `/api/communities/{slug}/members`

Get a list of members in a community.

**Query Parameters:**
- `role` - Filter by role: "admin", "moderator", "member"

**Response:**
```json
[
  {
    "id": 5,
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe"
    },
    "community": 1,
    "role": "admin",
    "status": "approved",
    "joined_at": "2023-08-10T09:45:20Z"
  }
]
```

### Invite User

**POST** `/api/communities/{slug}/invite`

Invite a user to join the community.

**Request Body:**
```json
{
  "invitee_email": "user@example.com",
  "message": "Hey, join our community!"
}
```

**Response:**
```json
{
  "detail": "Invitation sent successfully."
}
```

### Update Member Role

**PUT** `/api/communities/{slug}/update_member_role`

Update a member's role in the community.

**Request Body:**
```json
{
  "user_id": 4,
  "role": "moderator"
}
```

**Response:**
```json
{
  "detail": "User role updated to moderator."
}
```

### Approve Membership

**PUT** `/api/communities/{slug}/approve_membership`

Approve or reject a pending membership request.

**Request Body:**
```json
{
  "user_id": 5,
  "approve": true
}
```

**Response:**
```json
{
  "detail": "Membership request approved."
}
```

## Posts

### List Posts

**GET** `/api/communities/{slug}/posts`

Get a list of posts in a community.

**Query Parameters:**
- `type` - Filter by post type: "discussion", "question", "event", "announcement", "resource", "other"
- `search` - Search in title and content

**Response:**
```json
[
  {
    "id": 5,
    "title": "Welcome to our club!",
    "content": "Hello everyone and welcome to our community...",
    "community": 1,
    "author": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe"
    },
    "post_type": "announcement",
    "event_date": null,
    "event_location": "",
    "image": null,
    "file": null,
    "is_pinned": true,
    "upvote_count": 12,
    "has_upvoted": true,
    "comment_count": 5,
    "created_at": "2023-09-10T08:15:30Z",
    "updated_at": "2023-09-10T08:15:30Z"
  }
]
```

### Get Post Details

**GET** `/api/communities/{slug}/posts/{id}`

Get detailed information about a post.

**Response:**
```json
{
  "id": 5,
  "title": "Welcome to our club!",
  "content": "Hello everyone and welcome to our community...",
  "community": 1,
  "author": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "post_type": "announcement",
  "event_date": null,
  "event_location": "",
  "image": null,
  "file": null,
  "is_pinned": true,
  "upvote_count": 12,
  "has_upvoted": true,
  "comment_count": 5,
  "created_at": "2023-09-10T08:15:30Z",
  "updated_at": "2023-09-10T08:15:30Z",
  "comments": [
    {
      "id": 3,
      "post": 5,
      "author": {
        "id": 3,
        "username": "janesmith",
        "email": "jane@example.com",
        "full_name": "Jane Smith"
      },
      "content": "Welcome! I'm excited to be here.",
      "parent": null,
      "upvote_count": 2,
      "has_upvoted": false,
      "reply_count": 1,
      "created_at": "2023-09-11T10:30:15Z",
      "updated_at": "2023-09-11T10:30:15Z"
    }
  ]
}
```

### Create Post

**POST** `/api/communities/{slug}/posts`

Create a new post in a community.

**Request Body:**
```json
{
  "title": "New Announcement",
  "content": "This is a new announcement for our community.",
  "post_type": "announcement",
  "event_date": null,
  "event_location": null,
  "is_pinned": false
}
```

**Response:**
```json
{
  "id": 10,
  "title": "New Announcement",
  "content": "This is a new announcement for our community.",
  "community": 1,
  "author": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "post_type": "announcement",
  "event_date": null,
  "event_location": null,
  "image": null,
  "file": null,
  "is_pinned": false,
  "upvote_count": 0,
  "has_upvoted": false,
  "comment_count": 0,
  "created_at": "2023-10-05T15:45:30Z",
  "updated_at": "2023-10-05T15:45:30Z"
}
```

### Upvote Post

**POST** `/api/communities/{slug}/posts/{id}/upvote`

Upvote or remove upvote from a post.

**Response:**
```json
{
  "detail": "Post upvoted."
}
```

### Toggle Pin

**POST** `/api/communities/{slug}/posts/{id}/toggle_pin`

Pin or unpin a post.

**Response:**
```json
{
  "detail": "Post pinned."
}
```

## Comments

### List Comments

**GET** `/api/communities/{slug}/posts/{post_id}/comments`

Get a list of comments on a post.

**Query Parameters:**
- `parent` - ID of parent comment to get replies

**Response:**
```json
[
  {
    "id": 3,
    "post": 5,
    "author": {
      "id": 3,
      "username": "janesmith",
      "email": "jane@example.com",
      "full_name": "Jane Smith"
    },
    "content": "Welcome! I'm excited to be here.",
    "parent": null,
    "upvote_count": 2,
    "has_upvoted": false,
    "reply_count": 1,
    "created_at": "2023-09-11T10:30:15Z",
    "updated_at": "2023-09-11T10:30:15Z"
  }
]
```

### Create Comment

**POST** `/api/communities/{slug}/posts/{post_id}/comments`

Create a new comment on a post.

**Request Body:**
```json
{
  "content": "This is my comment on this post.",
  "parent": null
}
```

**Response:**
```json
{
  "id": 12,
  "post": 5,
  "author": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "content": "This is my comment on this post.",
  "parent": null,
  "upvote_count": 0,
  "has_upvoted": false,
  "reply_count": 0,
  "created_at": "2023-10-05T16:20:45Z",
  "updated_at": "2023-10-05T16:20:45Z"
}
```

### Create Reply

**POST** `/api/communities/{slug}/posts/{post_id}/comments`

Create a reply to an existing comment.

**Request Body:**
```json
{
  "content": "This is my reply to your comment.",
  "parent": 3
}
```

**Response:**
```json
{
  "id": 13,
  "post": 5,
  "author": {
    "id": 2,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "content": "This is my reply to your comment.",
  "parent": 3,
  "upvote_count": 0,
  "has_upvoted": false,
  "reply_count": 0,
  "created_at": "2023-10-05T16:25:10Z",
  "updated_at": "2023-10-05T16:25:10Z"
}
```

### Upvote Comment

**POST** `/api/communities/{slug}/posts/{post_id}/comments/{id}/upvote`

Upvote or remove upvote from a comment.

**Response:**
```json
{
  "detail": "Comment upvoted."
}
``` 