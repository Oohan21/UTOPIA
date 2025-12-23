// app/components/messaging/MessageThread.tsx
import React, { useEffect, useRef } from 'react';
import { Message } from '@/lib/types/messaging';
import MessageBubble from './MessageBubble';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { useInView } from 'react-intersection-observer';
import { useMessaging } from '@/lib/hooks/useMessaging';

interface MessageThreadProps {
  threadId: number;
  messages: Message[];
  isLoading: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  threadId,
  messages,
  isLoading,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreRef, inView } = useInView();
  const { markThreadAsRead } = useMessaging();

  // Mark thread as read when component mounts
  useEffect(() => {
    const markRead = async () => {
      await markThreadAsRead(threadId);
    };
    markRead();
  }, [threadId]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="px-6 py-4 space-y-8">
        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-4" />

        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="text-xs text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-6">
              {dateMessages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={index === 0 || 
                    dateMessages[index - 1]?.sender.id !== message.sender.id ||
                    new Date(dateMessages[index - 1]?.created_at).getTime() - 
                    new Date(message.created_at).getTime() > 300000 // 5 minutes
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2 text-lg">No messages yet</div>
            <div className="text-gray-500">
              Start the conversation by sending a message
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default MessageThread;