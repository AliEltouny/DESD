export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_of_birth?: string;
  academic_year?: number;
  // Add profile-specific fields that might be missing
  full_name?: string; // Derived in backend, but might be useful here?
  // Add any other fields expected by UserProfile type if needed
}

// Define UserProfile separately or combine if identical
export interface UserProfile extends User {
  // Add any additional fields specific to the profile view/update 
  // Example:
  bio?: string;
  avatar_url?: string;
} 