// components/NotificationBell.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUnreadNotificationsCount } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell: React.FC = () => {
  const { 
    notifications,
    refreshNotifications,
    markAllNotificationsAsRead,
    notificationsLoading: loading,
    notificationsError: error
  } = useAuth();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const displayedNotifications = notifications.slice(0, 5);

  // Update unread count whenever notifications change
  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        // Use both local filter and API count for accuracy
        const localUnread = notifications.filter(n => !n.is_read).length;
        const serverCount = await getUnreadNotificationsCount();
        
        // Prefer server count if available, otherwise fallback to local
        setUnreadCount(serverCount ?? localUnread);
      } catch (err) {
        // Fallback to local count if API fails
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      }
    };

    updateUnreadCount();
  }, [notifications]);

  const handleBellClick = async () => {
    try {
      if (!showDropdown) {
        await refreshNotifications();
      }
      
      setShowDropdown(!showDropdown);
      
      if (unreadCount > 0 && showDropdown) {
        await markAllNotificationsAsRead();
        setUnreadCount(0); // Optimistically update count
      }
    } catch (err) {
      console.error("Error handling notification bell click:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "community_invite":
        return (
          <div className="p-1 rounded-full bg-blue-100 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        );
      case "post_upvote":
        return (
          <div className="p-1 rounded-full bg-green-100 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </div>
        );
      case "comment_reply":
        return (
          <div className="p-1 rounded-full bg-purple-100 text-purple-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-1 rounded-full bg-gray-100 text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="p-2 relative rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Notifications"
        disabled={loading}
        aria-busy={loading}
      >
        <svg
          className={`w-6 h-6 ${loading ? 'text-gray-400' : 'text-gray-600'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
            <div className="flex space-x-2">
              <button 
                onClick={async () => {
                  await markAllNotificationsAsRead();
                  setUnreadCount(0);
                }}
                disabled={unreadCount === 0}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark all as read
              </button>
              <button 
                onClick={() => router.push('/notifications')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <div className="px-4 py-3 text-sm text-red-500">
                Error: {error.message}
              </div>
            ) : loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
            ) : (
              displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => router.push('/notifications')}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>{formatDistanceToNow(new Date(notification.created_at))} ago</span>
                        {!notification.is_read && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 5 && !loading && (
            <div 
              className="px-4 py-2 bg-gray-50 text-center border-t border-gray-200 cursor-pointer hover:bg-gray-100"
              onClick={() => router.push('/notifications')}
            >
              <span className="text-xs font-medium text-blue-600">
                Show {notifications.length - 5} more
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;