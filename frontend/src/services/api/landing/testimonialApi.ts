import api from '../apiClient';
import { handleApiError } from '../../utils/errorHandling';
import { Testimonial } from '@/types/testimonial'; // Import Testimonial type

// Define a type for the testimonial data payload
interface TestimonialPayload {
  name: string;
  role: string;
  text: string;
  image?: File | string; // Allow File for upload, string for URL
}

/**
 * Testimonial API - Handles all testimonial-related API operations
 */
class TestimonialAPI {
  /**
   * Get testimonials with optional filtering
   */
  async getTestimonials(limit?: number): Promise<Testimonial[]> {
    try {
      const response = await api.get('/api/testimonials/', {
        params: limit ? { limit } : {},
      });
      return response.data.results || response.data;
    } catch (error) {
      return handleApiError<Testimonial[]>(error, "fetching testimonials", { fallbackValue: [] });
    }
  }

  /**
   * Add a new testimonial
   */
  async addTestimonial(data: TestimonialPayload): Promise<Testimonial> {
    try {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await api.post('/api/testimonials/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      return handleApiError<Testimonial>(error, "adding testimonial", {
        rethrow: true,
        defaultMessage: "Failed to add testimonial. Please try again."
      });
    }
  }
}

// Export a singleton instance
export const testimonialApi = new TestimonialAPI();

// Export as default for backwards compatibility
export default testimonialApi;