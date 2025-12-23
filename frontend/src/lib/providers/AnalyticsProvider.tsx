// src/lib/providers/AnalyticsProvider.tsx
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAnalyticsTracker } from '@/lib/hooks/useAnalytics';
import { usePathname } from 'next/navigation';

const AnalyticsContext = createContext<ReturnType<typeof useAnalyticsTracker> | null>(null);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const tracker = useAnalyticsTracker();
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      tracker.trackPageView(pathname);
    }
  }, [pathname, tracker]);

  return (
    <AnalyticsContext.Provider value={tracker}>
      {children}
    </AnalyticsContext.Provider>
  );
};