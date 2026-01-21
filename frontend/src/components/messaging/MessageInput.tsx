// app/components/messaging/MessageInput.tsx - UPDATED WITH DARK MODE
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Paperclip, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string, attachment?: File) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({ 
  onSendMessage, 
  disabled, 
  placeholder = "Type your message...",
  className 
}: MessageInputProps) {
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
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setAttachment(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("p-3 md:p-4 border-t dark:border-gray-800", className)}>
      {attachment && (
        <div className="mb-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <div className="flex items-center gap-2">
            <Paperclip className="w-3 h-3 md:w-4 md:h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs md:text-sm truncate dark:text-gray-300">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
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
          <Paperclip className="w-3 h-3 md:w-4 md:h-4" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
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
          <Send className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      </div>
    </form>
  );
}