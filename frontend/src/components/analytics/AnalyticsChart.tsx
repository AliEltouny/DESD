"use client";

import React from 'react';

interface ChartData {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  dataKey: string;
  indexKey: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  title, 
  data, 
  dataKey,
  indexKey
}) => {
  // Basic placeholder rendering
  // TODO: Implement actual chart rendering using a library like Recharts or Chart.js
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">Chart for {dataKey} over {indexKey} will be here.</p>
        {/* You can preview the data passed:
        <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(data, null, 2)}
        </pre> 
        */}
      </div>
    </div>
  );
};

export default AnalyticsChart; 