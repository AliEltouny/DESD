"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/layouts/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

// Create a client component that uses useSearchParams
const LoginForm = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Check for verified=true in URL params for showing success message
  useEffect(() => {
    if (searchParams?.get("verified") === "true") {
      setSuccessMessage("Your email has been verified successfully! You can now sign in to your account.");
    }
  }, [searchParams]);

  // Redirect if already authenticated

  // In LoginForm component
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password, rememberMe);
      // The redirect will be handled by the login function
    } catch (err: unknown) {
      console.error("Login error:", err);
      let message = "Invalid credentials. Please try again.";
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as { message: string }).message || message;
      }
      if (message === "Invalid credentials") {
        message = "Incorrect email or password.";
      }
      setError(message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-3/5">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 animate-fadeIn flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

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

          <div className="space-y-5">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="your.email@university.edu"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-600"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="w-full py-3 text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
          >
            Sign in
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2 text-blue-800"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.0073 0H3.9927C1.7888 0 0 1.7888 0 3.9927V20.0073C0 22.2112 1.7888 24 3.9927 24H12V14.4H9.6V10.8H12V8.4C12 5.3019 13.7947 3.6 16.5615 3.6C17.8845 3.6 19.0566 3.7072 19.3845 3.7555V7.05H17.5269C16.1073 7.05 15.8077 7.7294 15.8077 8.7054V10.8H19.2L18.7615 14.4H15.8077V24H20.0073C22.2112 24 24 22.2112 24 20.0073V3.9927C24 1.7888 22.2112 0 20.0073 0Z" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                Sign up now
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
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Welcome Back!
          </h3>
          <p className="text-gray-600 text-center max-w-xs">
            Sign in to access your account and continue your university journey.
          </p>

          <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">What you can do</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-4 h-4 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Access your university communities
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-4 h-4 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Discover and join campus events
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-4 h-4 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Connect with fellow students
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with suspense boundary
const LoginPage = () => {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue to Uni Hub">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
};

export default LoginPage;
