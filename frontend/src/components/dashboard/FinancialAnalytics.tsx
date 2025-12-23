// src/components/dashboard/FinancialAnalytics.tsx
'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export const FinancialAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');

  // Mock financial data - replace with actual API calls
  const financialData = {
    revenue: {
      total: 12500000,
      growth: 18.5,
      monthly: [
        { month: 'Jan', revenue: 950000, transactions: 142 },
        { month: 'Feb', revenue: 1100000, transactions: 165 },
        { month: 'Mar', revenue: 1250000, transactions: 188 },
        { month: 'Apr', revenue: 1180000, transactions: 177 },
        { month: 'May', revenue: 1350000, transactions: 203 },
        { month: 'Jun', revenue: 1420000, transactions: 213 }
      ]
    },
    expenses: {
      total: 2850000,
      breakdown: [
        { category: 'Marketing', amount: 850000, percentage: 29.8 },
        { category: 'Operations', amount: 750000, percentage: 26.3 },
        { category: 'Development', amount: 650000, percentage: 22.8 },
        { category: 'Salaries', amount: 400000, percentage: 14.0 },
        { category: 'Other', amount: 200000, percentage: 7.0 }
      ]
    },
    transactions: {
      total: 1088,
      average: 12500,
      successful: 1045,
      failed: 43,
      refunded: 12
    },
    projections: {
      nextMonth: 1480000,
      growth: 12.3,
      confidence: 'high'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
          <p className="text-gray-600 mt-1">
            Revenue, expenses, and financial performance
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange} placeholder="Time Range">
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={(value: string) => setCurrency('USD')} placeholder="Currency">
            <SelectContent>
              <SelectItem value="ETB">ETB</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.revenue.total, currency)}
            </div>
            <div className="text-sm text-green-600 mt-1">
              +{financialData.revenue.growth.toFixed(1)}% growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.expenses.total, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {((financialData.expenses.total / financialData.revenue.total) * 100).toFixed(1)}% of revenue
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(financialData.transactions.total)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {((financialData.transactions.successful / financialData.transactions.total) * 100).toFixed(1)}% success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialData.revenue.total - financialData.expenses.total, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {(((financialData.revenue.total - financialData.expenses.total) / financialData.revenue.total) * 100).toFixed(1)}% margin
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue and transaction volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialData.revenue.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value, currency, true)} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(Number(value), currency) : value,
                          name === 'revenue' ? 'Revenue' : 'Transactions'
                        ]}
                      />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#10b981" 
                        fill="#10b98122" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="transactions" 
                        name="Transactions" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>
                  Breakdown of revenue streams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: 'Property Promotions', amount: 8500000, percentage: 68, color: '#3b82f6' },
                    { source: 'Premium Listings', amount: 2500000, percentage: 20, color: '#10b981' },
                    { source: 'Agent Commissions', amount: 1000000, percentage: 8, color: '#8b5cf6' },
                    { source: 'Other Services', amount: 500000, percentage: 4, color: '#f59e0b' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.source}</span>
                        <span className="font-medium">{formatCurrency(item.amount, currency)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {item.percentage}% of total revenue
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>
                Monthly expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.expenses.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => formatCurrency(value, currency, true)} />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(Number(value), currency),
                        name === 'amount' ? 'Amount' : 'Percentage'
                      ]}
                    />
                    <Bar dataKey="amount" name="Amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.expenses.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][index] }}
                        />
                        <span>{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.amount, currency)}</div>
                        <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800 font-medium">Highest Expense</div>
                    <div className="text-lg font-bold mt-1">
                      Marketing: {formatCurrency(financialData.expenses.breakdown[0].amount, currency)}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-800 font-medium">Lowest Expense</div>
                    <div className="text-lg font-bold mt-1">
                      Other: {formatCurrency(financialData.expenses.breakdown[4].amount, currency)}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-800 font-medium">Profit Margin</div>
                    <div className="text-lg font-bold mt-1 text-green-600">
                      {(((financialData.revenue.total - financialData.expenses.total) / financialData.revenue.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {financialData.transactions.successful}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {financialData.transactions.failed}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Failed</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-medium">
                        {((financialData.transactions.successful / financialData.transactions.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Transaction</span>
                      <span className="font-medium">
                        {formatCurrency(financialData.transactions.average, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Refund Rate</span>
                      <span className="font-medium">
                        {((financialData.transactions.refunded / financialData.transactions.total) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { method: 'Chapa', percentage: 65, amount: 8125000, color: '#3b82f6' },
                    { method: 'Bank Transfer', percentage: 20, amount: 2500000, color: '#10b981' },
                    { method: 'Credit Card', percentage: 10, amount: 1250000, color: '#8b5cf6' },
                    { method: 'Other', percentage: 5, amount: 625000, color: '#f59e0b' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.method}</span>
                        <span>{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {formatCurrency(item.amount, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Projections</CardTitle>
              <CardDescription>
                Forecast for next month based on current trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(financialData.projections.nextMonth, currency)}
                    </div>
                    <div className="text-sm text-blue-600 mt-2">Projected Revenue</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-700">
                      +{financialData.projections.growth}%
                    </div>
                    <div className="text-sm text-green-600 mt-2">Expected Growth</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-700 capitalize">
                      {financialData.projections.confidence}
                    </div>
                    <div className="text-sm text-purple-600 mt-2">Confidence Level</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-lg font-semibold">Key Factors</div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 mt-0.5">
                        ✓
                      </div>
                      <span>Current growth rate of {financialData.revenue.growth}% sustained</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 mt-0.5">
                        ✓
                      </div>
                      <span>New promotion features driving additional revenue</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3 mt-0.5">
                        !
                      </div>
                      <span>Seasonal factors may affect growth in coming months</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};