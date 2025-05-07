export interface Event {
  id: number;
  title: string;
  description: string;
  image: string | null;
  date_time: string;
  location: string;
  participant_limit: number | null;
  participant_count: number;
  is_full: boolean;
  is_private: boolean;
  is_canceled: boolean;
  created_by: {
    id: number;
    username: string;
    // Add other user fields you have
  };
  community: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}