// app/[locale]/messages/new/page.tsx - UPDATED WITH DARK MODE & LANG INTEGRATION
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/common/Header/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/Scroll-area';
import {
  Search,
  Send,
  ArrowLeft,
  User,
  Building,
  CheckCircle,
  X,
  Paperclip,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface UserResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: string;
  is_verified: boolean;
}

export default function NewConversationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { sendMessage, refreshAll } = useMessaging();
  const t = useTranslations('messages');
  
  // All useState hooks have proper initial values
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messageData, setMessageData] = useState({
    content: '',
    subject: '',
    message_type: 'general' as const,
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search users
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await apiClient.get('/users/', {
          params: {
            search: searchQuery,
            limit: 10,
          },
        });
        
        const data = response.data.results || response.data;
        // Filter out current user
        const filtered = Array.isArray(data) 
          ? data.filter((u: UserResult) => u.id !== user?.id)
          : [];
        setSearchResults(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error(t('searchFailed'));
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, user?.id, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error(t('selectRecipient'));
      return;
    }

    if (!messageData.content.trim()) {
      toast.error(t('enterMessage'));
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        receiver: selectedUser.id,
        content: messageData.content,
        message_type: messageData.message_type,
        subject: messageData.subject || t(`'defaultSubject',  ${user?.first_name}`),
        attachment: attachment || undefined,
      });

      toast.success(t('sendSuccess'));
      
      // Refresh conversations and redirect
      await refreshAll();
      router.push('/messages');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || t('sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('fileSizeError'));
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (selectedUser && messageData.content.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  const messageTypes = [
    { value: 'general', label: t('general') },
    { value: 'question', label: t('question') },
    { value: 'offer', label: t('offer') },
    { value: 'viewing', label: t('viewing') },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 mb-3 md:mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToMessages')}
          </Button>
          
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold dark:text-white">
            {t('newMessage')}
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 text-sm md:text-base">
            {t('newMessageDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Search Section */}
          <Card className="p-4 md:p-6 bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2 dark:text-white">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
              {t('findRecipient')}
            </h3>
            
            <div className="space-y-3 md:space-y-4">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSending || !!selectedUser}
                className="bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-gray-300"
              />

              {isSearching && (
                <div className="text-center py-3 md:py-4 text-muted-foreground dark:text-gray-400">
                  {t('searching')}
                </div>
              )}

              {/* Search Results */}
              {!selectedUser && searchResults.length > 0 && (
                <ScrollArea className="max-h-48 md:max-h-60">
                  <div className="space-y-2">
                    {searchResults.map((userResult) => (
                      <button
                        key={userResult.id}
                        type="button"
                        onClick={() => setSelectedUser(userResult)}
                        className="w-full p-2 md:p-3 rounded-lg border hover:bg-muted dark:hover:bg-gray-700 transition-colors text-left border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <Avatar className="h-8 w-8 md:h-10 md:w-10">
                            <AvatarImage src={userResult.profile_picture} />
                            <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white text-xs">
                              {userResult.first_name[0]}{userResult.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm md:text-base truncate dark:text-white">
                              {userResult.first_name} {userResult.last_name}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 truncate">
                              {userResult.email}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs border-gray-300 dark:border-gray-600 dark:text-gray-300">
                            {userResult.user_type}
                          </Badge>
                          {userResult.is_verified && (
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500 dark:text-green-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </Card>

          {/* Selected User */}
          {selectedUser && (
            <Card className="p-4 md:p-6 bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-semibold text-base md:text-lg flex items-center gap-2 dark:text-white">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  {t('recipient')}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  disabled={isSending}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 h-8"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  {t('change')}
                </Button>
              </div>

              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted dark:bg-gray-700">
                <Avatar className="h-10 w-10 md:h-14 md:w-14">
                  <AvatarImage src={selectedUser.profile_picture} />
                  <AvatarFallback className="bg-gray-700 dark:bg-gray-600 text-white">
                    {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base md:text-lg truncate dark:text-white">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </div>
                  <div className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm truncate">
                    {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize text-xs border-gray-300 dark:border-gray-600 dark:text-gray-300">
                      {selectedUser.user_type}
                    </Badge>
                    {selectedUser.is_verified && (
                      <Badge className="bg-green-500 dark:bg-green-600 text-white gap-1 text-xs">
                        <CheckCircle className="h-2 w-2 md:h-3 md:w-3" />
                        {t('verified')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Message Form */}
          {selectedUser && (
            <Card className="p-4 md:p-6 bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4 dark:text-white">
                {t('composeMessage')}
              </h3>
              
              <div className="space-y-3 md:space-y-4">
                {/* Message Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                    {t('messageType')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {messageTypes.map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={messageData.message_type === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageData({ ...messageData, message_type: type.value as any })}
                        disabled={isSending}
                        className={cn(
                          "text-xs md:text-sm h-7 md:h-8 px-2 md:px-3",
                          messageData.message_type === type.value 
                            ? "bg-primary dark:bg-primary/90" 
                            : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                    {t('subjectOptional')}
                  </label>
                  <Input
                    placeholder={t('subjectPlaceholder')}
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    disabled={isSending}
                    maxLength={200}
                    className="bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>

                {/* Message Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium dark:text-gray-300">
                      {t('yourMessage')} *
                    </label>
                    <span className="text-xs text-muted-foreground dark:text-gray-500">
                      {messageData.content.length}/5000
                    </span>
                  </div>
                  <Textarea
                    placeholder={t('messagePlaceholder')}
                    value={messageData.content}
                    onChange={(e) => {
                      if (e.target.value.length <= 5000) {
                        setMessageData({ ...messageData, content: e.target.value });
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    rows={6}
                    disabled={isSending}
                    className="resize-y bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-gray-300 text-sm md:text-base"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                    {t('attachmentOptional')}
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={isSending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        className="gap-2 border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs md:text-sm h-8"
                      >
                        <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
                        {attachment ? t('replaceFile') : t('attachFile')}
                      </Button>
                      {attachment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeAttachment}
                          disabled={isSending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-400/10 text-xs md:text-sm h-8"
                        >
                          <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          {t('remove')}
                        </Button>
                      )}
                    </div>
                    
                    {attachment && (
                      <div className="rounded-lg border p-3 bg-muted/30 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                            <div>
                              <p className="text-sm font-medium dark:text-gray-300">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-gray-500">
                                {(attachment.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground dark:text-gray-500">
                      {t('supportedFormats')}
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSending}
                      className="order-2 sm:order-1 border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs md:text-sm h-9"
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSending || !messageData.content.trim()}
                      className="order-1 sm:order-2 gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary text-xs md:text-sm h-9"
                    >
                      <Send className="h-3 w-3 md:h-4 md:w-4" />
                      {isSending ? t('sending') : t('sendMessage')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}