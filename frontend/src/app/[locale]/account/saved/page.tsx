// app/[locale]/account/saved/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Header from "@/components/common/Header/Header";
import {
  Heart,
  Bell,
  TrendingUp,
} from 'lucide-react';

// Client components and hooks
import { SavedPropertiesContent } from './SavedPropertiesContent';

// Metadata
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'savedProperties' });

  return {
    title: t('pageTitle') || 'Saved Properties',
    description: t('pageDescription') || 'Manage your saved properties',
  };
}

// Main page component
export default function SavedPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const t = useTranslations('savedProperties');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('header.title') || 'Saved Properties'}
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {t('header.subtitle', { count: 0 }) || 'Manage your saved properties and searches'}
          </p>
        </div>

        {/* Main content - Client component */}
        <SavedPropertiesContent locale={locale} />

        {/* Tips section */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-800 p-2 md:p-3">
                  <Heart className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base mb-1 md:mb-2">
                    Organize with Collections
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Create custom collections to group similar properties
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-800 p-2 md:p-3">
                  <Bell className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base mb-1 md:mb-2">
                    Price Drop Alerts
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Get notified when saved properties change price
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="rounded-full bg-amber-100 dark:bg-amber-800 p-2 md:p-3">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base mb-1 md:mb-2">
                    Market Insights
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    See price trends for your saved properties
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}