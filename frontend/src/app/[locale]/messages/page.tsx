// app/dashboard/messages/page.tsx
'use client';

import React from 'react';
import Header from '@/components/common/Header/Header'
import MessageLayout from '@/components/messaging/MessageLayout';
import MessageAnalytics from '@/components/messaging/MessageAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Users, BarChart3, Inbox } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="container mx-auto p-6">
      <Header/>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-gray-500">
              Communicate with clients, agents, and property owners
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Inbox className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Users className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Inbox className="h-4 w-4 mr-2" />
                    Inbox
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Unread Messages
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Contacts
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Message Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'General', count: 12, color: 'bg-blue-500' },
                      { label: 'Inquiries', count: 8, color: 'bg-green-500' },
                      { label: 'Offers', count: 5, color: 'bg-amber-500' },
                      { label: 'Viewings', count: 3, color: 'bg-purple-500' },
                    ].map((type) => (
                      <div key={type.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${type.color}`} />
                          <span className="text-sm">{type.label}</span>
                        </div>
                        <span className="text-sm font-medium">{type.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Messaging Interface */}
            <div className="lg:col-span-3">
              <MessageLayout />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <MessageAnalytics />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Message Settings</CardTitle>
              <CardDescription>
                Configure your messaging preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Notification Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Email notifications for new messages</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span>Push notifications</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" />
                      <span>Desktop notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Auto-Reply Settings</h4>
                  <textarea
                    className="w-full h-32 border rounded-lg p-3"
                    placeholder="Set an automatic reply for when you're away..."
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-3">Signature</h4>
                  <textarea
                    className="w-full h-24 border rounded-lg p-3"
                    placeholder="Add a signature to your messages..."
                    defaultValue="Best regards,\n[Your Name]"
                  />
                </div>

                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}