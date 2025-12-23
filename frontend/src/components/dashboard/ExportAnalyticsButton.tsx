// src/components/dashboard/ExportAnalyticsButton.tsx
'use client';

import React, { useState } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { CalendarIcon, Download, FileText, Table, BarChart3, Users, Home, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const ExportAnalyticsButton: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'market' | 'users' | 'properties' | 'transactions'>('market');
  const [formatType, setFormatType] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async (type: string, format: 'csv' | 'json' = 'csv') => {
    try {
      setIsExporting(true);
      const blob = await dashboardApi.exportAnalytics(type, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    if (!dateRange) {
      toast.error('Please select a date range');
      return;
    }

    try {
      setIsExporting(true);
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const blob = await dashboardApi.generateReport(exportType, startDate, endDate);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}_report_${startDate}_to_${endDate}.${formatType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsDialogOpen(false);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      label: 'Market Data',
      type: 'market',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Market trends and analytics'
    },
    {
      label: 'User Data',
      type: 'users',
      icon: <Users className="h-4 w-4" />,
      description: 'User analytics and behavior'
    },
    {
      label: 'Property Data',
      type: 'properties',
      icon: <Home className="h-4 w-4" />,
      description: 'Property listings and performance'
    },
    {
      label: 'Transaction Data',
      type: 'transactions',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Payment and transaction history'
    }
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">Quick Export</div>
          {exportOptions.map((option) => (
            <DropdownMenuItem 
              key={option.type}
              onClick={() => handleQuickExport(option.type)}
              className="flex items-center gap-3 cursor-pointer"
            >
              {option.icon}
              <div>
                <div>{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
          <div className="border-t my-1" />
          <DropdownMenuItem 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <div>
              <div>Custom Report</div>
              <div className="text-xs text-gray-500">Generate custom analytics report</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Custom Report</DialogTitle>
            <DialogDescription>
              Select report type, format, and date range for your custom analytics report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {exportOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setExportType(option.type as any)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      exportType === option.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormatType('csv')}
                  className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    formatType === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Table className="h-4 w-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setFormatType('json')}
                  className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    formatType === 'json'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        format(dateRange.from, 'PPP')
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange?.from}
                      onSelect={(date) =>
                        setDateRange(prev => ({
                          from: date || new Date(),
                          to: prev?.to || date || new Date()
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.to ? (
                        format(dateRange.to, 'PPP')
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange?.to}
                      onSelect={(date) =>
                        setDateRange(prev => ({
                          from: prev?.from || date || new Date(),
                          to: date || new Date()
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* File Name Preview */}
            {dateRange && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">File will be saved as:</div>
                <div className="font-mono text-sm">
                  {exportType}_report_{format(dateRange.from, 'yyyy-MM-dd')}_to_{format(dateRange.to, 'yyyy-MM-dd')}.{formatType}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomExport}
              disabled={isExporting || !dateRange}
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};