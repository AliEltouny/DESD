export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  category: string;
  tags?: string;
  image?: string | null;
  banner?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  creator?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  rules?: string;
  is_private: boolean;
  requires_approval: boolean;
  member_count?: number;
  post_count?: number;
  is_member?: boolean;
  is_moderator?: boolean;
  is_admin?: boolean;
  membership_status?: string | null;
  membership_role?: string | null;
  created_at: string;
  updated_at: string;
  admins?: { id: number; username: string; full_name?: string }[];
  posts?: { id: number; title: string }[]; // Using a simplified Post type
  recent_posts?: { id: number; title: string }[]; // For compatibility with CommunityDetail
}

export interface CommunityFormData {
  name: string;
  description: string;
  short_description?: string;
  category: string;
  tags?: string;
  image?: File | null;
  banner?: File | null;
  rules?: string;
  is_private: boolean;
  requires_approval: boolean;
}
