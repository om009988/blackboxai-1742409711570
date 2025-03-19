import { useState, useCallback, useRef, useEffect } from 'react';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import { ERROR_MESSAGES } from '../utils/constants';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  cacheKey?: string;
  cacheTime?: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface ApiState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

type ApiFunction<T, P = void> = (params?: P) => Promise<AxiosResponse<T>>;

const cache = new Map<string, CacheItem<any>>();

export function useApi<T, P = void>(
  apiFunction: ApiFunction<T, P>,
  options: UseApiOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache time
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check cache on mount if cacheKey is provided
  useEffect(() => {
    if (cacheKey) {
      const cachedItem = cache.get(cacheKey);
      if (cachedItem && Date.now() - cachedItem.timestamp < cacheTime) {
        setState({ data: cachedItem.data, error: null, isLoading: false });
      }
    }
  }, [cacheKey, cacheTime]);

  const execute = useCallback(
    async (params?: P) => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await apiFunction(params);
        const data = response.data;

        // Cache the response if cacheKey is provided
        if (cacheKey) {
          cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        setState({ data, error: null, isLoading: false });
        onSuccess?.(data);
        return data;
      } catch (error) {
        let errorMessage = ERROR_MESSAGES.NETWORK_ERROR;

        if (error instanceof AxiosError) {
          errorMessage = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        const errorObject = new Error(errorMessage);
        setState({ data: null, error: errorObject, isLoading: false });
        onError?.(errorObject);
        toast.error(errorMessage);
        throw errorObject;
      }
    },
    [apiFunction, cacheKey, onSuccess, onError]
  );

  // Cleanup function
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
  }, [cacheKey]);

  const invalidateCache = useCallback(() => {
    clearCache();
    return execute();
  }, [clearCache, execute]);

  return {
    ...state,
    execute,
    clearCache,
    invalidateCache,
  };
}

// Helper function to clear entire cache
export function clearAllCache() {
  cache.clear();
}

// Helper function to get cache size
export function getCacheSize() {
  return cache.size;
}

// Helper function to check if a key is cached
export function isCached(key: string) {
  return cache.has(key);
}

// Helper function to get cache entry
export function getCacheEntry<T>(key: string): CacheItem<T> | undefined {
  return cache.get(key);
}

// Helper function to set cache entry manually
export function setCacheEntry<T>(key: string, data: T) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}