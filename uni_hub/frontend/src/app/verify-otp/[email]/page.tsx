"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthLayout from "@/components/layouts/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const VerifyOtpPage = () => {
  const router = useRouter();
  const params = useParams();
  const email = params.email as string;

  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format time from seconds to MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    // Update the OTP inputs array
    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);

    // Combine the OTP inputs into a single string
    setOtp(newOtpInputs.join(""));

    // Move to next input if current one is filled
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && index > 0 && otpInputs[index] === "") {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP pasting
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Only proceed if the pasted content looks like a valid OTP
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtpInputs = [...otpInputs];

      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtpInputs[index] = digit;
        }
      });

      setOtpInputs(newOtpInputs);
      setOtp(pastedData);

      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError(null);

    try {
      // Mock resend functionality - would connect to actual API in production
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset countdown and disable resend button
      setCountdown(300);
      setCanResend(false);

      // Show success message
      // This would be replaced with actual API call in production
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await verifyOtp(email, otp);
      // Redirect happens in verifyOtp function
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Email Verification"
      subtitle={`We've sent a verification code to ${email}`}
    >
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-3/5">
          {/* Progress steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <span className="text-xs mt-1 text-gray-600">Sign Up</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-blue-600"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <span className="text-xs mt-1 text-gray-600">Verify Email</span>
              </div>
              <div className="flex-1 h-1 mx-2 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold">
                  3
                </div>
                <span className="text-xs mt-1 text-gray-500">Complete</span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter the 6-digit verification code
              </label>
              <div className="flex justify-between gap-2">
                {otpInputs.map((value, index) => (
                  <div key={index} className="w-full">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-full h-12 text-center text-lg font-bold border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Code expires in:{" "}
                  <span
                    className={
                      countdown < 60 ? "text-red-500" : "text-gray-700"
                    }
                  >
                    {formatTime(countdown)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isResending}
                  className={`text-sm ${
                    canResend
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-gray-400"
                  } transition-colors duration-300`}
                >
                  {isResending ? "Resending..." : "Resend code"}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-800 text-sm mb-2">
                Can't find the code?
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Check your spam or junk folder</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Verify that {email} is correct</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Email delivery may take up to 5 minutes</span>
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="w-full py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
            >
              Verify Email
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                >
                  ← Back to registration
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Illustration for larger screens */}
        <div className="hidden md:block md:w-2/5">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-52 h-52 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-32 h-32 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Check Your Email
            </h3>
            <p className="text-gray-600 text-center max-w-xs">
              We've sent a 6-digit verification code to your email address to
              verify your account.
            </p>

            <div className="mt-8 bg-gray-100 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="block font-medium mb-2">
                  What happens next?
                </span>
                After verification, you'll be able to access all features of Uni
                Hub, including joining communities, discovering events, and
                connecting with fellow students.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtpPage;
