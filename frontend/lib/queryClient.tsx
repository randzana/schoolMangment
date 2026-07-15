'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  // Override window.open globally to automatically append the authentication token
  if (typeof window !== 'undefined' && !(window as any).__windowOpenOverridden) {
    (window as any).__windowOpenOverridden = true;
    const originalOpen = window.open;
    window.open = function (url, target, features) {
      if (url) {
        const urlStr = url.toString();
        if (urlStr.includes('/api/') || urlStr.includes(':8000') || urlStr.includes('school-backend')) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            const separator = urlStr.includes('?') ? '&' : '?';
            url = `${urlStr}${separator}token=${token}`;
          }
        }
      }
      return originalOpen.call(window, url, target, features);
    };
  }

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Mark data as immediately stale so it is always refetched
            retry: 1,
            refetchOnWindowFocus: true, // Auto-refetch when user focuses back on the browser tab
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

