// app/components/messaging/MessageSidebar.tsx
import React from 'react';
import { MessageThread, QuickContact } from '@/lib/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Building2, Calendar, Archive, User, Star, Pin, CheckCheck, Trash2, MoreVertical, CheckCircle } from 'lucide-react';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

interface MessageSidebarProps {
  threads: MessageThread[];
  quickContacts: QuickContact[];
  selectedThreadId?: number;
  onSelectThread: (threadId: number) => void;
  activeTab: 'inbox' | 'archived' | 'contacts';
  searchQuery: string;
  collapsed?: boolean;
}

export const MessageSidebar: React.FC<MessageSidebarProps> = ({
  threads,
  quickContacts,
  selectedThreadId,
  onSelectThread,
  activeTab,
  searchQuery,
  collapsed = false,
}) => {
  const {
    archiveThread,
    unarchiveThread,
    markThreadAsRead,
    toggleStarThread,
    togglePinThread,
    toggleThreadSelection,
    selectedThreads,
    clearSelection,
    selectAllThreads,
    bulkMarkAsRead,
    bulkDelete,
  } = useMessaging();

  const { toast } = useToast();

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        thread.subject.toLowerCase().includes(searchLower) ||
        thread.participants.some(p =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchLower)
        ) ||
        (thread.property?.title?.toLowerCase().includes(searchLower)) ||
        (thread.inquiry?.toString().includes(searchLower))
      );
    }
    return true;
  });

  const filteredContacts = quickContacts.filter(contact => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleThreadAction = async (threadId: number, action: 'archive' | 'unarchive' | 'mark_read') => {
    try {
      if (action === 'archive') {
        await archiveThread(threadId);
      } else if (action === 'unarchive') {
        await unarchiveThread(threadId);
      } else if (action === 'mark_read') {
        await markThreadAsRead(threadId);
      }
    } catch (error) {
      console.error('Failed to perform thread action:', error);
    }
  };

  const handleThreadClick = (threadId: number, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd click for multi-select
      toggleThreadSelection(threadId);
    } else if (e.shiftKey) {
      // Shift click for range select
      // Implementation for range selection
    } else {
      // Normal click
      clearSelection();
      onSelectThread(threadId);
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedThreads.length > 0) {
      try {
        // Get all message IDs from selected threads
        const messageIds: number[] = [];
        selectedThreads.forEach(threadId => {
          const thread = threads.find(t => t.id === threadId);
          if (thread?.last_message?.id) {
            messageIds.push(thread.last_message.id);
          }
        });

        if (messageIds.length > 0) {
          await bulkMarkAsRead(messageIds);
        }
      } catch (error) {
        console.error('Error bulk marking as read:', error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (selectedThreads.length > 0) {
      try {
        for (const threadId of selectedThreads) {
          await archiveThread(threadId);
        }
        clearSelection();
      } catch (error) {
        console.error('Error bulk archiving:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedThreads.length > 0) {
      try {
        // Get all message IDs from selected threads
        const messageIds: number[] = [];
        selectedThreads.forEach(threadId => {
          const thread = threads.find(t => t.id === threadId);
          if (thread?.last_message?.id) {
            messageIds.push(thread.last_message.id);
          }
        });

        if (messageIds.length > 0) {
          await bulkDelete(messageIds);
        }
        clearSelection();
      } catch (error) {
        console.error('Error bulk deleting:', error);
      }
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return then.toLocaleDateString();
  };

  if (collapsed) {
    return (
      <div className="py-2 space-y-2">
        {filteredThreads.slice(0, 10).map((thread) => (
          <div key={thread.id} className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "h-12 w-12 rounded-full relative",
                selectedThreadId === thread.id && "bg-blue-100"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={thread.participant_info?.profile_picture} />
                <AvatarFallback className="text-xs">
                  {thread.participant_info?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {thread.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">{Math.min(thread.unread_count, 9)}</span>
                </div>
              )}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  const renderThreadItem = (thread: MessageThread) => (
    <div
      key={thread.id}
      onClick={(e) => handleThreadClick(thread.id, e)}
      onContextMenu={(e) => {
        e.preventDefault();
        toggleThreadSelection(thread.id);
      }}
      className={cn(
        'p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors group relative',
        selectedThreadId === thread.id && 'bg-blue-50 border-l-4 border-l-blue-500',
        selectedThreads.includes(thread.id) && 'bg-blue-100'
      )}
    >

      {/* Selection checkbox */}
      {selectedThreads.includes(thread.id) && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar with unread indicator */}
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={thread.participant_info?.profile_picture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
              {thread.participant_info?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {thread.unread_count > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-semibold">
                {Math.min(thread.unread_count, 9)}
              </span>
            </div>
          )}
        </div>

        {/* Thread Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="font-semibold text-gray-900 truncate">
              {thread.participant_info?.name || 'Unknown User'}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {getTimeAgo(thread.updated_at)}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {thread.unread_count > 0 && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleThreadAction(thread.id, 'mark_read');
                    }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  {thread.is_active ? (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleThreadAction(thread.id, 'archive');
                    }}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleThreadAction(thread.id, 'unarchive');
                    }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Unarchive
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    toggleStarThread(thread.id);
                  }}>
                    <Star className={cn("h-4 w-4 mr-2", thread.is_starred && "fill-yellow-400 text-yellow-400")} />
                    {thread.is_starred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    togglePinThread(thread.id);
                  }}>
                    <Pin className={cn("h-4 w-4 mr-2", thread.is_pinned && "fill-blue-400 text-blue-400")} />
                    {thread.is_pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Property/Inquiry Badges */}
          <div className="flex items-center gap-2 mb-2">
            {thread.property && (
              <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                <Building2 className="h-3 w-3" />
                {thread.property.title}
              </Badge>
            )}
            {thread.inquiry && (
              <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                <Calendar className="h-3 w-3" />
                Inquiry #{thread.inquiry}
              </Badge>
            )}
          </div>

          {/* Message Preview */}
          <div className="text-sm text-gray-600 mb-1 line-clamp-1">
            {thread.last_message?.content || thread.subject}
          </div>

          {/* Status Indicator */}
          {thread.unread_count > 0 ? (
            <div className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></div>
              {thread.unread_count} new message{thread.unread_count !== 1 ? 's' : ''}
            </div>
          ) : thread.last_message ? (
            <div className="text-xs text-gray-500">
              Seen • {getTimeAgo(thread.last_message.created_at)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderContactItem = (contact: QuickContact) => (
    <div
      key={contact.id}
      onClick={() => {
        if (contact.thread_id) {
          onSelectThread(contact.thread_id);
        }
      }}
      className="p-3 border-b hover:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.profile_picture} />
          <AvatarFallback>
            {contact.first_name[0]}{contact.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {contact.first_name} {contact.last_name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {contact.email}
          </div>
          {contact.property && (
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {contact.property.title}
            </div>
          )}
        </div>
        {contact.unread_count > 0 && (
          <Badge className="bg-blue-500 text-white min-w-6 h-6 flex items-center justify-center">
            {contact.unread_count}
          </Badge>
        )}
      </div>
    </div>
  );

  if (activeTab === 'contacts') {
    return (
      <div className="py-2">
        {filteredContacts.length > 0 ? (
          filteredContacts.map(renderContactItem)
        ) : (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No contacts found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-2">
      {filteredThreads.length > 0 ? (
        filteredThreads.map(renderThreadItem)
      ) : (
        <div className="text-center py-8 text-gray-500">
          {activeTab === 'archived' ? (
            <>
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No archived conversations</p>
              <p className="text-sm mt-1">Archived conversations will appear here</p>
            </>
          ) : (
            <>
              <svg className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a new conversation to begin messaging</p>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderBulkActions = () => {
    if (selectedThreads.length === 0) return null;

    return (
      <div className="sticky top-0 z-10 bg-white border-b p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-sm">
            {selectedThreads.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-8 text-xs"
          >
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkMarkAsRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkArchive}
            className="h-8 text-xs"
          >
            <Archive className="h-3 w-3 mr-1" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="h-8 text-xs text-red-600"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-2">
      {renderBulkActions()}
      {/* Rest of the component... */}
    </div>
  );
};

export default MessageSidebar;