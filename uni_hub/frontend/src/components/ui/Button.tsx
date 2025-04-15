"use client";

import React, { ButtonHTMLAttributes } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex justify-center items-center px-4 py-2 border 
    rounded-md shadow-sm text-sm font-medium text-white 
    bg-blue-600 hover:bg-blue-700 
    outline-none outline-0 outline-transparent
    focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:border-transparent
    active:outline-none active:ring-0 active:shadow-none active:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-300
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      style={{ 
        outline: 'none', 
        boxShadow: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      {...props}
    >
      {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
