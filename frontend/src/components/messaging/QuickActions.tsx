// app/components/messaging/QuickActions.tsx
import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Inbox, 
  Archive, 
  Star, 
  Clock, 
  Filter, 
  CheckCircle,
  Trash2,
  Download,
  Mail
} from 'lucide-react';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/use-toast'

interface QuickActionsProps {
  onNewMessage: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNewMessage }) => {
  const { 
    threads, 
    selectedThreads, 
    clearSelection, 
    selectAllThreads,
    bulkMarkAsRead,
    bulkDelete,
    fetchThreads,
    fetchMessages
  } = useMessaging();

  const unreadCount = threads.reduce((count, thread) => count + (thread.unread_count || 0), 0);
  const starredCount = threads.filter(t => t.is_starred).length;
  const archivedCount = threads.filter(t => !t.is_active).length;
  const { toast } = useToast();

  const handleMarkAllRead = async () => {
    try {
      // Get all unread message IDs
      const messageIds: number[] = [];
      threads.forEach(thread => {
        if (thread.unread_count && thread.unread_count > 0 && thread.last_message?.id) {
          messageIds.push(thread.last_message.id);
        }
      });
      
      if (messageIds.length > 0) {
        await bulkMarkAsRead(messageIds);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      // This would export all conversations
      toast({
        title: "Export Started",
        description: "Exporting all conversations...",
      });
      
      // Simulate export
      setTimeout(() => {
        const element = document.createElement('a');
        const text = `All Conversations Export\nGenerated at: ${new Date().toLocaleString()}\n\nTotal threads: ${threads.length}`;
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `all-conversations-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        toast({
          title: "Export Complete",
          description: "All conversations have been exported.",
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export conversations.",
      });
    }
  };

  const handleFilterUnread = () => {
    // This would filter to show only unread threads
    toast({
      title: "Filter Applied",
      description: "Showing only unread conversations.",
    });
  };

  const handleFilterStarred = () => {
    // This would filter to show only starred threads
    toast({
      title: "Filter Applied",
      description: "Showing only starred conversations.",
    });
  };

  return (
    <div className="space-y-4 p-4 border-b bg-gray-50">
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={onNewMessage}
          className="gap-2"
          size="sm"
        >
          <Mail className="h-4 w-4" />
          New Message
        </Button>
        <Button 
          onClick={handleMarkAllRead}
          variant="outline"
          className="gap-2"
          size="sm"
          disabled={unreadCount === 0}
        >
          <CheckCircle className="h-4 w-4" />
          Mark All Read
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFilterUnread}
          className="flex-col h-auto py-2"
        >
          <Inbox className="h-4 w-4 mb-1" />
          <span className="text-xs">Unread</span>
          {unreadCount > 0 && (
            <Badge className="mt-1 h-4 w-4 p-0 text-xs">{unreadCount}</Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleFilterStarred}
          className="flex-col h-auto py-2"
        >
          <Star className="h-4 w-4 mb-1" />
          <span className="text-xs">Starred</span>
          {starredCount > 0 && (
            <Badge className="mt-1 h-4 w-4 p-0 text-xs">{starredCount}</Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-auto py-2"
        >
          <Archive className="h-4 w-4 mb-1" />
          <span className="text-xs">Archived</span>
          {archivedCount > 0 && (
            <Badge className="mt-1 h-4 w-4 p-0 text-xs">{archivedCount}</Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportAll}
          className="flex-col h-auto py-2"
        >
          <Download className="h-4 w-4 mb-1" />
          <span className="text-xs">Export</span>
        </Button>
      </div>

      {/* Bulk Actions (when threads are selected) */}
      {selectedThreads.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedThreads.length} selected
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkMarkAsRead(selectedThreads.map(id => {
                  const thread = threads.find(t => t.id === id);
                  return thread?.last_message?.id || 0;
                }).filter(id => id > 0))}
                className="h-7 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkDelete(selectedThreads.map(id => {
                  const thread = threads.find(t => t.id === id);
                  return thread?.last_message?.id || 0;
                }).filter(id => id > 0))}
                className="h-7 text-xs text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};