"use client";

import React, { useState, useRef, useEffect } from "react";

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  helpText,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id={id}
          name={name}
          className={`
            relative w-full bg-white border ${error ? 'border-red-300' : 'border-gray-300'} 
            rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-gray-900
            ${className}
          `}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedOption ? (
            <span className="flex items-center">
              {selectedOption.icon && (
                <span className="flex-shrink-0 mr-2 text-gray-500">{selectedOption.icon}</span>
              )}
              <span className="block truncate text-gray-900">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="block truncate text-gray-500">
              {placeholder || "Select an option"}
            </span>
          )}
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
          </span>
        </button>

        {isOpen && (
          <div 
            className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
            tabIndex={-1}
            role="listbox"
            aria-labelledby={id}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={`
                  ${option.value === value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'} 
                  cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100
                `}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                <div className="flex items-center">
                  {option.icon && (
                    <span className="flex-shrink-0 mr-2 text-gray-500">{option.icon}</span>
                  )}
                  <span className={`block truncate ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                    {option.label}
                  </span>
                </div>
                
                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      ) : null}
    </div>
  );
};

export default CustomSelect; 