// src/components/dashboard/PropertyTypeDistribution.tsx
'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PropertyTypeDistributionProps {
  data: Record<string, number>;
}

export const PropertyTypeDistribution: React.FC<PropertyTypeDistributionProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([type, count]) => ({
    type,
    count
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};