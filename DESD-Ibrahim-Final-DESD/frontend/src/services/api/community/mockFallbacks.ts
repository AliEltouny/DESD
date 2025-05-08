/**
 * Mock fallbacks for community API when the backend is offline
 * This allows minimal functionality during backend outages
 * IMPORTANT: These are only fallbacks - the system should always try to use the Django backend first
 */

import { MembershipStatus, ApiSuccessResponse } from '@/types/api';

// Store mock membership states locally during a session
const sessionMemberships = new Map<string, MembershipStatus>();

/**
 * Mock membership status service for when the backend is offline
 * @param slug Community slug
 * @returns Mock membership status
 */
export const mockMembershipStatus = (slug: string): MembershipStatus => {
  // Check if we have a stored mock state for this community
  if (sessionMemberships.has(slug)) {
    return sessionMemberships.get(slug)!;
  }
  
  // Default to not a member
  return { is_member: false, status: null, role: null };
};

/**
 * Mock join community service for when the backend is offline
 * @param slug Community slug
 * @returns Mock success response
 */
export const mockJoinCommunity = (slug: string): ApiSuccessResponse => {
  // Store in session map for this community
  const membershipStatus: MembershipStatus = {
    is_member: true,
    status: 'approved',
    role: 'member'
  };
  
  sessionMemberships.set(slug, membershipStatus);
  
  return {
    detail: "[MOCK] You have successfully joined this community. Note: This is simulated as the Django backend is unreachable.",
    success: true
  };
};

/**
 * Mock leave community service for when the backend is offline
 * @param slug Community slug
 * @returns Mock success response
 */
export const mockLeaveCommunity = (slug: string): ApiSuccessResponse => {
  // Update session map
  const membershipStatus: MembershipStatus = {
    is_member: false,
    status: null,
    role: null
  };
  
  sessionMemberships.set(slug, membershipStatus);
  
  return {
    detail: "[MOCK] You have successfully left this community. Note: This is simulated as the Django backend is unreachable.",
    success: true
  };
};

/**
 * Function to determine if the backend is unreachable
 * Strict criteria to only enable mock services when Django is definitely unreachable
 * @returns Boolean indicating if we should use mock services
 */
export const shouldUseMockServices = (): boolean => {
  // Check for admin override (for development/testing only)
  const adminOverride = localStorage.getItem('use_mock_services') === 'true';
  
  // Check for repeated Django connection failures (indicator that backend is down)
  const recentApiErrors = sessionStorage.getItem('recent_api_errors');
  const highErrorRate = recentApiErrors && parseInt(recentApiErrors, 10) > 5; // Require more errors before fallback
  
  // Check if we've verified backend is unreachable
  const backendUnreachable = sessionStorage.getItem('backend_unreachable') === 'true';
  
  // Only use mocks if backend is definitely unreachable
  return (adminOverride || highErrorRate || backendUnreachable);
};

/**
 * Records a Django API error to help detect when backend is unreachable
 */
export const recordApiError = (error: any): void => {
  try {
    // Increment error count
    const currentCount = parseInt(sessionStorage.getItem('recent_api_errors') || '0', 10);
    const newCount = currentCount + 1;
    sessionStorage.setItem('recent_api_errors', newCount.toString());
    
    // If error is network-related, mark backend as potentially unreachable
    const isNetworkError = !error.response || 
                          error.code === 'ECONNABORTED' || 
                          error.code === 'ERR_NETWORK' || 
                          (error.message && error.message.includes('Network Error'));
                          
    if (isNetworkError && newCount > 3) {
      sessionStorage.setItem('backend_unreachable', 'true');
      console.warn('Django backend appears to be unreachable - some features will use fallbacks');
    }
  } catch (e) {
    // Ignore errors in error handling
    console.warn('Error while recording API error:', e);
  }
};

/**
 * Records a successful Django API call to reset error tracking
 */
export const recordApiSuccess = (): void => {
  try {
    // Reset error count and backend status on success
    sessionStorage.setItem('recent_api_errors', '0');
    sessionStorage.setItem('backend_unreachable', 'false');
  } catch (e) {
    // Ignore errors in success handling
    console.warn('Error while recording API success:', e);
  }
}; 