import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Filter, X } from 'lucide-react';
import { InquiryFilters as InquiryFiltersType } from '@/lib/types/inquiry';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface InquiryFiltersProps {
  filters: InquiryFiltersType;
  onFilterChange: (filters: InquiryFiltersType) => void;
  onReset: () => void;
  adminView?: boolean;
}

export const InquiryFilters: React.FC<InquiryFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  adminView = false,
}) => {
  const t = useTranslations('inquiries');
  const { register, handleSubmit, reset } = useForm({
    defaultValues: filters,
  });

  const onSubmit = (data: any) => {
    onFilterChange(data);
  };

  const handleReset = () => {
    reset();
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== '' && value !== null
  );

  return (
    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Filter className="w-5 h-5" />
            {t('filters')}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="w-4 h-4 mr-1" />
              {t('clear')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('status')}
              </label>
              <Select 
                {...register('status')}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="pending">{t('pending')}</option>
                <option value="contacted">{t('contacted')}</option>
                <option value="viewing_scheduled">{t('viewing_scheduled')}</option>
                <option value="follow_up">{t('follow_up')}</option>
                <option value="closed">{t('closed')}</option>
                <option value="spam">{t('spam')}</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('priority')}
              </label>
              <Select 
                {...register('priority')}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              >
                <option value="">{t('allPriorities')}</option>
                <option value="low">{t('low')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="high">{t('high')}</option>
                <option value="urgent">{t('urgent')}</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inquiryType')}
              </label>
              <Select 
                {...register('inquiry_type')}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              >
                <option value="">{t('allTypes')}</option>
                <option value="general">{t('general')}</option>
                <option value="viewing">{t('viewing')}</option>
                <option value="price">{t('price')}</option>
                <option value="details">{t('details')}</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('category')}
              </label>
              <Select 
                {...register('category')}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              >
                <option value="">{t('allCategories')}</option>
                <option value="buyer">{t('buyer')}</option>
                <option value="seller">{t('seller')}</option>
                <option value="general">{t('general')}</option>
              </Select>
            </div>
          </div>

          {adminView && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('assignedTo')}
              </label>
              <Select 
                {...register('assigned_to')}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              >
                <option value="">{t('allAssignments')}</option>
                <option value="unassigned">{t('unassigned')}</option>
                {/* Admin users would be populated here */}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search')}
            </label>
            <Input
              {...register('search')}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('fromDate')}
              </label>
              <Input
                {...register('created_at__gte')}
                type="date"
                className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('toDate')}
              </label>
              <Input
                {...register('created_at__lte')}
                type="date"
                className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {t('applyFilters')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('reset')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};