// services/notificationService.ts
import axios, { AxiosError } from 'axios';
import { Notification } from '../types/notification';

const API_URL = '/api/notifications/';

export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Notification fetch error:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message
    });
    throw axiosError;
  }
};

// Update other methods similarly with proper error typing

export const createNotification = async (message: string): Promise<Notification | null> => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(`${API_URL}create/`, { message }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const markAllAsRead = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('access_token');
    await axios.patch(`${API_URL}mark-read/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};

export const markAsRead = async (id: number): Promise<boolean> => {
  try {
    const token = localStorage.getItem('access_token');
    await axios.patch(`${API_URL}${id}/read/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return true;
  } catch (error) {
    console.error('Error marking as read:', error);
    return false;
  }
};