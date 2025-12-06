// src/lib/store/uiStore.ts
import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  language: 'en' | 'am';
  isMobileMenuOpen: boolean;
  isSearchModalOpen: boolean;
  isFilterModalOpen: boolean;
  isLoading: boolean;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLanguage: (language: 'en' | 'am') => void;
  toggleMobileMenu: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  setIsLoading: (isLoading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  language: 'en',
  isMobileMenuOpen: false,
  isSearchModalOpen: false,
  isFilterModalOpen: false,
  isLoading: false,
  toast: {
    show: false,
    message: '',
    type: 'info',
  },
  
  setTheme: (theme) => set(() => ({ theme })),
  
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light',
  })),
  
  setLanguage: (language) => set(() => ({ language })),
  
  toggleMobileMenu: () => set((state) => ({
    isMobileMenuOpen: !state.isMobileMenuOpen,
  })),
  
  openSearchModal: () => set(() => ({ isSearchModalOpen: true })),
  
  closeSearchModal: () => set(() => ({ isSearchModalOpen: false })),
  
  openFilterModal: () => set(() => ({ isFilterModalOpen: true })),
  
  closeFilterModal: () => set(() => ({ isFilterModalOpen: false })),
  
  setIsLoading: (isLoading) => set(() => ({ isLoading })),
  
  showToast: (message, type = 'info') => set(() => ({
    toast: { show: true, message, type },
  })),
  
  hideToast: () => set((state) => ({
    toast: { ...state.toast, show: false },
  })),
}));