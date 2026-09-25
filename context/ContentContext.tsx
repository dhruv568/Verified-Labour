'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_SITE_CONTENT } from '@/lib/site-config';

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
  const [loading, setLoading] = useState(true);

  const refreshContent = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      if (data.success && data.content) {
        setContent(data.content);
      }
    } catch (err) {
      console.error('Failed to load site content from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContent();
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading, refreshContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
