// src/lib/store/adminStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  // UI State
  sidebarOpen: boolean;
  viewMode: 'grid' | 'table';
  
  // Filter State
  userFilters: {
    search: string;
    userType: string;
    status: string;
  };
  propertyFilters: {
    search: string;
    propertyType: string;
    status: string;
    city: string;
  };
  
  // Actions
  toggleSidebar: () => void;
  setViewMode: (mode: 'grid' | 'table') => void;
  setUserFilters: (filters: Partial<AdminState['userFilters']>) => void;
  setPropertyFilters: (filters: Partial<AdminState['propertyFilters']>) => void;
  resetFilters: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      viewMode: 'table',
      
      userFilters: {
        search: '',
        userType: '',
        status: '',
      },
      
      propertyFilters: {
        search: '',
        propertyType: '',
        status: '',
        city: '',
      },
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setUserFilters: (filters) =>
        set((state) => ({
          userFilters: { ...state.userFilters, ...filters },
        })),
      
      setPropertyFilters: (filters) =>
        set((state) => ({
          propertyFilters: { ...state.propertyFilters, ...filters },
        })),
      
      resetFilters: () =>
        set({
          userFilters: {
            search: '',
            userType: '',
            status: '',
          },
          propertyFilters: {
            search: '',
            propertyType: '',
            status: '',
            city: '',
          },
        }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        viewMode: state.viewMode,
      }),
    }
  )
);