// src/components/dashboard/PriceTrendChart.tsx
"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export interface PriceTrendChartProps {
  data?: Array<{
    date: string;
    price: number;
    type?: string;
    average_price?: number;
    median_price?: number;
  }>;
  showAverage?: boolean;
  showMedian?: boolean;
}

const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  data = [],
  showAverage = true,
  showMedian = true,
}) => {
  // Format data for chart
  const chartData = data.length > 0 ? data : [
    { date: "Jan", average_price: 2500000, median_price: 2400000 },
    { date: "Feb", average_price: 2750000, median_price: 2650000 },
    { date: "Mar", average_price: 2800000, median_price: 2700000 },
    { date: "Apr", average_price: 2900000, median_price: 2800000 },
    { date: "May", average_price: 3000000, median_price: 2900000 },
    { date: "Jun", average_price: 3200000, median_price: 3100000 },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value, "ETB")}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, "ETB", true)}
            tick={{ fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {showAverage && (
            <Line
              type="monotone"
              dataKey="average_price"
              name="Average Price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {showMedian && (
            <Line
              type="monotone"
              dataKey="median_price"
              name="Median Price"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceTrendChart;