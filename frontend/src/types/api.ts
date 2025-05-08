/**
 * TypeScript interfaces for API requests and responses
 */
import { Community } from './community';

// Generic pagination response type
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Filter and sorting parameters
export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

// Community-related request types
export interface CommunityFilters extends QueryParams {
  category?: string;
  search?: string;
  tag?: string;
  member_of?: boolean;
  order_by?: 'created_at' | 'name' | 'member_count';
}

export interface PostFilters extends QueryParams {
  post_type?: string;
  search?: string;
  order_by?: 'created_at' | 'upvote_count' | 'comment_count';
  author?: number;
  is_pinned?: boolean;
}

export interface CommentFilters extends QueryParams {
  parent?: number;
}

export interface MembershipFilters extends QueryParams {
  role?: 'admin' | 'moderator' | 'member';
  status?: 'approved' | 'pending';
}

// Invitation request
export interface InvitationRequest {
  email: string;
  message?: string;
}

// Create/update community form data
export interface CommunityFormRequest {
  name: string;
  description: string;
  category: string;
  is_private?: boolean;
  requires_approval?: boolean;
  tags?: string;
  image?: File;
  banner?: File;
}

// Create/update post form data
export interface PostFormRequest {
  title: string;
  content: string;
  post_type: string;
  event_date?: string;
  event_location?: string;
  image?: File;
  file?: File;
}

// Comment form data
export interface CommentFormRequest {
  content: string;
  parent?: number;
}

// Membership role update request
export interface MembershipRoleRequest {
  user_id: number;
  role: 'admin' | 'moderator' | 'member';
}

// Membership approval request
export interface MembershipApprovalRequest {
  user_id: number;
  approve: boolean;
}

// Common API responses
export interface ApiSuccessResponse {
  detail: string;
}

export interface ApiErrorResponse {
  detail?: string;
  [key: string]: unknown;
}

// Types moved from communityService.ts to avoid circular dependencies

export interface CommunityDetail extends Community {
  recent_posts: Post[];
  admins: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  }[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  community: number;
  author: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  post_type: string;
  event_date: string | null;
  event_location: string | null;
  image: string | null;
  file: string | null;
  is_pinned: boolean;
  upvote_count: number;
  has_upvoted: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Event participation fields
  event_participant_limit?: number | null;
  participant_count?: number;
  has_joined?: boolean;
  is_full?: boolean;
}

// Use Omit to exclude the incompatible 'community' property from Post
export interface PostDetail extends Omit<Post, 'community'> {
  // Redefine community with the correct object type
  community: {
    id: number;
    name: string;
    slug: string;
  };
  comments: Comment[];
}

export interface Comment {
  id: number;
  post: number;
  author: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  content: string;
  parent: number | null;
  upvotes: number[];
  upvote_count: number;
  has_upvoted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  community: number;
  role: string;
  status: string;
  joined_at: string;
}

export interface CommunityInvitation {
  id: number;
  community: number;
  community_name: string;
  inviter: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  invitee_email: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}