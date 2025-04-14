// services/notificationService.ts
import { API_URL } from "./api";

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  content_object?: any; // This will be the related object (community, post, etc.)
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await fetch(`${API_URL}/notifications/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/notifications/unread/count/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch unread notifications count");
  }
  const data = await response.json();
  return data.count;
};

export const markSingleNotificationAsRead = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/notifications/${id}/mark_as_read/`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/notifications/mark_all_as_read/`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
};

export const updateNotificationPreferences = async (
  preferences: Partial<{
    community_invites: boolean;
    community_join_requests: boolean;
    community_updates: boolean;
    community_new_posts: boolean;
    community_post_updates: boolean;
    post_upvotes: boolean;
    comment_upvotes: boolean;
    comment_replies: boolean;
    mention_notifications: boolean;
    email_community_invites: boolean;
    email_community_updates: boolean;
    email_engagement: boolean;
    push_notifications: boolean;
  }>
): Promise<void> => {
  const response = await fetch(`${API_URL}/notification-preferences/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update notification preferences");
  }
};

export const getNotificationPreferences = async (): Promise<any> => {
  const response = await fetch(`${API_URL}/notification-preferences/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notification preferences");
  }
  return response.json();
};