'use client';

import React, { useState } from 'react';
import { MessageSquare, Building, MoreVertical, MailOpen } from 'lucide-react';
import { messagingApi } from '@/lib/api/messaging';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

interface InboxProps {
  searchQuery?: string;
  showArchived?: boolean;
  selectedThreadId?: number | null;
  onThreadSelect?: (thread: any) => void;
}

export function Inbox({ 
  searchQuery = '', 
  showArchived = false,
  selectedThreadId = null,
  onThreadSelect 
}: InboxProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  const {
    threads,
    isLoading,
    error,
    markThreadAsRead,
  } = useMessaging();

  // Filter threads based on search
  const filteredThreads = threads.filter((thread) => {
    // Archived filtering
    if (!showArchived && !thread.is_active) {
      return false;
    }

    // Search filtering
    if (localSearch) {
      const searchLower = localSearch.toLowerCase();
      return (
        thread.subject.toLowerCase().includes(searchLower) ||
        thread.participants?.some((p: any) => 
          p.first_name?.toLowerCase().includes(searchLower) ||
          p.last_name?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower)
        ) ||
        (thread.property?.title?.toLowerCase().includes(searchLower) || false)
      );
    }

    return true;
  });

  const handleThreadSelect = async (thread: any) => {
    // Mark as read if there are unread messages
    if (thread.unread_count > 0) {
      await markThreadAsRead(thread.id);
    }

    // Call the parent handler
    if (onThreadSelect) {
      onThreadSelect(thread);
    }
  };

  const handleArchiveThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await messagingApi.archiveThread(threadId);
      // Refresh threads
      window.location.reload();
    } catch (error) {
      console.error('Failed to archive thread:', error);
    }
  };

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500 mx-auto mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Error Loading Messages</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      {isLoading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-8 px-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold text-sm mb-1">No messages</h3>
          <p className="text-xs text-muted-foreground">
            {localSearch ? 'No messages match your search' : 'Start a conversation'}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => handleThreadSelect(thread)}
              className={cn(
                "w-full text-left p-3 hover:bg-muted/30 transition-colors cursor-pointer border-l-4",
                selectedThreadId === thread.id 
                  ? 'bg-primary/5 border-l-primary' 
                  : 'border-l-transparent'
              )}
            >
              <div className="space-y-2">
                {/* Thread Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={thread.participant_info?.profile_picture} />
                      <AvatarFallback className="text-xs">
                        {thread.participant_info?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">
                          {thread.participant_info?.name || 'Unknown User'}
                        </span>
                        {thread.unread_count > 0 && (
                          <Badge className="h-5 px-1.5 min-w-5 bg-primary text-xs">
                            {thread.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {(thread.formatted_last_activity)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {thread.unread_count > 0 && (
                          <DropdownMenuItem onClick={() => markThreadAsRead(thread.id)}>
                            <MailOpen className="h-4 w-4 mr-2" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => handleArchiveThread(thread.id, e)}>
                          <Building className="h-4 w-4 mr-2" />
                          {thread.is_active ? 'Archive' : 'Unarchive'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Thread Content */}
                <div>
                  <p className="text-sm font-medium truncate mb-1">
                    {thread.subject}
                  </p>
                  {thread.last_message && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {thread.last_message.content}
                    </p>
                  )}
                </div>
                
                {/* Property Info */}
                {thread.property && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{thread.property.title}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}