// app/components/messaging/MessageComposer.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Paperclip, Send, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface MessageComposerProps {
  threadId?: number; // Made optional for new messages
  onMessageSent?: () => void;
  receiverId?: number;
  propertyId?: number;
  inquiryId?: number;
  className?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  threadId,
  onMessageSent,
  receiverId,
  propertyId,
  inquiryId,
  className,
}) => {
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const [messageType, setMessageType] = useState('general');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendThreadMessage, sendMessage } = useMessaging();

  const messageTypes = [
    { value: 'general', label: 'General Message' },
    { value: 'inquiry', label: 'Inquiry Related' },
    { value: 'offer', label: 'Offer/Proposal' },
    { value: 'viewing', label: 'Viewing Arrangement' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'document', label: 'Document' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachment) return;

    setIsLoading(true);
    try {
      if (threadId) {
        // Send thread message
        await sendThreadMessage(threadId, {
          content,
          attachment,
          message_type: messageType !== 'general' ? messageType : undefined,
        });
      } else if (receiverId) {
        // Send new message
        await sendMessage({
          receiver: receiverId,
          content,
          attachment: attachment || undefined,
          message_type: messageType,
          subject,
          property: propertyId,
          inquiry: inquiryId,
        });
      }

      setContent('');
      setAttachment(undefined);
      setSubject('');
      setMessageType('general');
      onMessageSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Message Type Selector - Only show for new messages */}
      {!threadId && (
        <div className="flex items-center gap-2">
          <Select value={messageType} onValueChange={setMessageType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Message Type" />
            </SelectTrigger>
            <SelectContent>
              {messageTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {messageType !== 'general' && (
            <Badge
              variant="outline"
              className={cn(
                messageType === 'offer' && 'bg-amber-100 text-amber-800',
                messageType === 'viewing' && 'bg-emerald-100 text-emerald-800',
                messageType === 'negotiation' && 'bg-purple-100 text-purple-800',
              )}
            >
              {messageTypes.find(t => t.value === messageType)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Subject (for new messages) */}
      {!threadId && (
        <div>
          <Label htmlFor="subject">Subject</Label>
          <input
            id="subject"
            type="text"
            placeholder="Message subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      )}

      {/* Message Editor */}
      <div className="border rounded-lg overflow-hidden">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message here..."
          className="min-h-[100px] border-0 resize-none focus-visible:ring-0"
          disabled={isLoading}
        />

        {/* Attachment Preview */}
        {attachment && (
          <div className="border-t p-3 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium text-sm">{attachment.name}</div>
                <div className="text-xs text-gray-500">
                  {(attachment.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeAttachment}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Editor Toolbar */}
        <div className="border-t p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAttachmentClick}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="submit"
            disabled={(!content.trim() && !attachment) || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Message
          </Button>
        </div>
      </div>

      {/* File Size Warning */}
      <p className="text-xs text-gray-500">
        Maximum file size: 10MB. Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX
      </p>
    </form>
  );
};

export default MessageComposer;