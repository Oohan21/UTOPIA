// src/lib/utils/analytics.ts
import { DashboardStats } from '@/lib/types/dashboard';

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const formatAnalyticsValue = (
  value: number,
  type: 'currency' | 'number' | 'percentage' = 'number'
): string => {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } else if (type === 'percentage') {
    return `${value.toFixed(1)}%`;
  } else {
    return new Intl.NumberFormat('en-ET').format(value);
  }
};

export const getTrendDirection = (value: number): 'up' | 'down' | 'stable' => {
  if (value > 5) return 'up';
  if (value < -5) return 'down';
  return 'stable';
};

export const generateDashboardInsights = (stats: DashboardStats): string[] => {
  const insights: string[] = [];

  if (stats.revenue_growth > 20) {
    insights.push('Revenue growth is strong at over 20%');
  } else if (stats.revenue_growth < 0) {
    insights.push('Revenue decline detected. Consider promotional campaigns.');
  }

  if (stats.total_inquiries > stats.total_properties * 5) {
    insights.push('High inquiry-to-property ratio indicates strong demand');
  }

  const userGrowth = calculateGrowthRate(stats.total_users, stats.total_users - (stats.active_users || 0));
  if (userGrowth > 10) {
    insights.push(`User base growing rapidly at ${userGrowth.toFixed(1)}%`);
  }

  return insights;
};

export const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};