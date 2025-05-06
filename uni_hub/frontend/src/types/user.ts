export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  academic_year?: string;
  bio?: string; // Added bio field
  address?: string; // Added address field
  phone?: string; // Added phone field
  full_name?: string; // Derived in backend, but might be useful here?
  interests?: string; // Added interests field
  postal_code?: string; // Added postal_code field
  profile_photo?: string; // Added profile_photo field
}

export interface UserProfile extends User {
  avatar_url?: string;
  profile_photo?: string; // Added profile_photo field
  interests?: string; // Added interests field
  postal_code?: string; // Added postal_code field
}