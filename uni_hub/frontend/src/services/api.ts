/**
 * @deprecated - This file is deprecated and will be removed in a future version.
 * Please import from '@/services/apiClient' instead.
 * 
 * This file remains for backward compatibility to avoid breaking imports during transition.
 * 
 * TODO: DELETE THIS FILE and update imports in components to use apiClient directly.
 */

import api, { API_URL, getMediaUrl } from './apiClient';

// Re-export everything from apiClient
export { API_URL, getMediaUrl };
export default api;
