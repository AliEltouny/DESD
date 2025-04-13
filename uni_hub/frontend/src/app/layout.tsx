import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uni Hub - University Students Platform",
  description: "Platform for university students to manage profiles, communities, and events",
};

// Custom error fallback component
const ErrorFallback = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-700 mb-2">
          {error.message || "An unexpected error occurred"}
        </p>
        {error.stack && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mb-4 max-h-40">
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap children with both providers */}
        <AuthProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
