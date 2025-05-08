"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  customDropdown?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  helpText?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    options,
    className = "",
    fullWidth = true,
    placeholder,
    helpText,
    onChange,
    ...props
  }, ref) => {
    
    const baseClasses = `
      block w-full px-3 py-2 
      border ${error ? "border-red-300" : "border-gray-300"} 
      rounded-md shadow-sm 
      text-gray-900
      bg-white
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      appearance-none
      ${className}
    `;

    return (
      <div className={`select-wrapper ${fullWidth ? "w-full" : ""}`}>
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
          <select
            ref={ref}
            className={baseClasses}
            onChange={onChange}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-900 py-2">
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {error ? (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        ) : helpText ? (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select; 