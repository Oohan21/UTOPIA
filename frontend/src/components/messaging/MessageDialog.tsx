// components/messaging/MessageDialog.tsx - UPDATED WITH MINIMAL INTERFACE
'use client';

import React, { useState, useRef } from 'react';
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
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Property } from '@/lib/types/property';
import { messagingApi } from '@/lib/api/messaging';
import { listingsApi } from '@/lib/api/listings';
import toast from 'react-hot-toast';
import { useMessaging } from '@/lib/hooks/useMessaging';

interface MessageReceiver {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  user_type?: string;
  is_verified?: boolean;
}

interface MessageDialogProps {
  trigger: React.ReactNode;
  receiver?: MessageReceiver;
  property?: Property;
  inquiryId?: number;
  onSuccess?: () => void;
}

export function MessageDialog({
  trigger,
  receiver,
  property,
  inquiryId,
  onSuccess,
}: MessageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageData, setMessageData] = useState({
    subject: '',
    content: '',
    message_type: 'general',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const { refreshThreads } = useMessaging();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageData.content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    
    try {
      if (inquiryId) {
        // Use inquiry-specific endpoint
        await listingsApi.sendInquiryMessage(inquiryId, {
          message: messageData.content,
          attachment: attachment || undefined,
        });
      } else if (receiver) {
        // Use general message endpoint
        await messagingApi.sendMessage({
          receiver: receiver.id,
          property: property?.id,
          message_type: messageData.message_type,
          subject: messageData.subject || `Regarding ${property?.title || 'Property'}`,
          content: messageData.content,
          attachment: attachment || undefined,
        });
      } else {
        toast.error('No recipient specified');
        return;
      }

      toast.success('Message sent successfully!');
      
      // Reset form
      setMessageData({
        subject: '',
        content: '',
        message_type: 'general',
      });
      setAttachment(null);
      
      setIsOpen(false);
     // refreshThreads();
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
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {receiver ? `${receiver.first_name} ${receiver.last_name}` : 'the property owner'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Info */}
          {property && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">{property.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {property.city?.name}, {property.sub_city?.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Receiver Info */}
          {receiver && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">
                    {receiver.first_name} {receiver.last_name}
                  </h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {receiver.user_type?.replace('_', ' ') || 'User'} • {receiver.email}
                  </p>
                </div>
              </div>
            </div>
          )}

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
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Message *</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={messageData.content}
              onChange={(e) =>
                setMessageData({ ...messageData, content: e.target.value })
              }
              rows={6}
              className="min-h-[150px]"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label>Attachment (Optional)</Label>
            <div className="flex items-center gap-3">
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
                Attach File
              </Button>
              {attachment && (
                <div className="flex-1 flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[200px]">
                      {attachment.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (max 10MB)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !messageData.content.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}