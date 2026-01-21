import React from 'react';
import { Inquiry } from '@/lib/types/inquiry';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  MessageSquare, 
  Phone, 
  Mail, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Home,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface InquiryListItemProps {
  inquiry: Inquiry;
  onAssign?: (id: string) => void;
  onContact?: (id: string, notes?: string) => void;
  onView?: (id: string) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

export const InquiryListItem: React.FC<InquiryListItemProps> = ({
  inquiry,
  onAssign,
  onContact,
  onView,
  showActions = true,
  isAdmin = false,
}) => {
  const router = useRouter();
  const t = useTranslations('inquiries');
  
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    viewing_scheduled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    spam: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const inquiryTypeIcons = {
    general: MessageSquare,
    viewing: Calendar,
    price: '💰' as any,
    details: Eye,
    availability: Calendar,
  };

  const handleView = () => {
    if (onView) {
      onView(inquiry.id);
    } else {
      router.push(`/inquiries/${inquiry.id}`);
    }
  };

  const InquiryTypeIcon = inquiryTypeIcons[inquiry.inquiry_type] || MessageSquare;

  const getPropertyData = () => {
    const property = inquiry?.property_info;
    
    if (!property) {
      return { id: null, title: 'Unknown Property', type: 'no-property' };
    }
    
    return {
      id: property.id,
      title: property.title || `Property #${property.id}`,
      type: 'normalized'
    };
  };

  const propertyData = getPropertyData();
  const hasValidPropertyLink = propertyData.id && propertyData.title !== 'Unknown Property';

  const getStatusColor = () => {
    if (!inquiry?.status || !statusColors[inquiry.status]) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
    return statusColors[inquiry.status];
  };

  const getPriorityColor = () => {
    if (!inquiry?.priority || !priorityColors[inquiry.priority]) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
    return priorityColors[inquiry.priority];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow",
      inquiry.is_urgent ? 'border-l-4 border-l-red-500 dark:border-l-red-600' : 'border-gray-200 dark:border-gray-700'
    )}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              {hasValidPropertyLink ? (
                <Home className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              ) : (
                <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
              
              {hasValidPropertyLink && propertyData.id ? (
                <Link
                  href={`/listings/${propertyData.id}`}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words"
                >
                  {propertyData.title}
                </Link>
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                  {propertyData.title}
                </h3>
              )}
            </div>
            {inquiry.is_urgent && (
              <Badge variant="destructive" className="animate-pulse self-start sm:self-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {t('urgent')}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={getStatusColor()}>
              {inquiry.status ? inquiry.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
            </Badge>
            <Badge className={getPriorityColor()}>
              {inquiry.priority ? inquiry.priority.toUpperCase() : 'MEDIUM'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 dark:text-gray-300">
              {typeof InquiryTypeIcon === 'string' ? (
                <span>{InquiryTypeIcon}</span>
              ) : (
                <InquiryTypeIcon className="w-3 h-3" />
              )}
              {inquiry.inquiry_type ? inquiry.inquiry_type.replace('_', ' ') : 'General'}
            </Badge>
            {inquiry.response_sent && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3 h-3" />
                {t('responded')}
              </Badge>
            )}
          </div>

          {inquiry.message && (
            <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 break-words">
              {inquiry.message}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{inquiry.user_info?.first_name || inquiry.full_name || 'Anonymous'}</span>
            </div>
            {inquiry.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span className="break-all">{inquiry.email}</span>
              </div>
            )}
            {inquiry.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{inquiry.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(inquiry.created_at)}</span>
            </div>
            {inquiry.assigned_to && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="font-medium dark:text-gray-300">
                  Assigned to: {inquiry.assigned_to_info?.first_name}
                </span>
              </div>
            )}
          </div>

          {inquiry.tags && inquiry.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {inquiry.tags.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-2 min-w-[140px]">
            <Button
              size="sm"
              variant="outline"
              onClick={handleView}
              className="w-full border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('viewDetails') || 'View Details'}
            </Button>

            {isAdmin && onAssign && !inquiry.assigned_to && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAssign(inquiry.id)}
                className="w-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('assignToMe')}
              </Button>
            )}

            {isAdmin && onContact && inquiry.status === 'pending' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onContact(inquiry.id)}
                className="w-full"
              >
                {t('markAsContacted')}
              </Button>
            )}

            {isAdmin && onContact && inquiry.status === 'closed' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 dark:text-gray-400"
                disabled
              >
                {t('closed')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};