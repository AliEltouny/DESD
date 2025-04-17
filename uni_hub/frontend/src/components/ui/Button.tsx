"use client";

import React, { ButtonHTMLAttributes } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex justify-center items-center px-4 py-2 border 
    rounded-md shadow-sm text-sm font-medium text-white 
    bg-blue-600 hover:bg-blue-700 
    outline-none border-transparent
    focus:outline-none focus:ring-0
    active:bg-blue-800 active:transform-none
    disabled:opacity-70 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  // Fixed height button to prevent size changes
  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        transform: 'none',
        height: '38px',
        minWidth: '80px'
      }}
      {...props}
    >
      <div className="flex items-center justify-center w-full">
        {isLoading ? (
          <LoadingSpinner className="h-4 w-4" />
        ) : (
          <span className="inline-block">{children}</span>
        )}
      </div>
    </button>
  );
};

export default Button;
