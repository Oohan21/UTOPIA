'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messagingApi } from '@/lib/api/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { Skeleton } from '@/components/ui/Skeleton';
import { Building, Send, Paperclip, CheckCircle, User } from 'lucide-react';
import { MessageDialog } from './MessageDialog';
import { cn } from '@/lib/utils';

interface ThreadMessagesProps {
  thread: any;
  onMessageSent: () => void;
}

export function ThreadMessages({ thread, onMessageSent }: ThreadMessagesProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['thread-messages', thread.id],
    queryFn: () => messagingApi.getThreadMessages(thread.id),
    enabled: !!thread.id,
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await messagingApi.sendThreadMessage(thread.id, {
        content: newMessage,
        message_type: 'general'
      });
      setNewMessage('');
      onMessageSent();
      refetch(); // Refresh messages to show the new one
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const otherParticipant = thread.participant_info;

  return (
    <div className="h-[calc(100vh-340px)] min-h-[500px] flex flex-col">
      {/* Thread Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.profile_picture} />
              <AvatarFallback>
                {otherParticipant?.name?.[0] || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {otherParticipant?.name || 'Unknown User'}
              </h3>
              {thread.property && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {thread.property.title}
                </p>
              )}
            </div>
          </div>
          
          <MessageDialog
            trigger={
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Reply
              </Button>
            }
            receiver={{
              id: otherParticipant?.id,
              first_name: otherParticipant?.name?.split(' ')[0] || '',
              last_name: otherParticipant?.name?.split(' ')[1] || '',
              email: otherParticipant?.email,
              user_type: 'user',
              is_verified: otherParticipant?.is_verified
            }}
            property={thread.property}
          />
        </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.results?.map((message: any) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.is_my_message ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.is_my_message
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-sm">
                      {message.sender.first_name} {message.sender.last_name}
                    </div>
                    <span className="text-xs opacity-75">
                      {message.formatted_time}
                    </span>
                    {message.is_read && message.is_my_message && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.attachment && (
                    <div className="mt-2 pt-2 border-t">
                      <a
                        href={message.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        Attachment
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage}>
          <div className="space-y-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="min-h-[80px] resize-none"
              disabled={isSending}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleSendMessage(e as any);
                }
              }}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Press Ctrl+Enter to send • Shift+Enter for new line
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSending}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  size="sm"
                >
                  {isSending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}