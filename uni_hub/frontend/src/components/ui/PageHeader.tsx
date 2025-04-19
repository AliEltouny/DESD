"use client";

import React from 'react';
import Link from 'next/link';

interface Breadcrumb {
  name: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode; // Slot for buttons or other actions
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  breadcrumbs,
  actions
}) => {
  return (
    <div className="mb-6 border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-1" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.name}>
                  <div className="flex items-center">
                    {index !== 0 && (
                      <svg
                        className="flex-shrink-0 h-4 w-4 text-gray-400 mx-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                      </svg>
                    )}
                    <Link 
                      href={crumb.href} 
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {crumb.name}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {/* Title */}
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {title}
        </h1>
        {/* Description */}
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      {/* Actions Slot */}
      {actions && (
        <div className="mt-4 flex sm:mt-0 sm:ml-4">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader; 