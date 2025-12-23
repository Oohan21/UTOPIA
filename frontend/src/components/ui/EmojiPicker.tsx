// components/ui/EmojiPicker.tsx
'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';
import { Smile } from 'lucide-react';

const emojis = ['😊', '👍', '❤️', '🔥', '🎉', '💯', '👏', '🙏', '🤝', '💪'];

export function EmojiPicker({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    // This would typically insert the emoji into a text input
    console.log('Selected emoji:', emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {emojis.map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-2xl hover:bg-muted"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}