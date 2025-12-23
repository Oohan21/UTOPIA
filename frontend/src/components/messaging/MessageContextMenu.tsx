// app/components/messaging/MessageContextMenu.tsx
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/Context-menu';
import { Copy, Trash2, Flag, Reply, Forward, Download, Eye, CheckCircle } from 'lucide-react';
import { Message } from '@/lib/types/messaging';

interface MessageContextMenuProps {
  message: Message;
  children: React.ReactNode;
  onCopy?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onMarkAsRead?: () => void;
  onReport?: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  message,
  children,
  onCopy,
  onReply,
  onForward,
  onDelete,
  onMarkAsRead,
  onReport,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy?.();
  };

  const handleDownload = () => {
    if (message.attachment) {
      const link = document.createElement('a');
      link.href = message.attachment;
      link.download = message.attachment.split('/').pop() || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {!message.is_read && !message.is_my_message && (
          <ContextMenuItem onClick={onMarkAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as read
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy text
        </ContextMenuItem>
        {message.attachment && (
          <>
            <ContextMenuItem onClick={() => window.open(message.attachment, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              View attachment
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={onForward}>
          <Forward className="h-4 w-4 mr-2" />
          Forward
        </ContextMenuItem>
        <ContextMenuSeparator />
        {message.is_my_message && (
          <ContextMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        )}
        {!message.is_my_message && (
          <ContextMenuItem onClick={onReport} className="text-red-600">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageContextMenu;