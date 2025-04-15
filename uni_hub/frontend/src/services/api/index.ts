/**
 * API client index - exports all API services for convenience
 */

// Base API and utilities
export { default as baseApi, API_URL } from '../apiClient';

// Export all API services
export { default as communityApi } from './communityApi';
export { default as postApi } from './postApi';
export { default as userApi } from './userApi';
export { default as authApi } from './authApi';
export { default as testimonialApi } from './testimonialApi';

// Export types
export * from '@/types/api'; 