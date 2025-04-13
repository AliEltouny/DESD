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
  membership_status?: string | null;
  membership_role?: string | null;
  created_at: string;
  updated_at: string;
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
