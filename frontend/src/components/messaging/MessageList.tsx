// app/components/messaging/MessageList.tsx - UPDATED WITH DARK MODE
import { Message } from '@/lib/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { Paperclip, Check, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const t = useTranslations('messages');

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4">
        <p className="text-sm md:text-base">{t('noMessagesYet')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
      {messages.map((message) => {
        const isMyMessage = message.sender.id === currentUserId;

        return (
          <div
            key={message.id}
            className={cn(
              'flex gap-2 md:gap-3',
              isMyMessage ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {!isMyMessage && (
              <Avatar className="w-7 h-7 md:w-8 md:h-8">
                <AvatarImage src={message.sender.profile_picture} />
                <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-xs">
                  {message.sender.first_name[0]}
                  {message.sender.last_name[0]}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'max-w-[70%] rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3',
                isMyMessage
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-br-none dark:from-primary/90 dark:to-secondary/90'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-bl-none'
              )}
            >
              {/* Show subject for first message in conversation or when subject changes */}
              {message.subject && (
                <div className={cn(
                  'font-semibold text-xs md:text-sm mb-1',
                  isMyMessage ? 'text-primary-foreground/90' : 'text-gray-700 dark:text-white'
                )}>
                  {message.subject}
                </div>
              )}
              
              {!isMyMessage && (
                <div className="font-medium text-xs mb-1 dark:text-white">
                  {message.sender.first_name}
                </div>
              )}
              <p className="text-xs md:text-sm whitespace-pre-wrap break-words dark:text-gray-300">{message.content}</p>
              {message.attachment && (
                <div className="mt-1 md:mt-2">
                  <a
                    href={message.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm underline flex items-center gap-1 hover:no-underline text-blue-600 dark:text-blue-400"
                  >
                    <Paperclip className="h-3 w-3" />
                    {t('attachment')}
                  </a>
                </div>
              )}
              <div
                className={cn(
                  'text-xs mt-1 md:mt-2 flex items-center gap-1',
                  isMyMessage ? 'text-primary-foreground/70' : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {message.formatted_time}
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
      })}
    </div>
  );
}