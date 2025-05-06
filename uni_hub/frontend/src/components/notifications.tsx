'use client';

import { useState, useEffect } from "react";
import axios from "axios"; // Added axios import
import { Popover } from "./ui/popover";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Separator } from "@radix-ui/react-separator";
import { ScrollArea } from "./ui/scroll-area";
import { timeAgo } from "@/lib/utils";
import { NotificationsBell } from "./NotificationsBell";

type Notification = {
    id: string;
    text: string;
    created_at: string;
};

export function Notifications({ onNotificationsChange }: { onNotificationsChange: (hasNewNotifications: boolean) => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data } = await axios.get("/api/notifications");
            setNotifications(data);
            onNotificationsChange(data.length > 0); // Update notification bell state
        };
        fetchNotifications();
    }, [onNotificationsChange]);

    const handleMarkAsRead = async (id: string) => {
        await axios.patch(`/api/notifications/${id}/mark-as-read`);
        const updatedNotifications = notifications.filter((n) => n.id !== id);
        setNotifications(updatedNotifications);
        onNotificationsChange(updatedNotifications.length > 0); // Update notification bell state
    };

    const handleMarkAllAsRead = async () => {
        await axios.patch("/api/notifications/mark-all-as-read");
        setNotifications([]);
        onNotificationsChange(false); // Update notification bell state
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <NotificationsBell hasNewNotifications={notifications.length > 0} />
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 bg-white shadow-lg rounded-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Notifications</h3>
                    {notifications.length > 0 && (
                        <button
                            className="text-sm text-gray-700 hover:text-gray-900"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <Separator className="mb-4" />
                <ScrollArea className="max-h-64">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="flex justify-between items-center mb-3 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                <div>
                                    <p className="text-sm font-medium">{notification.text}</p>
                                    <p className="text-xs text-gray-500">{timeAgo(new Date(notification.created_at).getTime())}</p>
                                </div>
                                <button
                                    className="text-sm text-gray-700 hover:text-gray-900"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    ✓
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">You have no unread notifications.</p>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}