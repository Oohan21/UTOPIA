import React, { useEffect, useState } from 'react';
import { X, Save, Bell, Mail, Smartphone, Clock } from 'lucide-react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import type { NotificationPreferences } from '@/lib/types/notification';
import { useTranslations } from 'next-intl';

interface NotificationPreferencesProps {
  onClose: () => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const { preferences, fetchPreferences, updatePreferences } = useNotificationStore();
  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('notifications');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      await fetchPreferences();
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setError(t('errors.loadPreferencesFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleChange = (field: keyof NotificationPreferences, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updatePreferences(formData);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.detail || t('preferences.actions.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
            {t('common.loading', { defaultValue: 'Loading...' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t('preferences.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {t('preferences.description')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm sm:text-base">{error}</p>
            </div>
          )}

          <div className="space-y-6 sm:space-y-8">
            {/* Email Notifications */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('preferences.email.title')}
                </h3>
              </div>
              <div className="space-y-4 pl-8 sm:pl-9">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                      {t('preferences.email.enabled')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t('preferences.email.enabledDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleChange('email_enabled', !formData.email_enabled)}
                    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${formData.email_enabled 
                      ? 'bg-blue-600 dark:bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${formData.email_enabled 
                        ? 'translate-x-5 sm:translate-x-6' 
                        : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {formData.email_enabled && (
                  <div className="space-y-3 border-t dark:border-gray-700 pt-4">
                    {[
                      { key: 'email_property_approved', label: 'propertyApproved', desc: 'propertyApprovedDesc' },
                      { key: 'email_property_rejected', label: 'propertyRejected', desc: 'propertyRejectedDesc' },
                      { key: 'email_property_changes', label: 'propertyChanges', desc: 'propertyChangesDesc' },
                      { key: 'email_inquiry_response', label: 'inquiryResponse', desc: 'inquiryResponseDesc' },
                      { key: 'email_messages', label: 'messages', desc: 'messagesDesc' },
                      { key: 'email_system', label: 'system', desc: 'systemDesc' },
                      { key: 'email_promotions', label: 'promotions', desc: 'promotionsDesc' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <label className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                            {t(`preferences.email.${label}`)}
                          </label>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {t(`preferences.email.${desc}`)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleChange(key as any, !formData[key as keyof NotificationPreferences])}
                          className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${formData[key as keyof NotificationPreferences] 
                            ? 'bg-blue-600 dark:bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span
                            className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${formData[key as keyof NotificationPreferences] 
                              ? 'translate-x-5 sm:translate-x-6' 
                              : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('preferences.push.title')}
                </h3>
              </div>
              <div className="space-y-4 pl-8 sm:pl-9">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                      {t('preferences.push.enabled')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t('preferences.push.enabledDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleChange('push_enabled', !formData.push_enabled)}
                    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${formData.push_enabled 
                      ? 'bg-blue-600 dark:bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${formData.push_enabled 
                        ? 'translate-x-5 sm:translate-x-6' 
                        : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {formData.push_enabled && (
                  <div className="space-y-3 border-t dark:border-gray-700 pt-4">
                    {[
                      { key: 'push_property_approved', label: 'propertyApproved' },
                      { key: 'push_property_rejected', label: 'propertyRejected' },
                      { key: 'push_property_changes', label: 'propertyChanges' },
                      { key: 'push_inquiry_response', label: 'inquiryResponse' },
                      { key: 'push_messages', label: 'messages' },
                      { key: 'push_promotions', label: 'promotions' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                          {t(`preferences.email.${label}`)}
                        </label>
                        <button
                          onClick={() => handleChange(key as any, !formData[key as keyof NotificationPreferences])}
                          className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${formData[key as keyof NotificationPreferences] 
                            ? 'bg-blue-600 dark:bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span
                            className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${formData[key as keyof NotificationPreferences] 
                              ? 'translate-x-5 sm:translate-x-6' 
                              : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SMS Notifications */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('preferences.sms.title')}
                </h3>
              </div>
              <div className="space-y-4 pl-8 sm:pl-9">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                      {t('preferences.sms.enabled')}
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t('preferences.sms.enabledDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleChange('sms_enabled', !formData.sms_enabled)}
                    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${formData.sms_enabled 
                      ? 'bg-blue-600 dark:bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${formData.sms_enabled 
                        ? 'translate-x-5 sm:translate-x-6' 
                        : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {formData.sms_enabled && (
                  <div className="flex items-center justify-between border-t dark:border-gray-700 pt-4">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-gray-300 text-sm sm:text-base">
                        {t('preferences.sms.urgentOnly')}
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {t('preferences.sms.urgentOnlyDesc')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleChange('sms_urgent', !formData.sms_urgent)}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${formData.sms_urgent 
                        ? 'bg-blue-600 dark:bg-blue-500' 
                        : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${formData.sms_urgent 
                          ? 'translate-x-5 sm:translate-x-6' 
                          : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Frequency */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('preferences.frequency.title')}
                </h3>
              </div>
              <div className="space-y-4 pl-8 sm:pl-9">
                <div>
                  <label className="block font-medium text-gray-900 dark:text-gray-300 mb-2 text-sm sm:text-base">
                    {t('preferences.frequency.frequencyLabel')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['immediate', 'daily', 'weekly'] as const).map((frequency) => (
                      <button
                        key={frequency}
                        onClick={() => handleChange('notification_frequency', frequency)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors ${formData.notification_frequency === frequency
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {t(`preferences.frequency.${frequency}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-4">
                  <label className="block font-medium text-gray-900 dark:text-gray-300 mb-2 text-sm sm:text-base">
                    {t('preferences.frequency.quietHours')}
                  </label>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                    {t('preferences.frequency.quietHoursDesc')}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('preferences.frequency.start')}
                      </label>
                      <input
                        type="time"
                        value={formData.quiet_hours_start || ''}
                        onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm self-center">
                      {t('preferences.frequency.to')}
                    </span>
                    <div className="flex-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('preferences.frequency.end')}
                      </label>
                      <input
                        type="time"
                        value={formData.quiet_hours_end || ''}
                        onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('preferences.actions.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 sm:px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('preferences.actions.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('preferences.actions.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;