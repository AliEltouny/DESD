"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCommunity } from "@/hooks/communities";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { communityApi } from "@/services/api";
import { CommunityMember } from "@/types/api";

export default function ManagePendingApprovalsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Local states
  const [pendingRequests, setPendingRequests] = useState<CommunityMember[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [actionErrors, setActionErrors] = useState<Record<number, string>>({});
  const [processingActions, setProcessingActions] = useState<Record<number, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch community data to check permissions
  const { 
    community, 
    loading: isLoadingCommunity, 
    error: communityError,
    refresh: refreshCommunity
  } = useCommunity(slug);
  
  // Combined loading state
  const isLoading = isAuthLoading || isLoadingCommunity || isLoadingRequests;
  
  // Check if user has permission to manage approvals
  const isAdmin = community?.membership_role === 'admin';
  const isModerator = community?.membership_role === 'moderator';
  const hasAccess = isAdmin || isModerator;
  
  // Redirect if not authorized after loading completes
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      // Not authorized, redirect to community page
      router.push(`/communities/${slug}`);
    }
  }, [isLoading, isAuthenticated, hasAccess, router, slug]);
  
  // Fetch pending requests
  const fetchPendingRequests = async () => {
    if (!slug) return;
    
    setIsLoadingRequests(true);
    
    try {
      const response = await communityApi.getPendingRequests(slug);
      setPendingRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };
  
  // Load initial data
  useEffect(() => {
    if (hasAccess && slug) {
      fetchPendingRequests();
    }
  }, [hasAccess, slug]);
  
  // Handle approve request
  const handleApproveRequest = async (userId: number) => {
    setProcessingActions((prev) => ({ ...prev, [userId]: 'approve' }));
    setActionErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[userId];
      return newErrors;
    });
    
    try {
      await communityApi.approveMemberRequest(slug, userId);
      
      // Update local state (remove from pending list)
      setPendingRequests((prev) => prev.filter((request) => request.user.id !== userId));
      
      // Show success message
      setSuccessMessage("Request approved successfully");
      
      // Refresh community data
      await refreshCommunity();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error approving request:", error);
      setActionErrors((prev) => ({
        ...prev,
        [userId]: error instanceof Error ? error.message : "Failed to approve request"
      }));
    } finally {
      setProcessingActions((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };
  
  // Handle reject request
  const handleRejectRequest = async (userId: number) => {
    setProcessingActions((prev) => ({ ...prev, [userId]: 'reject' }));
    setActionErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[userId];
      return newErrors;
    });
    
    try {
      await communityApi.rejectMemberRequest(slug, userId);
      
      // Update local state (remove from pending list)
      setPendingRequests((prev) => prev.filter((request) => request.user.id !== userId));
      
      // Show success message
      setSuccessMessage("Request rejected successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error rejecting request:", error);
      setActionErrors((prev) => ({
        ...prev,
        [userId]: error instanceof Error ? error.message : "Failed to reject request"
      }));
    } finally {
      setProcessingActions((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }
  
  // Show error state
  if (communityError || !community) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <h2 className="text-lg font-medium">Error</h2>
            <p>{communityError || "Failed to load community data"}</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Display unauthorized message if needed
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-6">
            <h2 className="text-lg font-medium">Access Denied</h2>
            <p>You don't have permission to manage member approvals for this community.</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <div className="flex flex-wrap items-center mb-6 text-sm">
          <Link 
            href={`/communities/${slug}`}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Community
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link 
            href={`/communities/${slug}/manage`}
            className="text-blue-600 hover:text-blue-800"
          >
            Manage Community
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-600">Pending Approvals</span>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Join Requests</h1>
          <p className="text-gray-600">
            Review and manage requests from users who want to join your community.
          </p>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* If community does not require approval */}
          {!community.requires_approval && (
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Approval Not Required</h2>
              <p className="text-gray-600 mb-4">
                Your community is currently set to allow members to join without approval.
              </p>
              <Link
                href={`/communities/${slug}/manage/settings`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Change Settings
              </Link>
            </div>
          )}
          
          {/* If no pending requests */}
          {community.requires_approval && pendingRequests.length === 0 && (
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h2>
              <p className="text-gray-600">
                There are currently no pending requests to join this community.
              </p>
            </div>
          )}
          
          {/* Pending requests list */}
          {community.requires_approval && pendingRequests.length > 0 && (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {pendingRequests.length} Pending {pendingRequests.length === 1 ? 'Request' : 'Requests'}
                </h2>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <li key={request.user.id} className="p-6">
                    <div className="flex items-start justify-between flex-wrap md:flex-nowrap gap-4">
                      {/* User Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center mb-2">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium mr-3">
                            {request.user.username?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {request.user.username || 'Anonymous User'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Requested {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Error Message */}
                        {actionErrors[request.user.id] && (
                          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                            {actionErrors[request.user.id]}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(request.user.id)}
                          disabled={!!processingActions[request.user.id]}
                          className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                            processingActions[request.user.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {processingActions[request.user.id] === 'reject' ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Rejecting...
                            </span>
                          ) : (
                            'Reject'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(request.user.id)}
                          disabled={!!processingActions[request.user.id]}
                          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            processingActions[request.user.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {processingActions[request.user.id] === 'approve' ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Approving...
                            </span>
                          ) : (
                            'Approve'
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Tips for managing approvals */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Tips for Managing Community Approvals</h2>
          <ul className="space-y-3 text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Review requests promptly to keep your community active and engaged.</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Consider checking profiles before approving to ensure they fit your community.</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>You can always remove problematic members later if needed.</span>
            </li>
          </ul>
        </div>
        
        {/* Return to management dashboard */}
        <div className="mt-6 text-center">
          <Link 
            href={`/communities/${slug}/manage`}
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-md transition-colors"
          >
            Return to Management Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 