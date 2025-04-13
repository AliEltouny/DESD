// notification.d.ts

export interface Notification {
  id: number;
  user_email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}