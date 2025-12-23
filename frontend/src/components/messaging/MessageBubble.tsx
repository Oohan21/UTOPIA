// app/components/messaging/MessageBubble.tsx
import React, { useState } from 'react';
import { Message } from '@/lib/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Download, ExternalLink, Eye, FileIcon } from 'lucide-react';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { markAsRead } = useMessaging();

  const isMyMessage = message.is_my_message;
  const isUnread = !message.is_read && !isMyMessage;

  const handleClick = () => {
    if (isUnread) {
      markAsRead(message.id);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'offer':
        return 'bg-amber-50 border-amber-200';
      case 'viewing':
        return 'bg-emerald-50 border-emerald-200';
      case 'negotiation':
        return 'bg-purple-50 border-purple-200';
      case 'document':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      inquiry: 'Inquiry',
      general: 'General',
      offer: 'Offer/Proposal',
      viewing: 'Viewing',
      negotiation: 'Negotiation',
      document: 'Document',
    };
    return typeMap[type] || type;
  };

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isMyMessage ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Avatar */}
      {showAvatar && !isMyMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.profile_picture} />
          <AvatarFallback>
            {message.sender.first_name[0]}{message.sender.last_name[0]}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3 border shadow-sm',
          isMyMessage
            ? 'bg-blue-50 border-blue-200 rounded-br-none'
            : getMessageTypeColor(message.message_type),
          isUnread && 'border-l-4 border-l-blue-500'
        )}
      >
        {/* Message Header */}
        <div className="flex items-center justify-between mb-2">
          {!isMyMessage && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {message.sender.first_name} {message.sender.last_name}
              </span>
              {message.message_type !== 'general' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    message.message_type === 'offer' && 'bg-amber-100 text-amber-800',
                    message.message_type === 'viewing' && 'bg-emerald-100 text-emerald-800',
                    message.message_type === 'negotiation' && 'bg-purple-100 text-purple-800',
                  )}
                >
                  {getMessageTypeBadge(message.message_type)}
                </Badge>
              )}
            </div>
          )}
          <span className="text-xs text-gray-500">
            {message.formatted_time || new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Subject */}
        {message.subject && (
          <div className="font-semibold text-gray-800 mb-2">
            {message.subject}
          </div>
        )}

        {/* Message Body */}
        <div className="text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Attachment */}
        {message.attachment && (
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <FileIcon className="h-8 w-8 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {message.attachment.split('/').pop()}
                </div>
                <div className="text-xs text-gray-500">
                  Document • {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={message.attachment} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={message.attachment} download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Property Reference */}
        {message.property && (
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <div className="flex items-start gap-3">
              {message.property.main_image && (
                <img
                  src={message.property.main_image}
                  alt={message.property.title}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {message.property.title}
                </div>
                <div className="text-xs text-gray-500">
                  {message.property.city?.name} • {message.property.price_etb?.toLocaleString()} ETB
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a href={`/properties/${message.property.id}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Message Status */}
      {isMyMessage && (
        <div className="self-end mb-1">
          {message.is_read ? (
            <span className="text-xs text-blue-500">Read</span>
          ) : (
            <span className="text-xs text-gray-400">Sent</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;