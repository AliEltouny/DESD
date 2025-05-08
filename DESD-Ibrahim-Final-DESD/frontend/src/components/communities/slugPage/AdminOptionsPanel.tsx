import React from 'react';
import Link from 'next/link';

interface AdminOptionsPanelProps {
  communitySlug: string;
}

const AdminOptionsPanel: React.FC<AdminOptionsPanelProps> = ({ communitySlug }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800">Admin Options</h2>
      </div>
      <div className="p-4">
        <p className="text-gray-700 mb-4">
          As the creator of this community, you have access to additional management options.
        </p>
        <Link 
          href={`/communities/${communitySlug}/manage`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Manage Community
        </Link>
      </div>
    </div>
  );
};

export default AdminOptionsPanel; 