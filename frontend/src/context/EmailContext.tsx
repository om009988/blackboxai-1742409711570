import React, { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Email } from '../services/api';
import { useEmails } from '../hooks/useEmails';

// Define the shape of our context
interface EmailContextType {
  emails: Email[];
  total: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
  syncEmails: () => void;
  isSyncing: boolean;
  markInterested: (params: { emailId: string; interested: boolean }) => void;
  isMarkingInterested: boolean;
}

// Create the context with undefined as initial value
const EmailContext = createContext<EmailContextType | undefined>(undefined);

// Configure the QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

interface EmailProviderProps {
  children: ReactNode;
}

export function EmailProvider({ children }: EmailProviderProps) {
  const {
    emails,
    total,
    isLoading,
    error,
    refetch,
    syncEmails,
    isSyncing,
    markInterested,
    isMarkingInterested,
  } = useEmails();

  const value: EmailContextType = {
    emails,
    total,
    isLoading,
    error,
    refetch,
    syncEmails,
    isSyncing,
    markInterested,
    isMarkingInterested,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <EmailContext.Provider value={value}>
        {children}
      </EmailContext.Provider>
    </QueryClientProvider>
  );
}

export function useEmailContext(): EmailContextType {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmailContext must be used within an EmailProvider');
  }
  return context;
}