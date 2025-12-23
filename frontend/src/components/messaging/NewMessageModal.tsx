// app/components/messaging/NewMessageModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, User, X, Building2, Calendar, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useMessaging } from '@/lib/hooks/useMessaging';
import MessageComposer from './MessageComposer';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/Scroll-area';
import { Skeleton } from '@/components/ui/Skeleton';

interface SelectableUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: 'admin' | 'user' | 'buyer' | 'seller' | 'agent' | string;
  is_verified: boolean;
}

interface NewMessageModalProps {
  onClose: () => void;
  onMessageSent: () => void;
  preselectedReceiverId?: number;
  preselectedPropertyId?: number;
  preselectedInquiryId?: number;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  onClose,
  onMessageSent,
  preselectedReceiverId,
  preselectedPropertyId,
  preselectedInquiryId,
}) => {
  const [step, setStep] = useState<'select' | 'compose'>(
    preselectedReceiverId ? 'compose' : 'select'
  );
  const [selectedReceiver, setSelectedReceiver] = useState<SelectableUser | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(
    preselectedPropertyId
  );
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | undefined>(
    preselectedInquiryId
  );
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [loading, setLoading] = useState(false);

  const { quickContacts } = useMessaging();

  // Fetch users for search
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        // Convert QuickContact to SelectableUser
        const filtered = quickContacts
          .filter(contact =>
            `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(contact => ({
            id: contact.id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            profile_picture: contact.profile_picture,
            user_type: contact.user_type as 'admin' | 'user' | 'buyer' | 'seller' | 'agent',
            is_verified: contact.is_verified
          }));
        setUsers(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, quickContacts]);

  // Set preselected receiver
  useEffect(() => {
    if (preselectedReceiverId) {
      const receiver = quickContacts.find(c => c.id === preselectedReceiverId);
      if (receiver) {
        setSelectedReceiver({
          id: receiver.id,
          first_name: receiver.first_name,
          last_name: receiver.last_name,
          email: receiver.email,
          profile_picture: receiver.profile_picture,
          user_type: receiver.user_type as 'admin' | 'user' | 'buyer' | 'seller' | 'agent',
          is_verified: receiver.is_verified,
        });
      }
    }
  }, [preselectedReceiverId, quickContacts]);

  const handleSelectContact = (user: SelectableUser) => {
    setSelectedReceiver(user);
    setStep('compose');
  };

  const handleSend = () => {
    onMessageSent();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            {step === 'compose' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep('select')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="flex-1 text-center">
              {step === 'select' ? 'New Message' : 'Compose Message'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === 'select' ? (
          <div className="flex flex-col h-[60vh]">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Recent Contacts */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : users.length > 0 ? (
                  <div className="space-y-1">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectContact(user)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profile_picture} />
                          <AvatarFallback>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        {user.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-500">
                      {searchQuery ? 'No contacts found' : 'Start typing to search contacts'}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex flex-col h-[60vh]">
            {/* Selected Contact Info */}
            {selectedReceiver && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedReceiver.profile_picture} />
                    <AvatarFallback>
                      {selectedReceiver.first_name?.[0]}{selectedReceiver.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-lg">
                      {selectedReceiver.first_name} {selectedReceiver.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedReceiver.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Property/Inquiry Badges */}
            {(selectedPropertyId || selectedInquiryId) && (
              <div className="px-4 py-2 border-b bg-blue-50">
                <div className="flex items-center gap-2">
                  {selectedPropertyId && (
                    <Badge className="gap-1">
                      <Building2 className="h-3 w-3" />
                      Property #{selectedPropertyId}
                    </Badge>
                  )}
                  {selectedInquiryId && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Inquiry #{selectedInquiryId}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Message Composer */}
            <div className="flex-1 overflow-auto p-4">
              {selectedReceiver && (
                <MessageComposer
                  receiverId={selectedReceiver.id}
                  propertyId={selectedPropertyId}
                  inquiryId={selectedInquiryId}
                  onMessageSent={handleSend}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageModal;