import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useUI';
import { SEARCH_DEFAULTS, DEFAULT_SEARCH_FIELDS, DEFAULT_SORT_CONFIG } from '../types/search';
import type {
  SearchState,
  SearchFilters,
  SearchOptions,
  SearchField,
  SortConfig,
  SearchToken,
  ParsedSearch,
  SearchStats
} from '../types/search';
import { Email } from '../services/api';

export function useSearch(options: SearchOptions = {}) {
  const {
    initialQuery = '',
    initialFilters = {},
    initialSort = DEFAULT_SORT_CONFIG,
    debounceMs = SEARCH_DEFAULTS.debounceMs,
    minQueryLength = SEARCH_DEFAULTS.minQueryLength,
  } = options;

  const [state, setState] = useState<SearchState>({
    query: initialQuery,
    filters: initialFilters,
    sortConfig: initialSort,
    isSearching: false,
  });

  const debouncedQuery = useDebounce(state.query, debounceMs);

  const isValidSearch = useMemo(() => 
    debouncedQuery.length >= minQueryLength ||
    Object.keys(state.filters).length > 0,
    [debouncedQuery, state.filters, minQueryLength]
  );

  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  const setFilters = useCallback((filters: SearchFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  const setSortConfig = useCallback((sortConfig: SortConfig) => {
    setState(prev => ({ ...prev, sortConfig }));
  }, []);

  const updateSort = useCallback((field: keyof Email) => {
    setState(prev => ({
      ...prev,
      sortConfig: {
        field,
        direction: prev.sortConfig.field === field && 
          prev.sortConfig.direction === 'asc' ? 'desc' : 'asc',
      },
    }));
  }, []);

  const resetSearch = useCallback(() => {
    setState({
      query: '',
      filters: {},
      sortConfig: DEFAULT_SORT_CONFIG,
      isSearching: false,
    });
  }, []);

  // Parse search query into tokens
  const parseSearch = useCallback((query: string): ParsedSearch => {
    const tokens: SearchToken[] = [];
    const filters: SearchFilters = {};
    const words = query.trim().split(/\s+/);
    
    words.forEach(word => {
      const [field, value] = word.split(':');
      if (value && DEFAULT_SEARCH_FIELDS.includes(field as SearchField)) {
        tokens.push({
          type: 'field',
          value: word,
          field: field as SearchField,
        });
        filters[field as keyof SearchFilters] = value;
      } else {
        tokens.push({
          type: 'text',
          value: word,
        });
      }
    });

    return { query, tokens, filters };
  }, []);

  // Generate search stats
  const getSearchStats = useCallback((results: Email[]): SearchStats => {
    const startTime = performance.now();
    const stats: SearchStats = {
      totalResults: results.length,
      searchTime: performance.now() - startTime,
      facets: {},
    };

    // Calculate facets
    results.forEach(email => {
      if (email.category) {
        stats.facets![email.category] = (stats.facets![email.category] || 0) + 1;
      }
    });

    return stats;
  }, []);

  // Filter emails based on search criteria
  const filterEmails = useCallback((emails: Email[]): Email[] => {
    if (!isValidSearch) return emails;

    return emails.filter(email => {
      // Check text search
      const matchesSearch = !debouncedQuery || 
        DEFAULT_SEARCH_FIELDS.some(field => 
          String(email[field]).toLowerCase().includes(debouncedQuery.toLowerCase())
        );

      // Check filters
      const matchesFilters = Object.entries(state.filters).every(([key, value]) => {
        if (!value) return true;
        if (key === 'startDate') {
          return new Date(email.timestamp) >= new Date(value);
        }
        if (key === 'endDate') {
          return new Date(email.timestamp) <= new Date(value);
        }
        return email[key as keyof Email] === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [debouncedQuery, state.filters, isValidSearch]);

  // Sort filtered results
  const sortResults = useCallback((results: Email[]): Email[] => {
    const { field, direction } = state.sortConfig;
    return [...results].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [state.sortConfig]);

  return {
    query: state.query,
    filters: state.filters,
    sortConfig: state.sortConfig,
    isSearching: state.isSearching,
    debouncedQuery,
    isValidSearch,
    setQuery,
    setFilters,
    updateFilters,
    setSortConfig,
    updateSort,
    resetSearch,
    parseSearch,
    filterEmails,
    sortResults,
    getSearchStats,
  };
}