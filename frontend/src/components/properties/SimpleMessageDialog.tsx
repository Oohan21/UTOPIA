// components/properties/SimpleMessageDialog.tsx - FIXED WITH RADIX UI SCROLLAREA
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ScrollArea } from '@/components/ui/Scroll-area';
import { Separator } from '@/components/ui/Separator';
import { Property } from '@/lib/types/property';
import { User as UserType } from '@/lib/types/user';
import { messagingApi } from '@/lib/api/messaging';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SimpleMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  receiver?: UserType;
  property?: Property;
  onSuccess?: () => void;
}

export function SimpleMessageDialog({
  isOpen,
  onOpenChange,
  receiver,
  property,
  onSuccess,
}: SimpleMessageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [messageData, setMessageData] = useState({
    subject: '',
    content: '',
    message_type: 'general',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMessageData({
        subject: property?.title ? `Regarding ${property.title}` : '',
        content: '',
        message_type: 'general',
      });
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Focus on textarea when dialog opens
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, property?.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageData.content.trim()) {
      toast.error('Please enter a message');
      textareaRef.current?.focus();
      return;
    }

    if (!receiver) {
      toast.error('No recipient specified');
      return;
    }

    setIsLoading(true);
    
    try {
      await messagingApi.sendMessage({
        receiver: receiver.id,
        property: property?.id,
        message_type: messageData.message_type,
        subject: messageData.subject || `Regarding ${property?.title || 'Property'}`,
        content: messageData.content,
        attachment: attachment || undefined,
      });

      toast.success('Message sent successfully!');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not supported. Please upload PDF, DOC, DOCX, JPG, JPEG, or PNG files.');
        return;
      }
      
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (messageData.content.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit to 5000 characters
    if (value.length <= 5000) {
      setMessageData({ ...messageData, content: value });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[80vh] p-0 overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Direct Message
            </DialogTitle>
            <DialogDescription>
              Send a message to {receiver ? `${receiver.first_name} ${receiver.last_name}` : 'the property owner'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content Area - Using Radix ScrollArea correctly */}
        <ScrollArea className="flex-1 px-6">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Property Info */}
            {property && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{property.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {property.city?.name}, {property.sub_city?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Receiver Info */}
            {receiver && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {receiver.first_name} {receiver.last_name}
                      </h4>
                      {receiver.is_verified && (
                        <Badge variant="outline" className="h-5 text-xs bg-green-50 text-green-700">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate capitalize">
                      {receiver.user_type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Message Type */}
              <div className="space-y-2">
                <Label htmlFor="message_type">Message Type</Label>
                <Select
                  value={messageData.message_type}
                  onValueChange={(value) =>
                    setMessageData({ ...messageData, message_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="viewing">Viewing Request</SelectItem>
                    <SelectItem value="offer">Make an Offer</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="document">Document Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter message subject"
                  value={messageData.subject}
                  onChange={(e) =>
                    setMessageData({ ...messageData, subject: e.target.value })
                  }
                  maxLength={200}
                />
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Your Message *</Label>
                  <span className="text-xs text-muted-foreground">
                    {messageData.content.length}/5000
                  </span>
                </div>
                <Textarea
                  ref={textareaRef}
                  id="content"
                  placeholder="Type your message here... You can use Ctrl+Enter or Cmd+Enter to send."
                  value={messageData.content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  rows={6}
                  className={cn(
                    "min-h-[120px] resize-y",
                    "max-h-[200px] overflow-y-auto",
                    "custom-scrollbar"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Be specific for better response</span>
                  <span className={cn(
                    messageData.content.length >= 4500 ? "text-amber-600" : ""
                  )}>
                    {messageData.content.length >= 4500 ? `${5000 - messageData.content.length} characters left` : ''}
                  </span>
                </div>
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachment ? 'Replace File' : 'Attach File'}
                    </Button>
                    {attachment && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  {attachment && (
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB • 
                              {attachment.type.includes('image') ? ' Image' : ' Document'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (max 10MB)
                  </p>
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        {/* Fixed Footer with Buttons */}
        <div className="px-6 py-4 border-t bg-background/95 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !messageData.content.trim()}
              className="w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}