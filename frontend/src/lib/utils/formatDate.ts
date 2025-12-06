import { format, formatDistance, formatRelative } from 'date-fns'
import { enUS } from 'date-fns/locale'

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy', { locale: enUS })
}

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm', { locale: enUS })
}

export const formatTimeAgo = (date: string | Date): string => {
  return formatDistance(new Date(date), new Date(), { 
    addSuffix: true,
    locale: enUS 
  })
}

export const formatRelativeTime = (date: string | Date): string => {
  return formatRelative(new Date(date), new Date(), { locale: enUS })
}

// Ethiopian date formatting (basic implementation)
export const formatEthiopianDate = (date: string | Date): string => {
  const d = new Date(date)
  // Simple Ethiopian date formatting - would need proper conversion logic
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}