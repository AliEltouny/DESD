/**
 * Defines the structure for a testimonial object.
 */
export interface Testimonial {
  id?: number;
  name: string;
  role: string;
  university: string;
  content: string;
  image?: string; // URL or path
  image_url?: string; // Specifically for absolute URL from API
  isMock?: boolean; // Optional flag for mock data
} 