"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { baseApi } from "@/services/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    // Check if we have the required parameters
    if (!uid || !token) {
      setInvalidLink(true);
    }
  }, [uid, token]);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      return;
    }

    // Removed unused strength variable and calculation
    // let strength = 0;
    // // Length check
    // if (newPassword.length >= 8) strength += 1;
    // if (newPassword.length >= 12) strength += 1;
    // // Complexity checks
    // if (/[A-Z]/.test(newPassword)) strength += 1;
    // if (/[a-z]/.test(newPassword)) strength += 1;
    // if (/[0-9]/.test(newPassword)) strength += 1;
    // if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    
    // Scale to 0-100 for progress bar
    // passwordStrength is not used in the component
  }, [newPassword]);

  // Commented out unused strength helper functions
  // const getStrengthLabel = () => {
  //   if (passwordStrength === 0) return \"\";
  //   if (passwordStrength < 40) return \"Weak\";
  //   if (passwordStrength < 70) return \"Medium\";
  //   return \"Strong\";
  // };

  // const getStrengthColor = () => {
  //   if (passwordStrength < 40) return \"bg-red-500\";
  //   if (passwordStrength < 70) return \"bg-yellow-500\";
  //   return \"bg-green-500\";
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError("Passwords don&apos;t match. Please try again."); // Escaped apostrophe
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    setIsLoading(true);

    try {
      await baseApi.post("/password-reset/confirm", {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setSuccess(true);
      
      // Scroll to top on success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) { // Changed to unknown
      console.error("Password reset confirmation error:", err);
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'token' in err.response.data && Array.isArray((err.response.data as {token: unknown[]}).token) && (err.response.data as {token: string[]}).token[0] === "Invalid or expired token.") {
        setInvalidLink(true);
      } else {
        let message = "Failed to reset your password. Please try again.";
        if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object') {
          const data = err.response.data as { message?: string; new_password?: string[] };
          message = data.message || (data.new_password?.[0]) || message;
        }
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If the link is invalid or expired
  if (invalidLink) {
    return (
      <AuthLayout title="Invalid Reset Link">
        <div className="w-full max-w-md mx-auto text-center p-8 bg-red-50 rounded-lg border border-red-100 shadow-md">
          <svg
            className="w-20 h-20 text-red-500 mx-auto mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Invalid or Expired Link
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            The password reset link you clicked is invalid or has expired.
          </p>
          <Button 
            onClick={() => router.push("/forgot-password")}
            className="w-full mb-4 py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02]"
          >
            Request New Reset Link
          </Button>
          <Link
            href="/login"
            className="text-base font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
          >
            Return to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create New Password">
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
              Password Reset Complete
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button 
              onClick={() => router.push("/login")}
              className="w-full py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02]"
            >
              Log In Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-lg shadow-md">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 animate-fadeIn flex items-start">
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

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                Set Your New Password
              </h2>
              <p className="text-gray-600 mb-4">
                Create a strong password that you don&apos;t use for other websites.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    label="New Password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    placeholder="Enter your new password"
                  />
                </div>

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="w-full py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg mt-8"
            >
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
} 