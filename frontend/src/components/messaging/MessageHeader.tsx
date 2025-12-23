// app/components/messaging/MessageHeader.tsx
import React, { useState } from 'react';
import { MessageThread } from '@/lib/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, MoreVertical, Mail, Info, Archive, CheckCheck, Star, Bell, BellOff, Pin, Download, Link, Flag, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useMessaging } from '@/lib/hooks/useMessaging';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Extend MessageThread type locally
interface ExtendedMessageThread extends MessageThread {
  is_muted?: boolean;
  is_starred?: boolean;
  is_pinned?: boolean;
}

interface MessageHeaderProps {
  thread: ExtendedMessageThread;
  onBack?: () => void;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({ thread, onBack }) => {
  const participant = thread.participant_info;
  const property = thread.property;
  const [isMuted, setIsMuted] = useState(thread.is_muted || false);
  const [isStarred, setIsStarred] = useState(thread.is_starred || false);
  const [isPinned, setIsPinned] = useState(thread.is_pinned || false);
  
  const { 
    markThreadAsRead, 
    archiveThread, 
    unarchiveThread,
    toggleMuteThread,
    toggleStarThread,
    togglePinThread,
    blockUser,
    reportThread,
    exportConversation,
    copyThreadLink,
  } = useMessaging();
  const { toast } = useToast();

  const handleArchive = async () => {
    try {
      if (thread.is_active) {
        await archiveThread(thread.id);
      } else {
        await unarchiveThread(thread.id);
      }
    } catch (error) {
      console.error('Error updating thread:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markThreadAsRead(thread.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleToggleMute = async () => {
    try {
      await toggleMuteThread(thread.id);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleToggleStar = async () => {
    try {
      await toggleStarThread(thread.id);
      setIsStarred(!isStarred);
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleTogglePin = async () => {
    try {
      await togglePinThread(thread.id);
      setIsPinned(!isPinned);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleExport = async () => {
    try {
      await exportConversation(thread.id);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleCopyLink = () => {
    copyThreadLink(thread.id);
  };

  const handleBlockUser = async () => {
    if (participant?.id) {
      try {
        await blockUser(participant.id);
      } catch (error) {
        console.error('Error blocking user:', error);
      }
    }
  };

  const handleReport = async () => {
    try {
      await reportThread(thread.id, "Inappropriate content");
    } catch (error) {
      console.error('Error reporting:', error);
    }
  };

  const handleSendEmail = () => {
    if (participant?.email) {
      window.open(`mailto:${participant.email}`, '_blank');
    }
  };

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button (mobile) */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Participant Info */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={participant?.profile_picture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {participant?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {participant?.name || 'Unknown User'}
              </h3>
              {participant?.is_verified && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  ✓ Verified
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {participant?.user_type || 'User'}
              </Badge>
              {isPinned && (
                <Badge variant="outline" className="text-xs gap-1 bg-amber-50">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {participant?.email}
              </div>
              <div className="h-1 w-1 rounded-full bg-gray-300"></div>
              <div className="text-sm text-gray-500">
                {thread.formatted_last_activity}
              </div>
            </div>

            {/* Property Reference */}
            {property && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs gap-1 bg-blue-50">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {property.title}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleStar}
            className={cn("h-10 w-10", isStarred && "text-yellow-500")}
            title={isStarred ? "Unstar" : "Star"}
          >
            <Star className={cn("h-5 w-5", isStarred && "fill-yellow-400")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMute}
            className="h-10 w-10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <BellOff className="h-5 w-5 text-gray-600" />
            ) : (
              <Bell className="h-5 w-5 text-gray-400" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePin}
            className={cn("h-10 w-10", isPinned && "text-blue-500")}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Pin className={cn("h-5 w-5", isPinned && "fill-blue-400")} />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={handleSendEmail}
            title="Send Email"
          >
            <Mail className="h-5 w-5 text-gray-400" />
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {thread.unread_count && thread.unread_count > 0 && (
                <>
                  <DropdownMenuItem onClick={handleMarkAllRead}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => window.open(`/users/${participant?.id}`, '_blank')}>
                <Info className="h-4 w-4 mr-2" />
                View profile
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link className="h-4 w-4 mr-2" />
                Copy thread link
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export conversation
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {thread.is_active ? 'Archive' : 'Unarchive'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleBlockUser} className="text-red-600">
                <UserX className="h-4 w-4 mr-2" />
                Block user
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleReport} className="text-red-600">
                <Flag className="h-4 w-4 mr-2" />
                Report conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default MessageHeader;