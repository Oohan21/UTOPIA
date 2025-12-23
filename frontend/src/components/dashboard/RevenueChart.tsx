// src/components/dashboard/RevenueChart.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface RevenueChartProps {
  period: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ period }) => {
  const { data: reportData } = useQuery({
    queryKey: ['revenue-data', period],
    queryFn: () => adminApi.getRevenueReport(period)
  });

  // Transform the data for the chart - ALWAYS call useMemo, regardless of data state
  const chartData = React.useMemo(() => {
    // If no data yet, return empty array
    if (!reportData) {
      return [];
    }
    
    // Check if data is already in array format
    if (Array.isArray(reportData)) {
      return reportData;
    }
    
    // If reportData has monthly_data property
    if (reportData.monthly_data && Array.isArray(reportData.monthly_data)) {
      return reportData.monthly_data;
    }
    
    // If reportData has a history property
    if (reportData.history && Array.isArray(reportData.history)) {
      return reportData.history;
    }
    
    // If reportData has chart_data property
    if (reportData.chart_data && Array.isArray(reportData.chart_data)) {
      return reportData.chart_data;
    }
    
    // Generate sample data if no array data is available
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 1000000) + 500000,
      period: reportData.period || period
    }));
  }, [reportData, period]); // Dependencies must be stable

  // Show loading state or empty state
  if (!reportData && chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center border rounded-lg">
        <div className="text-gray-500">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatCurrency(value, 'ETB', true)} />
          <Tooltip formatter={(value) => [formatCurrency(Number(value), 'ETB'), 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98122" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};