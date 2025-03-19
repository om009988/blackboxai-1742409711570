import { useQuery, useMutation, QueryClient } from 'react-query';
import { emailService, Email, EmailsResponse } from '../services/api';
import toast from 'react-hot-toast';

interface UseEmailsOptions {
  page?: number;
  size?: number;
  query?: string;
  category?: string;
}

interface UseEmailsResult {
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

const queryClient = new QueryClient();

export function useEmails(options: UseEmailsOptions = {}): UseEmailsResult {
  const { page = 1, size = 20, query, category } = options;

  // Fetch emails
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch
  } = useQuery<EmailsResponse>(
    ['emails', { page, size, query, category }],
    () => emailService.getEmails({ page, size, query, category }),
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Sync emails mutation
  const syncMutation = useMutation(
    () => emailService.syncEmails(),
    {
      onSuccess: () => {
        toast.success('Emails synchronized successfully');
        queryClient.invalidateQueries(['emails']);
      },
      onError: () => {
        toast.error('Failed to synchronize emails');
      },
    }
  );

  // Mark email as interested mutation
  const markInterestedMutation = useMutation(
    ({ emailId, interested }: { emailId: string; interested: boolean }) =>
      emailService.markInterested(emailId, interested),
    {
      onSuccess: (_, variables) => {
        toast.success(
          variables.interested
            ? 'Email marked as interested'
            : 'Email unmarked as interested'
        );
        queryClient.invalidateQueries(['emails']);
      },
      onError: () => {
        toast.error('Failed to update email status');
      },
    }
  );

  // Wrap refetch to return void promise
  const refetch = async (): Promise<void> => {
    await queryRefetch();
  };

  return {
    emails: data?.emails || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    syncEmails: () => syncMutation.mutate(),
    isSyncing: syncMutation.isLoading,
    markInterested: markInterestedMutation.mutate,
    isMarkingInterested: markInterestedMutation.isLoading,
  };
}

// Hook for single email operations
export function useEmail(emailId: string) {
  const {
    data: email,
    isLoading,
    error,
  } = useQuery<Email>(
    ['email', emailId],
    () => emailService.getEmail(emailId),
    {
      enabled: !!emailId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const markInterestedMutation = useMutation(
    (interested: boolean) => emailService.markInterested(emailId, interested),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['email', emailId]);
        queryClient.invalidateQueries(['emails']);
      },
      onError: () => {
        toast.error('Failed to update email status');
      },
    }
  );

  return {
    email,
    isLoading,
    error,
    markInterested: markInterestedMutation.mutate,
    isMarkingInterested: markInterestedMutation.isLoading,
  };
}