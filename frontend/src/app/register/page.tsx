"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";
import Input from "@/components/ui/Input";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};

const RegisterPage = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationMessages, setValidationMessages] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    password2: "",
    dateOfBirth: "",
    academicYear: "",
  });

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  // Validate form fields when they change
  useEffect(() => {
    const messages: Record<string, string> = {};

    if (touched.email && !formData.email) {
      messages.email = "Email is required";
    } else if (touched.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      messages.email = "Please enter a valid email address";
    }

    if (touched.username && !formData.username) {
      messages.username = "Username is required";
    } else if (touched.username && formData.username.length < 3) {
      messages.username = "Username must be at least 3 characters";
    }

    if (touched.firstName && !formData.firstName) {
      messages.firstName = "First name is required";
    }

    if (touched.lastName && !formData.lastName) {
      messages.lastName = "Last name is required";
    }

    if (touched.password && !formData.password) {
      messages.password = "Password is required";
    } else if (touched.password && formData.password.length < 8) {
      messages.password = "Password must be at least 8 characters";
    }

    if (touched.password2 && formData.password !== formData.password2) {
      messages.password2 = "Passwords don&apos;t match";
    }

    setValidationMessages(messages);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Check for validation errors
    const hasErrors = Object.keys(validationMessages).length > 0;

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    if (hasErrors) {
      setError("Please fix the errors in the form");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signup(
        formData.email,
        formData.username,
        formData.firstName,
        formData.lastName,
        formData.password,
        formData.password2,
        formData.dateOfBirth || undefined,
        formData.academicYear ? parseInt(formData.academicYear) : undefined
      );

      // Redirect to OTP verification page
      router.push(`/verify-otp/${encodeURIComponent(result.email)}`);
    } catch (err) {
      console.error("Registration error:", err);
      let message = "Failed to register. Please try again.";
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as Error).message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get strength text and color
  const getStrengthInfo = () => {
    const strengthText = [
      "Very Weak",
      "Weak",
      "Medium",
      "Strong",
      "Very Strong",
    ];
    const strengthColor = [
      "#f87171",
      "#fbbf24",
      "#a3e635",
      "#34d399",
      "#60a5fa",
    ];

    return {
      text: strengthText[passwordStrength - 1] || "No Password",
      color:
        passwordStrength === 0
          ? "#e5e7eb"
          : strengthColor[passwordStrength - 1],
    };
  };

  return (
    <AuthLayout
      title="Join Uni Hub"
      subtitle="Create your account and connect with your university community"
    >
      <div className="flex flex-col md:flex-row gap-8 mt-8">
        <div className="w-full md:w-3/5">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 animate-fadeIn">
                {error}
              </div>
            )}

            {/* Personal Information Section */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
              <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h2>

              {/* Progress steps */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <span className="text-xs mt-1 text-gray-600">Sign Up</span>
                  </div>
                  <div className="flex-1 h-1 mx-2 bg-gray-300"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold">
                      2
                    </div>
                    <span className="text-xs mt-1 text-gray-500">
                      Verify Email
                    </span>
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

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    label="First Name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={validationMessages.firstName}
                    className="text-gray-800 bg-white border-gray-300"
                  />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    label="Last Name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={validationMessages.lastName}
                    className="text-gray-800 bg-white border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="text-gray-800 bg-white border-gray-300"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year
                    </label>
                    <div className="relative">
                      <select
                        id="academicYear"
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-800 bg-white appearance-none"
                      >
                        <option value="">Select</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                        <option value="6">6th Year</option>
                        <option value="7">7th Year</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md">
              <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Account Details
              </h2>

              <div className="space-y-4">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={validationMessages.email}
                  className="text-gray-800 bg-white border-gray-300"
                />

                <Input
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={validationMessages.username}
                  className="text-gray-800 bg-white border-gray-300"
                />

                <div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={validationMessages.password}
                    className="text-gray-800 bg-white border-gray-300"
                  />
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500">
                          Password Strength:
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: getStrengthInfo().color }}
                        >
                          {getStrengthInfo().text}
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 ease-out"
                          style={{
                            width: `${(passwordStrength / 5) * 100}%`,
                            backgroundColor: getStrengthInfo().color,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Use 8+ characters with a mix of letters, numbers &
                        symbols
                      </p>
                    </div>
                  )}
                </div>

                <Input
                  id="password2"
                  name="password2"
                  type="password"
                  label="Confirm Password"
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={validationMessages.password2}
                  className="text-gray-800 bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={() => setAgreeToTerms(!agreeToTerms)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-500">
                  I agree to the{" "}
                  <Link
                    href="/terms-of-service"
                    className="text-blue-600 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !agreeToTerms}
              className="w-full py-3 text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-300 outline-none focus:outline-none active:outline-none"
              style={{ 
                outline: 'none', 
                boxShadow: 'none',
                border: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                >
                  Sign in
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Join Your University Community
            </h3>
            <p className="text-gray-600 text-center max-w-xs">
              Connect with peers, discover events, and access resources that
              will enhance your university experience.
            </p>

            <div className="mt-8 flex flex-col space-y-4">
              {[
                "Connect with classmates",
                "Join interest groups",
                "Discover campus events",
                "Share academic resources",
                "Build your network",
              ].map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
