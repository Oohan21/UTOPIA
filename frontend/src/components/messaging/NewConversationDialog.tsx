// components/messaging/NewConversationDialog.tsx - FIXED VERSION
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from '@/lib/types/messaging';
import { messagingApi } from '@/lib/api/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface NewConversationDialogProps {
  onConversationStarted: () => void;
}

export function NewConversationDialog({ onConversationStarted }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await messagingApi.searchUsers(query);
      setSearchResults(results);
    } catch (error: any) {
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to search users',
        variant: 'destructive',
      });
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedUser || !message.trim()) return;

    setIsSending(true);
    try {
      await messagingApi.startConversation({
        receiver: selectedUser.id,
        content: message.trim()
      });

      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });

      setOpen(false);
      setSelectedUser(null);
      setMessage('');
      setSearchQuery('');
      setSearchResults([]);
      onConversationStarted();
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Failed to send message',
        description: error.response?.data?.detail || error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          New Message
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isSending}
            />
            
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )}

            {searchResults.length > 0 && !selectedUser && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full p-2 flex items-center gap-3 hover:bg-gray-50 rounded"
                    onClick={() => setSelectedUser(user)}
                    disabled={isSending}
                  >
                    <Avatar>
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback>
                        {user.first_name?.[0] || 'U'}
                        {user.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="mt-2 p-3 bg-blue-50 rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.profile_picture} />
                    <AvatarFallback>
                      {selectedUser.first_name?.[0] || 'U'}
                      {selectedUser.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  disabled={isSending}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {selectedUser && (
            <>
              <textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full min-h-[100px] p-3 border rounded resize-none"
                rows={3}
                disabled={isSending}
              />
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartConversation}
                  disabled={!message.trim() || isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}