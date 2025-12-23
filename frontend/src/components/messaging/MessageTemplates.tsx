// components/messaging/MessageTemplates.tsx
'use client';

import React, { useState } from 'react';
import { X, Copy, Edit, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { Badge } from '@/components/ui/Badge';

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  tags: string[];
}

export function MessageTemplates({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templates, setTemplates] = useState<Template[]>([
    { id: '1', name: 'Viewing Request', category: 'property', content: 'I would like to schedule a viewing for the property. Please let me know your availability.', tags: ['viewing', 'property'] },
    { id: '2', name: 'Price Inquiry', category: 'property', content: 'Could you please provide more details about the pricing? Is the price negotiable?', tags: ['price', 'negotiation'] },
    { id: '3', name: 'Document Request', category: 'legal', content: 'Could you please provide the property documents (title deed, permits, etc.)?', tags: ['documents', 'legal'] },
    { id: '4', name: 'Follow Up', category: 'general', content: 'Just following up on our previous conversation. Looking forward to your response.', tags: ['follow-up', 'reminder'] },
    { id: '5', name: 'Thank You', category: 'general', content: 'Thank you for your help and prompt response. I appreciate your assistance.', tags: ['thank-you', 'courtesy'] },
  ]);

  const categories = ['all', 'property', 'legal', 'general', 'negotiation'];
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                         template.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (content: string) => {
    // This would typically be passed back to parent component
    console.log('Using template:', content);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Message Templates</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
        
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <div className="flex gap-1 mt-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {template.content}
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleUseTemplate(template.content)}
                >
                  Use This Template
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Create New Template</h4>
          <div className="space-y-3">
            <Input placeholder="Template name" />
            <Textarea placeholder="Template content" rows={3} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80">
                <Plus className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}