import { Email } from '../services/api';

export interface SearchState {
  query: string;
  filters: SearchFilters;
  sortConfig: SortConfig;
  isSearching: boolean;
}

export interface SearchFilters {
  category?: string;
  isInterested?: boolean;
  startDate?: Date;
  endDate?: Date;
  sender?: string;
  subject?: string;
}

export interface SortConfig {
  field: keyof Email;
  direction: 'asc' | 'desc';
}

export interface SearchOptions {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  initialSort?: SortConfig;
  debounceMs?: number;
  minQueryLength?: number;
}

export interface FilterOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  filterFn?: (item: T, query: string, filters: SearchFilters) => boolean;
  sortFn?: (a: T, b: T, sortConfig: SortConfig) => number;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface SearchFunctions {
  search: (query: string) => void;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  updateSort: (field: keyof Email) => void;
  resetSearch: () => void;
}

export type SearchField = keyof Pick<Email, 
  | 'subject'
  | 'sender'
  | 'content'
  | 'category'
>;

export const DEFAULT_SEARCH_FIELDS: SearchField[] = [
  'subject',
  'sender',
  'content',
  'category'
];

export const DEFAULT_SORT_CONFIG: SortConfig = {
  field: 'timestamp',
  direction: 'desc'
};

export const SEARCH_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  FROM: 'from:',
  TO: 'to:',
  SUBJECT: 'subject:',
  CATEGORY: 'category:',
  BEFORE: 'before:',
  AFTER: 'after:',
  HAS: 'has:',
  IS: 'is:',
} as const;

export type SearchOperator = typeof SEARCH_OPERATORS[keyof typeof SEARCH_OPERATORS];

export interface SearchToken {
  type: 'text' | 'operator' | 'field' | 'value';
  value: string;
  operator?: SearchOperator;
  field?: SearchField;
}

export interface ParsedSearch {
  query: string;
  tokens: SearchToken[];
  filters: SearchFilters;
}

export interface SearchHighlight {
  field: SearchField;
  matches: Array<{
    text: string;
    indices: [number, number][];
  }>;
}

export interface SearchSuggestion {
  type: 'recent' | 'popular' | 'field' | 'operator';
  text: string;
  description?: string;
  category?: string;
  count?: number;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  facets?: Record<string, number>;
}

export const SEARCH_DEFAULTS = {
  minQueryLength: 2,
  maxResults: 100,
  debounceMs: 300,
  highlightClass: 'search-highlight',
  snippetLength: 150,
} as const;

export function isValidSearchField(field: string): field is SearchField {
  return DEFAULT_SEARCH_FIELDS.includes(field as SearchField);
}

export function isValidSearchOperator(op: string): op is SearchOperator {
  return Object.values(SEARCH_OPERATORS).includes(op as SearchOperator);
}