import { useState, useCallback, useEffect } from 'react';
import { inquiryApi } from '@/lib/api/inquiry';
import { 
  Inquiry, 
  InquiryFilters, 
  PaginatedResponse,
  CreateInquiryData,
  UpdateInquiryData,
  BulkUpdateInquiryData,
  ScheduleViewingData,
  InquiryDashboardStats,
  InquiryActivity
} from '@/lib/types/inquiry';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export const useInquiries = (initialFilters?: InquiryFilters) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InquiryFilters | undefined>(initialFilters);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    total_pages: 1,
    current_page: 1,
  });
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.user_type === 'admin';

  // Fetch inquiries with filters
  const fetchInquiries = useCallback(async (customFilters?: InquiryFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveFilters = customFilters || filters;
      const response = await inquiryApi.getInquiries(effectiveFilters);
      
      setInquiries(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        total_pages: response.total_pages || Math.ceil(response.count / (effectiveFilters?.page_size || 20)),
        current_page: response.current_page || (effectiveFilters?.page || 1),
      });
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch inquiries';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Fetch a single inquiry
  const fetchInquiry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const inquiry = await inquiryApi.getInquiry(id);
      return inquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch inquiry';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new inquiry
  const createInquiry = useCallback(async (data: CreateInquiryData) => {
    try {
      setLoading(true);
      setError(null);
      const inquiry = await inquiryApi.createInquiry(data);
      
      // Add to the beginning of the list
      setInquiries(prev => [inquiry, ...prev]);
      setPagination(prev => ({ ...prev, count: prev.count + 1 }));
      
      toast({
        title: 'Success',
        description: 'Inquiry created successfully!',
      });
      return inquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create inquiry';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update an inquiry
  const updateInquiry = useCallback(async (id: string, data: UpdateInquiryData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedInquiry = await inquiryApi.updateInquiry(id, data);
      
      // Update in the list
      setInquiries(prev => 
        prev.map(inquiry => inquiry.id === id ? updatedInquiry : inquiry)
      );
      
      toast({
        title: 'Success',
        description: 'Inquiry updated successfully!',
      });
      return updatedInquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update inquiry';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Delete an inquiry
  const deleteInquiry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await inquiryApi.deleteInquiry(id);
      
      // Remove from the list
      setInquiries(prev => prev.filter(inquiry => inquiry.id !== id));
      setSelectedInquiries(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setPagination(prev => ({ ...prev, count: prev.count - 1 }));
      
      toast({
        title: 'Success',
        description: 'Inquiry deleted successfully!',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete inquiry';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Assign inquiry to current user
  const assignToMe = useCallback(async (id: string) => {
    try {
      if (!isAdmin) {
        throw new Error('Only admins can assign inquiries');
      }
      
      setLoading(true);
      setError(null);
      const updatedInquiry = await inquiryApi.assignToMe(id);
      
      // Update in the list
      setInquiries(prev => 
        prev.map(inquiry => inquiry.id === id ? updatedInquiry : inquiry)
      );
      
      toast({
        title: 'Success',
        description: 'Inquiry assigned to you!',
      });
      return updatedInquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to assign inquiry';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  // Mark as contacted
  const markAsContacted = useCallback(async (id: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedInquiry = await inquiryApi.markAsContacted(id, notes);
      
      setInquiries(prev => 
        prev.map(inquiry => inquiry.id === id ? updatedInquiry : inquiry)
      );
      
      toast({
        title: 'Success',
        description: 'Inquiry marked as contacted!',
      });
      return updatedInquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to mark as contacted';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Schedule viewing
  const scheduleViewing = useCallback(async (id: string, data: ScheduleViewingData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedInquiry = await inquiryApi.scheduleViewing(id, data);
      
      setInquiries(prev => 
        prev.map(inquiry => inquiry.id === id ? updatedInquiry : inquiry)
      );
      
      toast({
        title: 'Success',
        description: 'Viewing scheduled successfully!',
      });
      return updatedInquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to schedule viewing';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Close inquiry
  const closeInquiry = useCallback(async (id: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedInquiry = await inquiryApi.closeInquiry(id, notes);
      
      setInquiries(prev => 
        prev.map(inquiry => inquiry.id === id ? updatedInquiry : inquiry)
      );
      
      toast({
        title: 'Success',
        description: 'Inquiry closed successfully!',
      });
      return updatedInquiry;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to close inquiry';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Bulk operations
  const bulkUpdate = useCallback(async (data: BulkUpdateInquiryData) => {
    try {
      if (!isAdmin) {
        throw new Error('Only admins can perform bulk updates');
      }
      
      setLoading(true);
      setError(null);
      const result = await inquiryApi.bulkUpdate(data);
      
      // Refresh inquiries after bulk update
      await fetchInquiries();
      setSelectedInquiries(new Set());
      
      toast({
        title: 'Success',
        description: `${result.updated_count} inquiries updated successfully!`,
      });
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to bulk update';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, fetchInquiries, toast]);

  const bulkDelete = useCallback(async () => {
    try {
      if (!isAdmin) {
        throw new Error('Only admins can perform bulk deletions');
      }
      
      if (selectedInquiries.size === 0) {
        toast({
          title: 'Warning',
          description: 'No inquiries selected',
          variant: 'default',
        });
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Delete each selected inquiry
      const deletePromises = Array.from(selectedInquiries).map(id => 
        inquiryApi.deleteInquiry(id).catch(err => {
          console.error(`Failed to delete inquiry ${id}:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh the list
      await fetchInquiries();
      setSelectedInquiries(new Set());
      
      toast({
        title: 'Success',
        description: `${selectedInquiries.size} inquiries deleted successfully!`,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete inquiries';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedInquiries, fetchInquiries, toast]);

  // Export inquiries
  const exportInquiries = useCallback(async (customFilters?: InquiryFilters) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await inquiryApi.exportInquiries(customFilters || filters);
      inquiryApi.downloadExport(blob);
      toast({
        title: 'Success',
        description: 'Inquiries exported successfully!',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to export inquiries';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Selection management
  const toggleInquirySelection = useCallback((id: string) => {
    setSelectedInquiries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllInquiries = useCallback(() => {
    setSelectedInquiries(new Set(inquiries.map(inquiry => inquiry.id)));
  }, [inquiries]);

  const clearSelection = useCallback(() => {
    setSelectedInquiries(new Set());
  }, []);

  // Get my inquiries (for regular users)
  const fetchMyInquiries = useCallback(async (customFilters?: Omit<InquiryFilters, 'user'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inquiryApi.getMyInquiries(customFilters);
      
      setInquiries(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        total_pages: response.total_pages || 1,
        current_page: response.current_page || 1,
      });
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch your inquiries';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get assigned inquiries (for admins)
  const fetchAssignedToMe = useCallback(async (customFilters?: Omit<InquiryFilters, 'assigned_to'>) => {
    try {
      if (!isAdmin) {
        throw new Error('Only admins can view assigned inquiries');
      }
      
      setLoading(true);
      setError(null);
      const response = await inquiryApi.getAssignedToMe(customFilters);
      
      setInquiries(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        total_pages: response.total_pages || 1,
        current_page: response.current_page || 1,
      });
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch assigned inquiries';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  // Change page
  const goToPage = useCallback(async (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    await fetchInquiries(newFilters);
  }, [filters, fetchInquiries]);

  // Change page size
  const changePageSize = useCallback(async (pageSize: number) => {
    const newFilters = { ...filters, page_size: pageSize, page: 1 };
    setFilters(newFilters);
    await fetchInquiries(newFilters);
  }, [filters, fetchInquiries]);

  // Change ordering
  const changeOrdering = useCallback(async (ordering: string) => {
    const newFilters = { ...filters, ordering, page: 1 };
    setFilters(newFilters);
    await fetchInquiries(newFilters);
  }, [filters, fetchInquiries]);

  // Initial fetch
  useEffect(() => {
    if (initialFilters) {
      fetchInquiries(initialFilters);
    }
  }, [initialFilters, fetchInquiries]);

  return {
    // State
    inquiries,
    loading,
    error,
    filters,
    pagination,
    selectedInquiries,
    
    // User permissions
    isAdmin,
    
    // Filter operations
    setFilters: async (newFilters: InquiryFilters) => {
      setFilters(newFilters);
      await fetchInquiries(newFilters);
    },
    
    // Data operations
    fetchInquiries,
    fetchInquiry,
    createInquiry,
    updateInquiry,
    deleteInquiry,
    assignToMe,
    markAsContacted,
    scheduleViewing,
    closeInquiry,
    bulkUpdate,
    bulkDelete,
    exportInquiries,
    
    // Specialized fetches
    fetchMyInquiries,
    fetchAssignedToMe,
    
    // Selection operations
    toggleInquirySelection,
    selectAllInquiries,
    clearSelection,
    isSelected: (id: string) => selectedInquiries.has(id),
    selectedCount: selectedInquiries.size,
    
    // Pagination operations
    goToPage,
    changePageSize,
    changeOrdering,
    
    // Helper methods
    refresh: () => fetchInquiries(filters),
    clearError: () => setError(null),
  };
};