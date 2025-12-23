// src/components/dashboard/DashboardStatsCard.tsx
'use client';

import React from 'react';
import { formatNumber } from '@/lib/utils/formatNumber';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface DashboardStatsCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

export const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  isCurrency = false,
  isPercentage = false,
  trend,
}) => {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const formattedValue = isCurrency
    ? formatCurrency(value, 'ETB')
    : isPercentage
    ? `${value}%`
    : formatNumber(value);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {formattedValue}
            </span>
            {icon && <span className="text-2xl">{icon}</span>}
          </div>
        </div>
        {trend && (
          <span className={`text-lg font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      
      {change !== undefined && changeLabel && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{changeLabel}</span>
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{formatNumber(change)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};