import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Check, ExternalLink, X, AlertCircle, CheckCircle, Info, AlertTriangle, Bell, MessageSquare } from 'lucide-react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { Notification } from '@/lib/types/notification';
import { useTranslations } from 'next-intl';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(false);
  const t = useTranslations('notifications');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      await fetchNotifications({
        is_read: filter === 'unread' ? false : undefined,
        limit: 10
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'property_rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'property_changes_requested':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'inquiry_response':
        return <Check className="h-5 w-5 text-blue-500" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.data?.property_url) {
      return notification.data.property_url;
    }
    if (notification.content_type === 'property' && notification.object_id) {
      return `/listings/${notification.object_id}`;
    }
    if (notification.content_type === 'message' && notification.object_id) {
      return `/messages`;
    }
    if (notification.data?.message_url) {
      return notification.data.message_url;
    }
    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    const link = getNotificationLink(notification);
    if (link) {
      window.location.href = link;
    }
    onClose();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex border-b dark:border-gray-700">
          <button
            className={`flex-1 py-2 text-sm font-medium ${filter === 'unread' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setFilter('unread')}
          >
            {t('filters.unread')} ({notifications.filter(n => !n.is_read).length})
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${filter === 'all' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setFilter('all')}
          >
            {t('filters.all')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('dropdown.loading')}</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
          <Bell className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-sm sm:text-base">{t('dropdown.empty')}</p>
        </div>
      ) : (
        <div className="divide-y dark:divide-gray-700">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.is_read 
                ? 'bg-blue-50 dark:bg-blue-900/20' 
                : 'bg-white dark:bg-gray-800'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium line-clamp-1 ${!notification.is_read 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </span>
                    {getNotificationLink(notification) && (
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  
                  {/* Property approval specific info */}
                  {notification.data?.action && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                      <div className="font-medium text-gray-900 dark:text-gray-300">
                        {t('propertyInfo.property')}: {notification.data.property_title || t('propertyInfo.unknown')}
                      </div>
                      {notification.data.notes && (
                        <div className="mt-1 text-gray-600 dark:text-gray-400">
                          {t('common.note', { defaultValue: 'Note' })}: {notification.data.notes}
                        </div>
                      )}
                      {notification.data.admin_name && (
                        <div className="mt-1 text-gray-500 dark:text-gray-500">
                          {t('propertyInfo.by')}: {notification.data.admin_name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title={t('markRead')}
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 border-t dark:border-gray-700">
        <a
          href="/notifications"
          className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          onClick={onClose}
        >
          {t('dropdown.viewAll')}
        </a>
      </div>
    </div>
  );
};

export default NotificationDropdown;