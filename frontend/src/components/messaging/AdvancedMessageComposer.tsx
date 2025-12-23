// components/messaging/AdvancedMessageComposer.tsx
'use client';

import React, { useState } from 'react';
import { Send, Paperclip, Smile, Clock, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { EmojiPicker } from '@/components/ui/EmojiPicker';

export function AdvancedMessageComposer() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduleSend, setScheduleSend] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState('normal');

  const templates = [
    { id: 'viewing', name: 'Viewing Request', content: 'I would like to schedule a viewing for the property.' },
    { id: 'offer', name: 'Make an Offer', content: 'I am interested in making an offer on your property.' },
    { id: 'question', name: 'General Question', content: 'I have a question about the property.' },
    { id: 'document', name: 'Document Request', content: 'Could you please provide more documents about the property?' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-4 w-4" />
          Advanced Composer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="compose">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <div className="flex gap-2">
                <Input placeholder="Search user or enter email..." />
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input 
                placeholder="Message subject..." 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="resize-none"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setMessage(template.content);
                  }}
                  className="h-auto py-3 justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {template.content.substring(0, 40)}...
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>Schedule Message</Label>
              <Switch checked={scheduleSend} onCheckedChange={setScheduleSend} />
            </div>
            
            {scheduleSend && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input 
                      type="time" 
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Message will be sent at the scheduled time</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <EmojiPicker>
              <Button variant="ghost" size="icon">
                <Smile className="h-4 w-4" />
              </Button>
            </EmojiPicker>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">Save Draft</Button>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}