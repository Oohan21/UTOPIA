// lib/store/authStore.ts - FIXED VERSION
import { create } from "zustand";
import { useEffect } from 'react';
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/lib/api/auth";
import { User } from "@/lib/types/user";

// Helper function to ensure absolute URLs - UPDATED to never return null
const ensureAbsoluteUrls = (user: User | null): User | null => {
  if (!user) return null;

  const processedUser = { ...user };

  // Fix profile_picture URL if it's relative
  if (processedUser.profile_picture && processedUser.profile_picture.startsWith('/media/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    processedUser.profile_picture = `${baseUrl}${processedUser.profile_picture}`;
  }

  return processedUser;
};

// Helper function for non-null returns - NEW
const ensureUserWithAbsoluteUrls = (user: User): User => {
  const processedUser = { ...user };

  // Fix profile_picture URL if it's relative
  if (processedUser.profile_picture && processedUser.profile_picture.startsWith('/media/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    processedUser.profile_picture = `${baseUrl}${processedUser.profile_picture}`;
  }

  return processedUser;
};

// Response types based on your auth API
interface LoginResponse {
  user: User;
  message: string;
  session_key?: string;
  tokens?: {
    access: string;
    refresh: string;
  };
}

interface RegisterResponse {
  user: User;
  message: string;
  requiresVerification: boolean;
  email_verification_sent?: boolean;
}

interface AuthErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
  requires_verification?: boolean;
  user_id?: number;
  email?: string;
  user?: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  requiresVerification: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (data: any) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<User>;
  updateProfilePicture: (file: File) => Promise<User>;
  removeProfilePicture: () => Promise<User>;
  setAuthState: (user: User | null, isAuthenticated: boolean) => void;
  clearError: () => void;
  clearVerificationRequirement: () => void;
  checkAdminAccess: () => boolean;
  setHasHydrated: (state: boolean) => void;
  rehydrateFromSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,
      requiresVerification: false,

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      setAuthState: (user, isAuthenticated) => {
        // Ensure absolute URLs before setting
        const processedUser = ensureAbsoluteUrls(user);
        set({ user: processedUser, isAuthenticated });
      },

      clearVerificationRequirement: () => {
        set({ requiresVerification: false });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null, requiresVerification: false });
        try {
          const response = await authApi.login({ email, password }) as LoginResponse;

          // Successful login
          const processedUser = ensureUserWithAbsoluteUrls(response.user);

          // Store tokens if present in response
          if (response.tokens) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', response.tokens.access);
              localStorage.setItem('refresh_token', response.tokens.refresh);
            }
          }

          set({
            user: processedUser,
            isAuthenticated: true,
            requiresVerification: false,
            isLoading: false,
          });

          return response;

        } catch (error: any) {
          // Check if it's a verification error from backend
          const errorData = error.response?.data as AuthErrorResponse;

          if (errorData?.requires_verification) {
            const processedUser = ensureAbsoluteUrls(errorData.user || null);

            set({
              user: processedUser,
              isAuthenticated: false,
              requiresVerification: true,
              isLoading: false,
              error: errorData.error || 'Email verification required'
            });

            throw new Error('Email verification required');
          }

          // Regular error
          const errorMessage = errorData?.error ||
            errorData?.detail ||
            errorData?.message ||
            error.message ||
            "Login failed";

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });

          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null, requiresVerification: false });
        try {
          const response = await authApi.register(data) as RegisterResponse;

          // Registration successful
          const processedUser = response.user ? ensureUserWithAbsoluteUrls(response.user) : null;

          set({
            user: processedUser,
            isAuthenticated: !response.requiresVerification, // Only auth if no verification needed
            requiresVerification: response.requiresVerification,
            isLoading: false,
          });

          return response;
        } catch (error: any) {
          const errorData = error.response?.data as AuthErrorResponse;

          set({
            error: errorData?.error || errorData?.detail || "Registration failed",
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });

          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error("Logout API error:", error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requiresVerification: false,
          });

          // Clear local storage completely
          if (typeof window !== 'undefined') {
            localStorage.removeItem("auth-storage");
          }
        }
      },

      rehydrateFromSession: () => {
        if (typeof window === 'undefined') return;

        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const processedUser = ensureAbsoluteUrls(user);

            // Update Zustand state
            set({
              user: processedUser,
              isAuthenticated: true,
            });

            // Update localStorage for persistence
            const currentStorage = localStorage.getItem("auth-storage");
            if (currentStorage) {
              const parsed = JSON.parse(currentStorage);
              parsed.state.user = processedUser;
              parsed.state.isAuthenticated = true;
              localStorage.setItem("auth-storage", JSON.stringify(parsed));
            }
          } catch (error) {
            console.error("Error rehydrating from sessionStorage:", error);
          }
        }
      },

      checkAuth: async () => {
        const state = get();
        if (state.isAuthenticated && state.user) return;

        set({ isLoading: true });
        try {
          // Use the session-based endpoint
          const user = await authApi.getCurrentUser();
          const processedUser = ensureUserWithAbsoluteUrls(user);

          set({
            user: processedUser,
            isAuthenticated: true,
            requiresVerification: false,
            isLoading: false,
          });
        } catch (error) {
          console.error("Auth check failed:", error);
          set({
            user: null,
            isAuthenticated: false,
            requiresVerification: false,
            isLoading: false,
          });
        }
      },

      updateUser: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authApi.updateProfile(data);
          const processedUser = ensureUserWithAbsoluteUrls(updatedUser);

          set({
            user: processedUser,
            isAuthenticated: true,
            isLoading: false,
          });

          return processedUser;
        } catch (error: any) {
          const errorData = error.response?.data as AuthErrorResponse;

          set({
            error: errorData?.error || errorData?.detail || "Update failed",
            isLoading: false,
          });

          throw error;
        }
      },

      updateProfilePicture: async (file: File) => {
        console.log('Updating profile picture...');
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authApi.updateProfilePicture(file);
          console.log('Updated user from API:', updatedUser); // Add this log

          const processedUser = ensureUserWithAbsoluteUrls(updatedUser);
          console.log('Processed user:', processedUser); // Add this log

          set({
            user: processedUser,
            isAuthenticated: true,
            isLoading: false,
          });

          return processedUser;
        } catch (error: any) {
          console.error('Profile picture update error:', error);
          const errorData = error.response?.data as AuthErrorResponse;

          set({
            error: errorData?.error || errorData?.detail || "Profile picture upload failed",
            isLoading: false,
          });

          throw error;
        }
      },

      removeProfilePicture: async () => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authApi.removeProfilePicture();
          const processedUser = ensureUserWithAbsoluteUrls(updatedUser);

          set({
            user: processedUser,
            isLoading: false,
          });

          return processedUser;
        } catch (error: any) {
          const errorData = error.response?.data as AuthErrorResponse;

          set({
            error: errorData?.error || errorData?.detail || "Failed to remove profile picture",
            isLoading: false,
          });

          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkAdminAccess: () => {
        const { user } = get();
        return user?.user_type === 'admin' ||
          user?.is_staff === true ||
          user?.is_superuser === true;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        requiresVerification: state.requiresVerification,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Process user to ensure absolute URLs when rehydrating
          if (state.user) {
            state.user = ensureAbsoluteUrls(state.user);
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// Add a hook to check auth on app load
export const useAuthInitializer = () => {
  const { checkAuth, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated) {
      checkAuth();
    }
  }, [hasHydrated, checkAuth]);
};