import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Check, ExternalLink, Trash2, Filter, CheckCircle, AlertCircle, Info, Bell, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { Notification } from '@/lib/types/notification';
import { notificationApi } from '@/lib/api/notification';
import NotificationPreferences from './NotificationPreferences';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const NotificationList: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread' | 'property'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState<Record<string, string>>({});
  const t = useTranslations('notifications');

  useEffect(() => {
    loadNotifications();
    loadNotificationTypes();
  }, [filter]);

  const loadNotifications = async () => {
    let params: any = {};
    if (filter === 'unread') params.is_read = false;
    if (filter === 'property') params.type = 'property_related';

    await fetchNotifications(params);
  };

  const loadNotificationTypes = async () => {
    try {
      const response = await notificationApi.getNotificationTypes();
      setNotificationTypes(response.type_descriptions);
    } catch (error) {
      console.error('Failed to load notification types:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'property_rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
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

  const getNotificationBadge = (type: string) => {
    const typeName = t(`types.${type}`, { defaultValue: type.replace(/_/g, ' ') });
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
        {typeName}
      </span>
    );
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('deleteConfirm'))) {
      await deleteNotification(id);
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.data?.property_url) {
      return notification.data.property_url;
    }
    if (notification.content_type === 'property' && notification.object_id) {
      return `/listings/${notification.object_id}`; 
    }
    // Message-related notifications
    if (notification.content_type === 'message' && notification.object_id) {
      return `/messages?conversation=${notification.object_id}`;
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
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'property') {
      return ['property_approved', 'property_rejected', 'property_changes_requested',
        'property_match', 'price_change', 'new_listing'].includes(notification.notification_type);
    }
    return true;
  });

  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'reject':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'changes':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-4 sm:px-6 py-4 border-b dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {t('unreadCount', { count: unreadCount })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowPreferences(true)}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.preferences')}</span>
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">{t('markAllRead')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 border-b dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('common.filter', { defaultValue: 'Filter' })}:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'unread', 'property'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-colors",
                  filter === filterType
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {t(`filters.${filterType}`)}
                {filterType === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showPreferences && (
        <NotificationPreferences onClose={() => setShowPreferences(false)} />
      )}

      <div className="divide-y dark:divide-gray-700">
        {isLoading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-3 sm:mt-4 text-gray-600 dark:text-gray-400">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('noNotifications')}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {filter === 'unread'
                ? t('noUnread')
                : t('allCaughtUp')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                !notification.is_read && 'bg-blue-50 dark:bg-blue-900/20'
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <h3 className={cn(
                        "text-base sm:text-lg font-semibold line-clamp-1",
                        !notification.is_read 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {notification.title}
                      </h3>
                      {getNotificationBadge(notification.notification_type)}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          title={t('markRead')}
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                    {notification.message}
                  </p>

                  {/* Property approval details */}
                  {notification.data?.property_id && (
                    <div className="mb-3 sm:mb-4 p-3 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                            {t('propertyInfo.property')}: {notification.data.property_title || t('propertyInfo.unknown')}
                          </h4>
                          {notification.data.action && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                getBadgeColor(notification.data.action)
                              )}>
                                {t(`badges.${notification.data.action}`)}
                              </span>
                              {notification.data.admin_name && (
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {t('propertyInfo.by')} {notification.data.admin_name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {notification.data.property_url && (
                          <a
                            href={notification.data.property_url}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm sm:text-base transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('propertyInfo.viewProperty')}
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                          </a>
                        )}
                      </div>

                      {notification.data.notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-400">{notification.data.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-500 gap-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span>
                        {format(new Date(notification.created_at), 'MMM d, yyyy · h:mm a')}
                      </span>
                      <span className="flex items-center gap-1">
                        {notification.sent_via === 'email' && <Mail className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {notification.sent_via === 'push' && <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {t(`preferences.sentVia.${notification.sent_via}`, { defaultValue: notification.sent_via })}
                      </span>
                    </div>
                    {!notification.is_read && (
                      <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                        {t('badges.unread')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;