// lib/utils/toast-helpers.ts - Utility functions for common toast patterns
import { toast } from '@/components/ui/Toast/toast'

export const toastHelpers = {
  // API success
  apiSuccess: (message: string = 'Operation completed successfully') => {
    toast.success({
      title: 'Success',
      description: message,
    })
  },

  // API error
  apiError: (error: any, defaultMessage: string = 'Something went wrong') => {
    const message = error?.response?.data?.message || 
                    error?.message || 
                    defaultMessage
    
    toast.error({
      title: 'Error',
      description: message,
      duration: 5000,
    })
  },

  // Form validation error
  formError: (field?: string) => {
    const message = field 
      ? `Please check the ${field} field`
      : 'Please check the form for errors'
    
    toast.error({
      title: 'Validation Error',
      description: message,
    })
  },

  // Copy to clipboard
  copySuccess: (text: string = 'Copied to clipboard') => {
    toast.success({
      title: 'Copied!',
      description: text,
      duration: 2000,
    })
  },

  // Authentication
  authSuccess: (action: string = 'signed in') => {
    toast.success({
      title: 'Welcome!',
      description: `Successfully ${action}`,
    })
  },

  authError: () => {
    toast.error({
      title: 'Authentication Error',
      description: 'Please check your credentials',
    })
  },

  // File operations
  fileUploadSuccess: (filename?: string) => {
    const message = filename 
      ? `"${filename}" uploaded successfully`
      : 'File uploaded successfully'
    
    toast.success({
      title: 'Upload Complete',
      description: message,
    })
  },

  fileUploadError: (filename?: string) => {
    const message = filename
      ? `Failed to upload "${filename}"`
      : 'File upload failed'
    
    toast.error({
      title: 'Upload Failed',
      description: message,
    })
  },

  // Network status
  offline: () => {
    toast.error({
      title: 'You are offline',
      description: 'Please check your internet connection',
      duration: Infinity,
    })
  },

  online: () => {
    toast.success({
      title: 'Back online',
      description: 'Your connection has been restored',
      duration: 3000,
    })
  },

  // Coming soon feature
  comingSoon: () => {
    toast.info({
      title: 'Coming Soon',
      description: 'This feature is under development',
      duration: 3000,
    })
  },

  // Premium feature
  premiumRequired: () => {
    toast.warning({
      title: 'Premium Feature',
      description: 'Upgrade to access this feature',
      action: {
        label: 'Upgrade',
        onClick: () => console.log('Navigate to upgrade'),
      },
    })
  },

  // Rate limit warning
  rateLimit: () => {
    toast.warning({
      title: 'Too Many Requests',
      description: 'Please wait before trying again',
      duration: 5000,
    })
  },

  // Data saved
  saveSuccess: () => {
    toast.success({
      title: 'Saved',
      description: 'Your changes have been saved',
      duration: 2000,
    })
  },

  // Data deleted
  deleteSuccess: (item: string = 'item') => {
    toast.success({
      title: 'Deleted',
      description: `${item} has been deleted`,
      duration: 3000,
    })
  },

  // Undo action
  withUndo: (title: string, description: string, undoAction: () => void) => {
    const id = toast.success({
      title,
      description,
      action: {
        label: 'Undo',
        onClick: () => {
          undoAction()
          toast.dismiss(id)
        },
      },
      duration: 5000,
    })
  },

  // Progress toast
  progress: (title: string, progress: number, description?: string) => {
    // This would need to be updated via toast.update()
    toast.loading({
      title,
      description: description || `Progress: ${progress}%`,
      duration: Infinity,
    })
  }
}