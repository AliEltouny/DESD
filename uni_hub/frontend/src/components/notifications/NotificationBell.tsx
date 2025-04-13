'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const NotificationBell: React.FC = () => {
  const { 
    notifications,
    refreshNotifications,
    markAllNotificationsAsRead,
    notificationsLoading: loading,
    notificationsError: error
  } = useAuth();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayedNotifications = notifications.slice(0, 5);

  const handleBellClick = async () => {
    if (!showDropdown) {
      await refreshNotifications();
    }
    setShowDropdown(!showDropdown);
    
    if (unreadCount > 0) {
      await markAllNotificationsAsRead();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) + ' • ' + date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="p-2 relative rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Notifications"
        disabled={loading}
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
            <button 
              onClick={() => router.push('/notifications')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
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
                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {notification.user_email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.created_at)}
                    </span>
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