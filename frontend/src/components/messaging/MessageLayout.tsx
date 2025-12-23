// app/components/messaging/MessageLayout.tsx
import React, { useState, useEffect } from 'react';
import { useMessaging } from '@/lib/hooks/useMessaging';
import MessageSidebar from './MessageSidebar';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';
import MessageHeader from './MessageHeader';
import NewMessageModal from './NewMessageModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Plus, RefreshCw, Inbox, Archive, Users, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/Scroll-area';

interface MessageLayoutProps {
  initialThreadId?: number;
  initialContactId?: number;
}

export const MessageLayout: React.FC<MessageLayoutProps> = ({
  initialThreadId,
  initialContactId,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<number | undefined>(initialThreadId);
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived' | 'contacts'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    threads,
    messages,
    quickContacts,
    isLoading,
    hasUnreadMessages,
    totalUnreadCount,
    fetchThreads,
    fetchMessages,
    refreshAll,
    markThreadAsRead,
  } = useMessaging();

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThreadId && selectedThread?.unread_count && selectedThread.unread_count > 0) {
      markThreadAsRead(selectedThreadId);
    }
  }, [selectedThreadId, selectedThread?.unread_count]);

  // Filter threads based on active tab
  const filteredThreads = threads.filter(thread => {
    if (activeTab === 'archived') return !thread.is_active;
    if (activeTab === 'inbox') return thread.is_active;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-50">
      {/* Left Sidebar - Threads List */}
      <div className={`
        flex flex-col border-r bg-white transition-all duration-300
        ${sidebarCollapsed ? 'w-20' : 'w-96'}
      `}>
        {/* Header */}
        <div className="p-4 border-b">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                  {hasUnreadMessages && (
                    <p className="text-sm text-gray-500">
                      {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshAll}
                    disabled={isLoading}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowNewMessage(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshAll}
                disabled={isLoading}
                className="h-10 w-10"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="icon"
                onClick={() => setShowNewMessage(true)}
                className="h-10 w-10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!sidebarCollapsed && (
          <div className="px-4 pt-2">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="inbox" className="relative gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                  {hasUnreadMessages && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                      {totalUnreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  <Archive className="h-4 w-4" />
                  Archived
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-2">
                  <Users className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Threads/Contacts List */}
        <ScrollArea className="flex-1">
          <MessageSidebar
            threads={filteredThreads}
            quickContacts={quickContacts}
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
            activeTab={activeTab}
            searchQuery={searchQuery}
            collapsed={sidebarCollapsed}
          />
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-center"
          >
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            <MessageHeader
              thread={selectedThread}
              onBack={() => setSelectedThreadId(undefined)}
            />
            <div className="flex-1 overflow-hidden">
              <MessageThread
                threadId={selectedThread.id}
                messages={messages}
                isLoading={isLoading}
              />
            </div>
            <div className="border-t bg-white p-4">
              <MessageComposer
                threadId={selectedThread.id}
                onMessageSent={() => {
                  fetchMessages(selectedThread.id);
                  fetchThreads();
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-8">
              <Mail className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Your Messages
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-8">
              Select a conversation to view messages, or start a new conversation with contacts.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowNewMessage(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Message
              </Button>
              <Button
                variant="outline"
                onClick={refreshAll}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onMessageSent={() => {
            refreshAll();
            setShowNewMessage(false);
          }}
        />
      )}
    </div>
  );
};

export default MessageLayout;