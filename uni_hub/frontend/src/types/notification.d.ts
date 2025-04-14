// notification.d.ts

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
  content_object?: any;
}