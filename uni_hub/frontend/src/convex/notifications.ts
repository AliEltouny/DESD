import axios from "axios";

export const getNotifications = async () => {
    const response = await axios.get("/api/notifications");
    return response.data;
};

export const markNotificationAsRead = async (id: string) => {
    await axios.patch(`/api/notifications/${id}/mark-as-read`);
};

export const markAllNotificationsAsRead = async () => {
    await axios.patch("/api/notifications/mark-all-as-read");
};

export const createNotification = async (text: string) => {
    const response = await axios.post("/api/notifications/", { text });
    return response.data;
};