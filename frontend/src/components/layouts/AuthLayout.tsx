"use client";

import React, { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-blue-100 opacity-50 filter blur-3xl"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-blue-200 opacity-40 filter blur-3xl"></div>
        <div className="absolute -bottom-24 right-1/3 w-64 h-64 rounded-full bg-blue-300 opacity-30 filter blur-3xl"></div>
      </div>

      <div className="max-w-5xl w-full space-y-8 bg-white p-8 rounded-lg shadow-lg relative z-10 transition-all duration-300 hover:shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            {title}
          </h1>
          {subtitle && <p className="text-base text-gray-700">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
