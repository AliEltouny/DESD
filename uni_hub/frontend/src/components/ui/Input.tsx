"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", fullWidth = true, ...props }, ref) => {
    const baseClasses =
      "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all duration-300";
    const errorClasses =
      "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500";
    const validClasses =
      "border-green-300 focus:border-green-500 focus:ring-green-500";

    const inputClasses = `
      ${baseClasses}
      ${
        error ? errorClasses : props.value && props.required ? validClasses : ""
      }
      ${fullWidth ? "w-full" : ""}
      ${className}
    `;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input ref={ref} className={inputClasses} {...props} />

          {/* Valid indicator */}
          {props.value && props.required && !error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-5 w-5 text-green-500"
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
            </div>
          )}

          {/* Error indicator */}
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-5 w-5 text-red-500"
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
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 animate-fadeIn">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
