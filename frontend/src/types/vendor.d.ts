declare module 'react-query' {
  import { ComponentType, ReactNode } from 'react';

  export type QueryKey = readonly unknown[];

  export interface QueryFunctionContext<
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = any
  > {
    queryKey: TQueryKey;
    pageParam?: TPageParam;
    signal?: AbortSignal;
    meta: any;
  }

  export type QueryFunction<
    TData = unknown,
    TQueryKey extends QueryKey = QueryKey
  > = (context: QueryFunctionContext<TQueryKey>) => Promise<TData>;

  export interface QueryClientConfig {
    defaultOptions?: {
      queries?: {
        retry?: boolean | number;
        retryDelay?: (attemptIndex: number) => number;
        staleTime?: number;
        cacheTime?: number;
        refetchOnMount?: boolean | "always";
        refetchOnWindowFocus?: boolean | "always";
        refetchOnReconnect?: boolean | "always";
        refetchInterval?: number | false;
        refetchIntervalInBackground?: boolean;
        suspense?: boolean;
      };
    };
  }

  export class QueryClient {
    constructor(config?: QueryClientConfig);
    invalidateQueries(queryKey?: QueryKey): Promise<void>;
  }

  export interface QueryClientProviderProps {
    client: QueryClient;
    children?: ReactNode;
  }

  export const QueryClientProvider: ComponentType<QueryClientProviderProps>;

  export interface UseQueryOptions<
    TData = unknown,
    TError = unknown,
    TQueryKey extends QueryKey = QueryKey
  > {
    queryKey?: TQueryKey;
    queryFn?: QueryFunction<TData, TQueryKey>;
    enabled?: boolean;
    retry?: boolean | number;
    retryDelay?: (attemptIndex: number) => number;
    staleTime?: number;
    cacheTime?: number;
    refetchInterval?: number | false;
    refetchIntervalInBackground?: boolean;
    refetchOnMount?: boolean | "always";
    refetchOnWindowFocus?: boolean | "always";
    refetchOnReconnect?: boolean | "always";
    suspense?: boolean;
    keepPreviousData?: boolean;
    select?: (data: TData) => TData;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    onSettled?: (data: TData | undefined, error: TError | null) => void;
  }

  export interface UseQueryResult<TData = unknown, TError = unknown> {
    data?: TData;
    error: TError | null;
    isError: boolean;
    isIdle: boolean;
    isLoading: boolean;
    isLoadingError: boolean;
    isRefetchError: boolean;
    isSuccess: boolean;
    status: 'idle' | 'loading' | 'error' | 'success';
    isFetching: boolean;
    isPreviousData: boolean;
    isPlaceholderData: boolean;
    isPaused: boolean;
    refetch: () => Promise<UseQueryResult<TData, TError>>;
    remove: () => void;
  }

  export function useQuery<
    TData = unknown,
    TError = unknown,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TData, TQueryKey>,
    options?: UseQueryOptions<TData, TError, TQueryKey>
  ): UseQueryResult<TData, TError>;

  export interface UseMutationOptions<
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown
  > {
    mutationFn?: (variables: TVariables) => Promise<TData>;
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => Promise<void> | void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined
    ) => Promise<void> | void;
  }

  export interface UseMutationResult<
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown
  > {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    isIdle: boolean;
    error: TError | null;
    data?: TData;
    reset: () => void;
  }

  export function useMutation<
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown
  >(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: UseMutationOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>;
}

declare module 'react-hot-toast' {
  import { ReactNode } from 'react';

  export interface ToastOptions {
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
    success?: {
      duration?: number;
      icon?: ReactNode;
    };
    error?: {
      duration?: number;
      icon?: ReactNode;
    };
    loading?: {
      duration?: number;
      icon?: ReactNode;
    };
    icon?: ReactNode;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  }

  export interface Toast {
    id: string;
    type: 'success' | 'error' | 'loading' | 'blank' | 'custom';
    message: string | ReactNode;
    icon?: ReactNode;
    duration?: number;
    pauseDuration: number;
    position?: ToastOptions['position'];
  }

  export const toast: {
    (message: string | ReactNode, options?: ToastOptions): string;
    success: (message: string | ReactNode, options?: ToastOptions) => string;
    error: (message: string | ReactNode, options?: ToastOptions) => string;
    loading: (message: string | ReactNode, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
  };

  export const Toaster: React.FC<{
    position?: ToastOptions['position'];
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
  }>;

  export default toast;
}