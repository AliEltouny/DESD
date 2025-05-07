"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import { baseApi } from "@/services/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await baseApi.post("/password-reset/request", { email });
      setSuccess(true);
      // Scroll to top on success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Password reset request error:", err);
      let message = "Failed to process your request. Please try again.";
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as { message: string }).message || message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Your Password">
      <div className="w-full max-w-md mx-auto">
        {success ? (
          <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-100 shadow-md animate-fadeIn">
            <svg
              className="w-20 h-20 text-blue-500 mx-auto mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Check Your Email
            </h3>
            <p className="text-gray-600 mb-4 text-lg">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions to reset your
              password.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you don&apos;t see the email, check your spam folder.
            </p>
            <Button 
              onClick={() => router.push("/login")}
              className="w-full py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02]"
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Reset Your Password
            </h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Forgot Your Password?
              </h3>
              <p className="text-gray-600">
                Enter your email address below, and we&apos;ll send you a link to reset your password.
              </p>
            </div>
            
            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md border border-red-200 animate-fadeIn flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  placeholder="your.email@university.edu"
                />
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                className="w-full py-3 text-base font-medium"
              >
                Send Reset Link
              </Button>
              
              <div className="text-center mt-6">
                <Link 
                  href="/login"
                  className="inline-flex items-center text-blue-600 hover:text-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 