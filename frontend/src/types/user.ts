export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_of_birth?: string;
  academic_year?: number;
  address?: string;
  post_code?: string;
  study_program?: string;
  interests?: string;
  bio?: string;
  profile_picture?: string;
  rewards?: Record<string, any>;
  achievements?: Record<string, boolean>;
  full_name?: string; // Derived in backend, but might be useful here
}

// Define UserProfile separately or combine if identical
export interface UserProfile extends User {
  // Additional fields specific to profile update requests can go here if needed
}