import { useState, useEffect, useCallback, useRef } from 'react';
import { useIntersectionObserver } from './useUI';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  onLoadMore: () => Promise<void>;
  hasNextPage?: boolean;
}

interface UseInfiniteScrollResult {
  loadMoreRef: (element: Element | null) => void;
  isLoading: boolean;
  error: Error | null;
}

export function useInfiniteScroll({
  threshold = 0.5,
  rootMargin = '100px',
  enabled = true,
  onLoadMore,
  hasNextPage = true,
}: UseInfiniteScrollOptions): UseInfiniteScrollResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (
        entry.isIntersecting &&
        hasNextPage &&
        enabled &&
        !loadingRef.current
      ) {
        try {
          loadingRef.current = true;
          setIsLoading(true);
          setError(null);
          await onLoadMore();
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load more items'));
        } finally {
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [hasNextPage, enabled, onLoadMore]
  );

  const loadMoreRef = useIntersectionObserver(handleIntersect, {
    threshold,
    rootMargin,
  });

  return {
    loadMoreRef,
    isLoading,
    error,
  };
}

interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  pageSize?: number;
  maxPages?: number;
}

interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  pages: number[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
}

export function usePagination({
  totalItems,
  initialPage = 1,
  pageSize: initialPageSize = 10,
  maxPages = 5,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  useEffect(() => {
    // Reset to first page when pageSize changes
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    // Adjust currentPage if it exceeds totalPages
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Generate array of page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const halfMaxPages = Math.floor(maxPages / 2);
    
    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    pages: getPageNumbers(),
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
  };
}

// Helper function to calculate pagination metadata
export function getPaginationMetadata(
  totalItems: number,
  currentPage: number,
  pageSize: number
) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    currentPageItems: endIndex - startIndex + 1,
  };
}

// Helper function to create page ranges
export function createPageRange(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}