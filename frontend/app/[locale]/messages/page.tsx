// app/messages/page.tsx - UPDATED WITH LANG INTEGRATION & MOBILE RESPONSIVE
'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/common/Header/Header";
import { useMessaging } from '@/lib/hooks/useMessaging';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Trash2,
  Archive,
  Check,
  CheckCheck,
  User,
  Clock,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

function MessageItem({ message, isMyMessage, t }: { message: any; isMyMessage: boolean; t: any }) {
  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isMyMessage ? 'flex-row-reverse' : ''
    )}>
      {!isMyMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.profile_picture} />
          <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white">
            {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-3',
        isMyMessage
          ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-br-none'
          : 'bg-muted dark:bg-gray-800 rounded-bl-none dark:text-gray-200'
      )}>
        {/* Show subject for messages that have one */}
        {message.subject && (
          <div className={cn(
            'font-semibold text-sm mb-1',
            isMyMessage ? 'text-primary-foreground/90' : 'text-foreground dark:text-white'
          )}>
            {message.subject}
          </div>
        )}

        {!isMyMessage && (
          <div className="font-semibold text-sm mb-1 dark:text-white">
            {message.sender?.first_name} {message.sender?.last_name}
          </div>
        )}

        <div className="whitespace-pre-wrap break-words dark:text-gray-300">
          {message.content}
        </div>

        {message.attachment && (
          <div className="mt-2">
            <a
              href={message.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm underline hover:no-underline dark:text-blue-400"
            >
              <Paperclip className="h-3 w-3" />
              {t('attachment')}
            </a>
          </div>
        )}

        <div className={cn(
          'text-xs mt-2 flex items-center gap-2',
          isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground dark:text-gray-500'
        )}>
          {message.formatted_time || formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          {isMyMessage && (
            message.is_read ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Conversation List Component
function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  onRefresh,
  t,
}: {
  conversations: any[];
  selectedConversation: any;
  onSelectConversation: (conv: any) => void;
  isLoading: boolean;
  onRefresh: () => void;
  t: any;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.other_user;
    if (!otherUser) return false;

    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.first_name.toLowerCase().includes(searchLower) ||
      otherUser.last_name.toLowerCase().includes(searchLower) ||
      otherUser.email.toLowerCase().includes(searchLower) ||
      conv.last_message_content?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-3 md:p-4 border-b dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
          <Input
            placeholder={t('searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-gray-300 text-sm md:text-base"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-6 md:p-8 text-center text-muted-foreground dark:text-gray-500">
            <MessageSquare className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
            <p className="text-sm md:text-base">{t('noConversations')}</p>
            <p className="text-xs md:text-sm mt-1">{t('startNewConversation')}</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-800">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  'w-full p-3 md:p-4 text-left hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors',
                  selectedConversation?.id === conversation.id && 'bg-muted dark:bg-gray-800'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 md:h-10 md:w-10">
                    <AvatarImage src={conversation.other_user?.profile_picture} />
                    <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-xs">
                      {conversation.other_user?.first_name?.[0]}
                      {conversation.other_user?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold truncate text-sm md:text-base dark:text-white">
                        {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 truncate mt-1">
                      {conversation.last_message_content || t('noMessagesYet')}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {conversation.property && (
                        <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 dark:text-gray-300">
                          {t('property')}
                        </Badge>
                      )}
                      {conversation.unread_count > 0 && (
                        <Badge className="bg-gradient-to-r from-primary to-secondary dark:from-primary/90 dark:to-secondary/90 text-white text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Message Input Component
function MessageInput({
  onSendMessage,
  disabled,
  t,
}: {
  onSendMessage: (content: string, attachment?: File) => void;
  disabled?: boolean;
  t: any;
}) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachment) {
      onSendMessage(message.trim(), attachment || undefined);
      setMessage('');
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('fileSizeError'));
        return;
      }
      setAttachment(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t dark:border-gray-800 p-3 md:p-4">
      {attachment && (
        <div className="mb-2 flex items-center justify-between bg-muted dark:bg-gray-800 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Paperclip className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground dark:text-gray-400" />
            <span className="text-xs md:text-sm truncate dark:text-gray-300">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-300 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAttachment}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 h-9 w-9 md:h-10 md:w-10"
        >
          <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('typeMessage')}
          className="min-h-[50px] md:min-h-[60px] resize-none bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-gray-300 text-sm md:text-base"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <Button
          type="submit"
          size="icon"
          disabled={(!message.trim() && !attachment) || disabled}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary h-9 w-9 md:h-10 md:w-10"
        >
          <Send className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>
    </form>
  );
}

// Main Page Component
export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('messages');
  const {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    unreadCount,
    selectConversation,
    sendThreadMessage,
    markThreadAsRead,
    clearSelection,
    deleteConversation,
    refreshAll,
  } = useMessaging();

  const handleSendMessage = async (content: string, attachment?: File) => {
    if (!selectedConversation) {
      toast.error(t('noConversationSelected'));
      return;
    }

    try {
      await sendThreadMessage(selectedConversation.id, content, attachment);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(t('sendFailed'));
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshAll();
      toast.success(t('refreshSuccess'));
    } catch (error) {
      toast.error(t('refreshFailed'));
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    await selectConversation(conversation);
    // Mark thread as read when selected
    await markThreadAsRead(conversation.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/10">
      <Header/>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400">
                {unreadCount > 0
                  ? t('unreadMessages', { count: unreadCount })
                  : t('allCaughtUp')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 h-8 w-8 md:h-9 md:w-9"
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="default"
              onClick={() => router.push('/messages/new')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary text-xs md:text-sm px-3 md:px-4 h-8 md:h-9"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              {t('newMessage')}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
          {/* Conversations Sidebar - Hidden on mobile when conversation selected */}
          <div className={cn(
            'lg:col-span-1 border-2 border-primary/20 dark:border-primary/30 rounded-xl overflow-hidden flex flex-col bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50 shadow-lg dark:shadow-gray-900/30',
            selectedConversation ? 'hidden lg:flex' : 'flex'
          )}>
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              t={t}
            />
          </div>

          {/* Messages Area */}
          <div className={cn(
            'lg:col-span-2 border-2 border-primary/20 dark:border-primary/30 rounded-xl overflow-hidden flex flex-col bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50 shadow-lg dark:shadow-gray-900/30',
            selectedConversation ? 'col-span-3 lg:col-span-2' : 'hidden lg:flex'
          )}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="border-b dark:border-gray-800 p-3 md:p-4 flex items-center justify-between bg-gradient-to-r from-muted/30 to-muted/10 dark:from-gray-800/30 dark:to-gray-900/10">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSelection}
                      className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
                      <AvatarImage src={selectedConversation.other_user?.profile_picture} />
                      <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-xs">
                        {selectedConversation.other_user?.first_name?.[0]}
                        {selectedConversation.other_user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[calc(100%-120px)]">
                      <h3 className="font-semibold text-sm md:text-base truncate dark:text-white">
                        {selectedConversation.other_user?.first_name} {selectedConversation.other_user?.last_name}
                      </h3>
                      {/* Show subject if available */}
                      {selectedConversation.subject && (
                        <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 font-medium truncate">
                          {t('subject')}: {selectedConversation.subject}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground dark:text-gray-500 truncate">
                        {selectedConversation.other_user?.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-300"
                        onClick={async () => {
                          if (selectedConversation) {
                            if (confirm(t('deleteConfirmation'))) {
                              try {
                                console.log('Starting delete process for conversation:', selectedConversation.id);
                                await deleteConversation(selectedConversation.id);
                                toast.success(t('deleteSuccess'));
                              } catch (error) {
                                console.error('Delete failed:', error);
                              }
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('deleteConversation')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3 md:p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground dark:text-gray-500 py-8">
                      <MessageSquare className="h-12 w-12 md:h-16 md:w-16 mb-3 md:mb-4 opacity-50" />
                      <p className="text-sm md:text-base">{t('noMessagesYet')}</p>
                      <p className="text-xs md:text-sm mt-1 dark:text-gray-400">{t('startConversation')}</p>
                    </div>
                  ) : (
                    <div className="space-y-1 md:space-y-2">
                      {/* Sort messages by creation date to ensure proper ordering */}
                      {messages
                        .slice()
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => (
                          <MessageItem
                            key={`${message.id}-${message.created_at}`}
                            message={message}
                            isMyMessage={message.sender?.id === user?.id}
                            t={t}
                          />
                        ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={isLoading}
                  t={t}
                />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 md:p-8 text-muted-foreground dark:text-gray-500">
                <MessageSquare className="h-16 w-16 md:h-24 md:w-24 mb-4 md:mb-6 opacity-50" />
                <h3 className="text-lg md:text-xl font-semibold mb-2 dark:text-white">{t('noConversationSelectedTitle')}</h3>
                <p className="text-center max-w-md mb-4 md:mb-6 text-sm md:text-base dark:text-gray-400">
                  {t('noConversationSelectedDesc')}
                </p>
                <Button 
                  onClick={() => router.push('/messages/new')}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary text-xs md:text-sm px-3 md:px-4 h-8 md:h-9"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  {t('startNewConversation')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {conversations.length === 0 && !isLoading && (
          <div className="border-2 border-primary/20 dark:border-primary/30 rounded-xl p-6 md:p-8 lg:p-12 text-center bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50 shadow-lg dark:shadow-gray-900/30 mt-4 md:mt-6">
            <MessageSquare className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-muted-foreground dark:text-gray-600" />
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 dark:text-white">{t('emptyStateTitle')}</h3>
            <p className="text-muted-foreground dark:text-gray-400 max-w-md mx-auto mb-6 md:mb-8 text-sm md:text-base">
              {t('emptyStateDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button
                onClick={() => router.push('/listings')}
                className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary text-xs md:text-sm px-3 md:px-4 h-8 md:h-9"
              >
                {t('browseProperties')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/messages/new')}
                className="gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 text-xs md:text-sm px-3 md:px-4 h-8 md:h-9"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                {t('startNewConversation')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}