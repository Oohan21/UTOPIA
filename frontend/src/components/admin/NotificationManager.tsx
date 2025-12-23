// src/components/admin/NotificationManager.tsx
'use client';

import React, { useState } from 'react';
import { Send, Users, Bell, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'react-hot-toast';

const NotificationManager = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    target: 'all',
    userType: '',
    sendEmail: false,
    sendPush: true,
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let users: number[] = [];
      
      if (formData.target === 'specific' && selectedUsers.length > 0) {
        users = selectedUsers;
      } else if (formData.target === 'type' && formData.userType) {
        // Get users by type - would need API endpoint
        // const response = await adminApi.getUsers({ user_type: formData.userType });
        // users = response.results.map(u => u.id);
      } else {
        // All users
        users = [];
      }

      await adminApi.sendBulkNotification({
        users,
        title: formData.title,
        message: formData.message,
        type: formData.type,
      });

      toast.success('Notification sent successfully!');
      setFormData({
        title: '',
        message: '',
        type: 'system',
        target: 'all',
        userType: '',
        sendEmail: false,
        sendPush: true,
      });
      setSelectedUsers([]);
    } catch (err) {
      toast.error('Failed to send notification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Notification Manager
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Send notifications to users via email or in-app messages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Compose Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Notification message..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Notification Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System Notification</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="update">Platform Update</SelectItem>
                        <SelectItem value="maintenance">Maintenance Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target">Target Audience</Label>
                    <Select
                      value={formData.target}
                      onValueChange={(value) => setFormData({ ...formData, target: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="type">By User Type</SelectItem>
                        <SelectItem value="specific">Specific Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.target === 'type' && (
                  <div>
                    <Label htmlFor="userType">User Type</Label>
                    <Select
                      value={formData.userType}
                      onValueChange={(value) => setFormData({ ...formData, userType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Regular Users</SelectItem>
                        <SelectItem value="admin">Administrators</SelectItem>
                        <SelectItem value="agent">Agents</SelectItem>
                        <SelectItem value="premium">Premium Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Delivery Methods</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendPush"
                        checked={formData.sendPush}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, sendPush: checked as boolean })
                        }
                      />
                      <Label htmlFor="sendPush">In-App Notification</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendEmail"
                        checked={formData.sendEmail}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, sendEmail: checked as boolean })
                        }
                      />
                      <Label htmlFor="sendEmail">Email Notification</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreview(!preview)}
                  >
                    {preview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Stats */}
        <div className="space-y-6">
          {/* Preview */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
                        {formData.title || 'Notification Title'}
                      </span>
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        Now
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {formData.message || 'Notification message will appear here...'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    This is how the notification will appear to users.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm">Sent Today</span>
                  </div>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm">Active Users</span>
                  </div>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open Rate</span>
                  <span className="font-medium text-green-600">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Click Rate</span>
                  <span className="font-medium text-blue-600">32%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Selection (if specific users selected) */}
      {formData.target === 'specific' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Select users to receive this notification. {selectedUsers.length} users selected.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Mock user list - replace with actual user data */}
                {[1, 2, 3, 4, 5, 6].map((id) => (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedUsers.includes(id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div>
                        <p className="text-sm font-medium">User {id}</p>
                        <p className="text-xs text-gray-500">user{id}@example.com</p>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedUsers.includes(id)}
                      onCheckedChange={() => handleUserSelect(id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationManager;