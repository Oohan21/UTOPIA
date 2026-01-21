import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    updateUser,
    updateProfilePicture,
    removeProfilePicture,
    setAuthState,
    clearError,
    checkAdminAccess,
    rehydrateFromSession,
  } = useAuthStore();

  useEffect(() => {
    // Check auth on mount if we have tokens
    if (typeof window !== "undefined") {
      const hasTokens = localStorage.getItem("access_token") && localStorage.getItem("refresh_token");
      if (hasTokens && !isAuthenticated) {
        checkAuth();
      }
    }
  }, [checkAuth, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    updateUser,
    updateProfilePicture,
    removeProfilePicture, 
    setAuthState,
    clearError,
    checkAdminAccess,
    rehydrateFromSession,
  };
};