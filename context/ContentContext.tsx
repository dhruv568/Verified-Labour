'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-config';
import { fetchWithTimeout } from '@/lib/fetch-utils';

interface ContentContextType {
  content: Record<string, string>;
  loading: boolean;
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType>({
  content: DEFAULT_SITE_CONTENT,
  loading: false,
  refreshContent: async () => {},
});

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Record<string, string>>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(false);

  const refreshContent = React.useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`/api/content?t=${Date.now()}`, {
        timeoutMs: 3000,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          setContent(data.content);
        }
      }
    } catch (err) {
      // Keep default content silently on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshContent();

    const handleUpdate = () => {
      refreshContent();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('site-content-updated', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('site-content-updated', handleUpdate);
      }
    };
  }, [refreshContent]);

  const value = React.useMemo(
    () => ({ content, loading, refreshContent }),
    [content, loading, refreshContent]
  );

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}

