"use client";

import React, { memo } from 'react';

/**
 * Simple component to preload critical assets
 * This version just sets up preload links in the head
 */
const AssetPreloader = memo(() => {
  // No heavy DOM manipulation, just return preload links
  return (
    <>
      {/* Preload common SVG paths - these are hidden from view */}
      <div aria-hidden="true" className="hidden">
        <svg width="0" height="0" style={{ position: 'absolute', visibility: 'hidden' }}>
          <defs>
            <path id="nav-icon-bell" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            <path id="nav-icon-menu" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            <path id="nav-icon-close" d="M6 18L18 6M6 6l12 12" />
          </defs>
        </svg>
      </div>
    </>
  );
});

AssetPreloader.displayName = 'AssetPreloader';

export default AssetPreloader; 