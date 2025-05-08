// Debug component to help diagnose API data issues
// This can be removed after fixing the image problem
import React from 'react';

interface DebugDataViewerProps {
  label: string;
  data: any;
}

const DebugDataViewer: React.FC<DebugDataViewerProps> = ({ label, data }) => {
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      maxWidth: '500px',
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <h3>{label}</h3>
      <pre style={{ fontSize: '10px' }}>
        {JSON.stringify({
          imageField: data.image,
          logoField: data.logo,
          bannerField: data.banner,
          coverImageField: data.cover_image,
          name: data.name,
          id: data.id
        }, null, 2)}
      </pre>
    </div>
  );
};

export default DebugDataViewer;