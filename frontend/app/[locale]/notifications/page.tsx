'use client';

import React, { useEffect } from 'react';
import Header from "@/components/common/Header/Header";
import { useNotificationStore } from '@/lib/store/notificationStore';
import NotificationList from '@/components/notifications/NotificationList';
import { useTranslations } from 'next-intl';

const NotificationsPage: React.FC = () => {
  const { fetchUnreadCount } = useNotificationStore();
  const t = useTranslations('notifications');

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6 sm:py-8">
        <Header/>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              {t('subtitle')}
            </p>
          </div>
          <NotificationList />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;