"use client";

import React, { useState, useRef, useEffect } from "react";

interface PostTypeOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PostTypeSelectProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: PostTypeOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

const PostTypeSelect: React.FC<PostTypeSelectProps> = ({
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

  // Post type icons
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'discussion':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case 'question':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'announcement':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'resource':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
    }
  };

  // Add icons to options
  const optionsWithIcons = options.map(option => ({
    ...option,
    icon: option.icon || getPostTypeIcon(option.value)
  }));

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
            rounded-lg shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer font-normal
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-gray-900 sm:w-40
            ${className}
          `}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          style={{ fontWeight: "normal" }}
        >
          {selectedOption ? (
            <span className="flex items-center">
              {selectedOption.icon && (
                <span className="flex-shrink-0 mr-2 text-gray-500">{selectedOption.icon}</span>
              )}
              <span className="block truncate text-gray-900 font-normal" style={{ fontWeight: "normal" }}>{selectedOption.label}</span>
            </span>
          ) : (
            <span className="block truncate text-gray-500 font-normal" style={{ fontWeight: "normal" }}>
              {placeholder || "Select post type"}
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
            className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm font-normal"
            tabIndex={-1}
            role="listbox"
            aria-labelledby={id}
            style={{ fontWeight: "normal" }}
          >
            {optionsWithIcons.map((option) => (
              <div
                key={option.value}
                className={`
                  ${option.value === value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'} 
                  cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 font-normal
                `}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
                style={{ fontWeight: "normal" }}
              >
                <div className="flex items-center">
                  {option.icon && (
                    <span className="flex-shrink-0 mr-2 text-gray-500">{option.icon}</span>
                  )}
                  <span className={`block truncate font-normal`} style={{ fontWeight: "normal" }}>
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
        <p className="mt-1 text-sm text-red-600 font-normal" style={{ fontWeight: "normal" }}>{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-sm text-gray-500 font-normal" style={{ fontWeight: "normal" }}>{helpText}</p>
      ) : null}
    </div>
  );
};

export default PostTypeSelect; 