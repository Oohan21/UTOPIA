// app/components/messaging/ConversationList.tsx
import { Conversation } from '@/lib/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a conversation by messaging someone</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
            selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage src={conversation.other_user.profile_picture} />
              <AvatarFallback>
                {conversation.other_user.first_name[0]}
                {conversation.other_user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-sm">
                    {conversation.other_user.first_name} {conversation.other_user.last_name}
                  </h4>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {conversation.last_message_content}
                  </p>
                </div>
                
                <div className="text-xs text-gray-400 text-right space-y-1">
                  <div>
                    {formatDistanceToNow(new Date(conversation.last_message_time), {
                      addSuffix: true
                    })}
                  </div>
                  {conversation.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}