import React from 'react';
import { CommunityDetail } from '@/types/api';

interface QuickLinksProps {
  community: CommunityDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const QuickLinks: React.FC<QuickLinksProps> = ({ community, activeTab, onTabChange }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
      <h2 className="text-lg font-semibold text-white">Quick Links</h2>
    </div>
    <div className="p-4">
      <nav className="space-y-2">
        {/* Latest Posts - switches to Posts tab */}
        <button 
          onClick={() => onTabChange('posts')}
          className={`block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center ${activeTab === 'posts' ? 'bg-blue-50 text-blue-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
          </svg>
          Latest Posts
        </button>

        {/* Community Guidelines - switches to About tab */}
        <button 
          onClick={() => onTabChange('about')}
          className={`block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center ${activeTab === 'about' ? 'bg-blue-50 text-blue-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          Community Guidelines
        </button>

        {/* Members List - switches to Members tab */}
        <button 
          onClick={() => onTabChange('members')}
          className={`block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center ${activeTab === 'members' ? 'bg-blue-50 text-blue-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Members
        </button>

        {/* Share Community */}
        <button
          onClick={() => {
            // Create a shareable URL for the community
            const communityUrl = window.location.href;
            
            // Try to use the Web Share API if available
            if (navigator.share) {
              navigator.share({
                title: `Join ${community.name} on UniHub`,
                text: community.short_description || `Check out the ${community.name} community on UniHub!`,
                url: communityUrl,
              }).catch(err => {
                console.error('Error sharing:', err);
                // Fallback to clipboard
                navigator.clipboard.writeText(communityUrl);
                alert('Link copied to clipboard!');
              });
            } else {
              // Fallback for browsers that don't support Web Share API
              navigator.clipboard.writeText(communityUrl);
              alert('Link copied to clipboard!');
            }
          }}
          className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share Community
        </button>
        
        {/* Report Community */}
        <button
          onClick={() => alert('Report functionality will be implemented soon.')}
          className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Report Community
        </button>
      </nav>
    </div>
    
    {/* Footer with copyright info */}
    <div className="text-xs text-gray-500 px-4 py-3 border-t border-gray-100">
      <p>© {new Date().getFullYear()} Uni Hub</p>
      <p className="mt-1">Building university communities together</p>
    </div>
  </div>
);

export default React.memo(QuickLinks); 