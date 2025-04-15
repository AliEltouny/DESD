import api from '../apiClient';
import { handleApiError } from '../errorHandling';

/**
 * Testimonial API - Handles all testimonial-related API operations
 */
class TestimonialAPI {
  /**
   * Get testimonials with optional filtering
   */
  async getTestimonials() {
    try {
      const response = await api.get('/testimonials/');
      return response.data;
    } catch (error) {
      return handleApiError(error, "fetching testimonials", {
        fallbackValue: { count: 0, results: [] },
        rethrow: false
      });
    }
  }

  /**
   * Add a new testimonial
   */
  async addTestimonial(data) {
    try {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "image" && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.post('/testimonials/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error, "adding testimonial", {
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