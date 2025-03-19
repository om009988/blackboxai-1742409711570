import { Email } from '../services/api';

// Type declarations
declare global {
  interface Window {
    Timeout: any;
  }
}

// Email categories with their display properties
export const EMAIL_CATEGORIES = {
  PRODUCT_INQUIRY: 'Product Inquiry',
  SUPPORT_REQUEST: 'Support Request',
  SALES_LEAD: 'Sales Lead',
  PARTNERSHIP: 'Partnership',
  OTHER: 'Other',
} as const;

export type EmailCategory = typeof EMAIL_CATEGORIES[keyof typeof EMAIL_CATEGORIES];

// Category styling configuration
export const CATEGORY_STYLES: Record<EmailCategory, { bg: string; text: string }> = {
  [EMAIL_CATEGORIES.PRODUCT_INQUIRY]: { bg: 'bg-blue-100', text: 'text-blue-800' },
  [EMAIL_CATEGORIES.SUPPORT_REQUEST]: { bg: 'bg-green-100', text: 'text-green-800' },
  [EMAIL_CATEGORIES.SALES_LEAD]: { bg: 'bg-purple-100', text: 'text-purple-800' },
  [EMAIL_CATEGORIES.PARTNERSHIP]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [EMAIL_CATEGORIES.OTHER]: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// Navigation items
export const NAV_ITEMS = [
  { name: 'Inbox', href: '/dashboard', icon: 'inbox' },
  { name: 'Starred', href: '/starred', icon: 'star' },
  { name: 'Archive', href: '/archive', icon: 'archive' },
  { name: 'Trash', href: '/trash', icon: 'trash' },
] as const;

// API endpoints
export const API_ENDPOINTS = {
  EMAILS: '/emails',
  EMAIL: (id: string) => `/email/${id}`,
  SYNC: '/sync',
  SUGGEST_REPLIES: (id: string) => `/suggest-replies/${id}`,
  MARK_INTERESTED: '/mark-interested',
} as const;

// Date formats
export const DATE_FORMATS = {
  FULL: 'PPP',
  SHORT: 'PP',
  TIME: 'p',
  RELATIVE: 'relative',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 20,
  SIZES: [10, 20, 50, 100] as const,
} as const;

// Search
export const SEARCH = {
  MIN_CHARS: 3,
  DEBOUNCE_MS: 300,
} as const;

// Toast notifications
export const TOAST_CONFIG = {
  SUCCESS: {
    duration: 3000,
    className: 'bg-green-500',
  },
  ERROR: {
    duration: 5000,
    className: 'bg-red-500',
  },
  INFO: {
    duration: 3000,
    className: 'bg-blue-500',
  },
} as const;

// Email sorting options
export const SORT_OPTIONS = {
  DATE: 'date',
  SENDER: 'sender',
  SUBJECT: 'subject',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

// Email filters
export interface EmailFilters {
  search?: string;
  category?: EmailCategory;
  isInterested?: boolean;
  sortBy?: SortOption;
}

// Local storage keys
export const STORAGE_KEYS = {
  FILTERS: 'email-filters',
  THEME: 'theme-preference',
  AUTH: 'auth-token',
} as const;

// Theme options
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch emails',
  SYNC_FAILED: 'Failed to synchronize emails',
  UPDATE_FAILED: 'Failed to update email',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_EMAIL: 'Invalid email address',
  UNAUTHORIZED: 'Unauthorized access',
} as const;

// Animation durations (in milliseconds)
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (in pixels)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

// Maximum lengths
export const MAX_LENGTHS = {
  SUBJECT: 100,
  PREVIEW: 150,
  SENDER_NAME: 50,
} as const;

// Regular expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
} as const;