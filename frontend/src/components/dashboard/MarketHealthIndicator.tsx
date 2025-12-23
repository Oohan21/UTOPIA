'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/Badge';

interface MarketHealthIndicatorProps {
  data?: {
    absorption_rate?: number;
    price_to_rent_ratio?: number;
    rental_yield?: number;
    inventory_months?: number;
  };
}

export const MarketHealthIndicator: React.FC<MarketHealthIndicatorProps> = ({ data = {} }) => {
  // Safely extract values with defaults
  const absorptionRate = data.absorption_rate || 0;
  const priceToRentRatio = data.price_to_rent_ratio || 0;
  const rentalYield = data.rental_yield || 0;
  
  const getHealthScore = () => {
    let score = 0;
    
    // Absorption rate scoring (0-40 points)
    if (absorptionRate > 30) score += 40;
    else if (absorptionRate > 20) score += 30;
    else if (absorptionRate > 10) score += 20;
    else score += 10;
    
    // Price to rent ratio scoring (0-30 points)
    if (priceToRentRatio > 25) score += 10;
    else if (priceToRentRatio > 20) score += 20;
    else if (priceToRentRatio > 15) score += 30;
    else score += 15;
    
    // Rental yield scoring (0-30 points)
    if (rentalYield > 8) score += 30;
    else if (rentalYield > 6) score += 25;
    else if (rentalYield > 4) score += 20;
    else score += 10;
    
    return Math.min(100, score);
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Slow', color: 'bg-red-500' };
  };

  const healthScore = getHealthScore();
  const healthStatus = getHealthStatus(healthScore);

  // If no data is provided, show a message
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No market health data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Market Health Score</div>
        <Badge className={`${healthStatus.color} text-white`}>
          {healthStatus.label}
        </Badge>
      </div>
      
      <Progress value={healthScore} className="h-3" />
      
      <div className="text-center text-2xl font-bold">
        {healthScore}/100
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Absorption Rate</div>
          <div className="text-lg font-bold mt-1">
            {absorptionRate.toFixed(1)}%
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Price to Rent</div>
          <div className="text-lg font-bold mt-1">
            {priceToRentRatio.toFixed(1)}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Rental Yield</div>
          <div className="text-lg font-bold mt-1">
            {rentalYield.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};