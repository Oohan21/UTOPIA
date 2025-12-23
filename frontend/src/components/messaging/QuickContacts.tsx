// components/messaging/QuickContacts.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { User, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { Skeleton } from '@/components/ui/Skeleton';
import { messagingApi } from '@/lib/api/messaging';
import { MessageDialog } from './MessageDialog';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { QuickContact as QuickContactType } from '@/lib/types/messaging';

export function QuickContacts() {
  const [contacts, setContacts] = useState<QuickContactType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { quickContacts: hookContacts } = useMessaging();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);

        // Use data from hook or fetch directly
        if (hookContacts && hookContacts.length > 0) {
          setContacts(hookContacts.slice(0, 6));
        } else {
          // Fallback: fetch from API
          const data: QuickContactType[] = await messagingApi.getQuickContacts();
          const uniqueContacts = Array.from(
            new Map(data.map((contact: QuickContactType) => [contact.id, contact])).values()
          );
          setContacts(uniqueContacts.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        // Set empty array instead of failing
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [hookContacts]);

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-4 w-4" />
            Quick Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-4 w-4" />
            Quick Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No contacts yet</h3>
            <p className="text-sm text-muted-foreground">
              Start messaging users to see them here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-4 w-4" />
          Quick Contacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {contacts.map((contact, index) => {
              // Ensure unique key
              const uniqueKey = `contact-${contact.id}-${index}`;
              const name = contact.first_name && contact.last_name
                ? `${contact.first_name} ${contact.last_name}`
                : contact.email || 'Unknown User';

              return (
                <div
                  key={uniqueKey}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={contact.profile_picture} />
                      <AvatarFallback>
                        {contact.first_name?.[0]}{contact.last_name?.[0] || name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {contact.unread_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-primary text-xs">
                        {Math.min(contact.unread_count, 9)}
                        {contact.unread_count > 9 && '+'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(contact.last_message_at)}
                    </p>
                  </div>

                  <MessageDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    }
                    receiver={{
                      id: contact.id,
                      first_name: contact.first_name || '',
                      last_name: contact.last_name || '',
                      email: contact.email,
                      user_type: contact.user_type || 'user',
                      is_verified: contact.is_verified,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}