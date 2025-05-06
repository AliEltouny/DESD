/**
 * API client index - exports all API services for convenience
 */

// Base API and utilities
export { default as baseApi, API_URL, getMediaUrl } from './apiClient';

// Export all API services from their new subfolders
export * from './auth/authApi';
export * from './user/userApi';
export * from './community/communityApi';
export * from './community/postApi';
export * from './landing/testimonialApi';

// Export types (assuming they are in @/types/api)
export * from '@/types/api'; 