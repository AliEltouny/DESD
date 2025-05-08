"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { getMediaUrl } from "@/services/api";
import useOptimizedNavigation from "@/hooks/useOptimizedNavigation";
import NavigationItem from "./NavigationItem";

interface NavbarProps {
  navigation: Array<{ name: string; href: string }>;
  pathname: string;
  user: any; // Using any for simplicity, but consider creating a proper user type
  logout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

// Optimized Navbar component extracted to its own file
const Navbar = React.memo(({ 
  navigation, 
  pathname, 
  user, 
  logout, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: NavbarProps) => {
  const { prefetchRoute } = useOptimizedNavigation();
  
  // Prefetch on hover for instant navigation
  const handleLinkHover = useCallback((href: string) => {
    prefetchRoute(href);
  }, [prefetchRoute]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Left Side: Logo & Desktop Links */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link 
                href="/dashboard" 
                className="text-xl font-bold text-blue-600" 
                prefetch={true}
                onMouseEnter={() => handleLinkHover('/dashboard')}
              >
                Uni Hub
              </Link>
            </div>
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <NavigationItem
                  key={item.name}
                  name={item.name}
                  href={item.href}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>

          {/* Right Side: Notifications & Profile Dropdown */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              type="button"
              className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              {/* Bell Icon (Heroicons) */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative ml-3">
              <div>
                <button type="button" className="relative flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  {user?.profile_picture ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={getMediaUrl(user.profile_picture)}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                    </div>
                  )}
                </button>
              </div>
            </div>
            {/* Simple Logout Button */}
            <button onClick={logout} className="ml-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed / open */}
              <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - only rendered when open for better performance */}
      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="space-y-1 pt-2 pb-3">
            {navigation.map((item) => (
              <NavigationItem
                key={item.name}
                name={item.name}
                href={item.href}
                isActive={pathname === item.href}
                isMobile={true}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                {user?.profile_picture ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={getMediaUrl(user.profile_picture)}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.first_name || user?.username}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
              {/* Mobile Notifications Button */}
              <button type="button" className="relative ml-auto flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar; 