/**
 * Main services index file
 * Centralizes all API and service exports
 */

// Base API utilities
export { default as api, API_URL, getMediaUrl } from './apiClient';
export { handleApiError, processApiResponse } from './errorHandling';
export { memoryCache, localStorageCache, initializeCacheCleanup } from './cacheManager';

// API modules (preferred way to access APIs)
export { communityApi } from './api/communityApi';
export { authApi } from './api/authApi';
export { userApi } from './api/userApi';
export { postApi } from './api/postApi';
export { testimonialApi } from './api/testimonialApi';

// Legacy exports (deprecated, but maintained for backward compatibility)
export * from './api/index';

// Re-export type definitions
export * from '@/types/api';