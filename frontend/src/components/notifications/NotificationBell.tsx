import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import NotificationDropdown from './NotificationDropdown';
import { useTranslations } from 'next-intl';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { unreadCount, fetchUnreadCount, markAllAsRead } = useNotificationStore();
  const t = useTranslations('notifications');

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none transition-colors"
        aria-label={t('bell.ariaLabel')}
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-screen max-w-xs sm:max-w-sm md:w-80 z-50 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5">
            <div className="p-3 sm:p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('dropdown.title')}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t('markAllRead')}
                  </button>
                )}
              </div>
            </div>
            <NotificationDropdown onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;