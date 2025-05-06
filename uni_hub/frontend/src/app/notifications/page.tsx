"use client";

import { Notifications } from "@/components/notifications";
import Link from 'next/link';
import Button from "@/components/ui/Button";
import axios from "axios";
import { useState } from "react";

export default function NotificationsPage() {
    const [hasNewNotifications, setHasNewNotifications] = useState(false);

    const refreshNotifications = () => {
        setHasNewNotifications((prev) => !prev); // Toggle state to trigger re-fetch
    };

    const handleNotificationsChange = (hasNew: boolean) => {
        setHasNewNotifications(hasNew);
    };

    const createNotification = async (text: string) => {
        try {
            await axios.post("/api/notifications/", { text }); // Updated to use Django API
            refreshNotifications(); // Refresh notifications after creating a new one
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <header className="h-16 bg-gray-100 shadow-md flex items-center px-4">
                <nav className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <h1 className="text-2xl font-bold text-black">Notifications</h1>
                        </Link>
                    </div>
                </nav>
            </header>
            <main className="mt-8 flex flex-col items-center">
                <div className="flex flex-row justify-between gap-8 w-full max-w-4xl">
                    <div className="flex flex-col items-center gap-4 w-1/2">
                        <h1 className="text-lg font-semibold mb-4 text-black">Create Notifications</h1>
                        <Button
                            onClick={() => createNotification("Your post was commented on!")}
                            className="w-2/3 text-sm bg-black text-white hover:bg-gray-800"
                        >
                            New Comment on Post
                        </Button>
                        <Button
                            onClick={() => createNotification("Your post was liked!")}
                            className="w-2/3 text-sm bg-black text-white hover:bg-gray-800"
                        >
                            New Like on Post
                        </Button>
                        <Button
                            onClick={() => createNotification("Your post was shared!")}
                            className="w-2/3 text-sm bg-black text-white hover:bg-gray-800"
                        >
                            New Share on Post
                        </Button>
                    </div>
                    <div className="bg-white shadow-md rounded-md p-4 w-1/2">
                        <h2 className="text-lg font-bold mb-4 text-black">Your Notifications</h2>
                        <Notifications onNotificationsChange={handleNotificationsChange} />
                    </div>
                </div>
            </main>
        </div>
    );
}