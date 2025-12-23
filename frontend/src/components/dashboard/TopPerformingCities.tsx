// src/components/dashboard/TopPerformingCities.tsx
'use client';

import React from 'react';
import { formatNumber } from '@/lib/utils/formatNumber';

interface TopPerformingCitiesProps {
  data: Array<{
    name: string;
    property_count: number;
    average_price: number;
    total_views: number;
  }>;
}

export const TopPerformingCities: React.FC<TopPerformingCitiesProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.map((city, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-gray-300">#{index + 1}</div>
            <div>
              <div className="font-medium">{city.name}</div>
              <div className="text-sm text-gray-500">
                {formatNumber(city.property_count)} properties
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">{formatNumber(city.total_views)} views</div>
            <div className="text-sm text-gray-500">
              Avg: {formatNumber(city.average_price)} ETB
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};