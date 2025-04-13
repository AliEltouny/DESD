"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NotificationsPage = () => {
  const { 
    notifications, 
    refreshNotifications, 
    markNotificationAsRead, 
    notificationsLoading,
    notificationsError: error,
    isLoading,
    isAuthenticated
  } = useAuth();
  
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        await refreshNotifications();
      } catch (error) {
        console.error("Notification load error:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id: number) => {
    await markNotificationAsRead(id);
  };

  if (localLoading || isLoading || notificationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      
      {error ? (
        <div className="text-center text-red-500 p-4">Error: {error.message}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-500 p-8">You have no notifications</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                notification.is_read ? "bg-gray-50" : "bg-white border-blue-200"
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <p className="text-gray-700">{notification.message}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {notification.user_email}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;