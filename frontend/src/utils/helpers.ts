import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Email } from '../services/api';

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const distance = formatDistanceToNow(date, { addSuffix: true });
    const fullDate = format(date, 'PPP');
    return `${distance} (${fullDate})`;
  } catch (error) {
    return dateString;
  }
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const groupEmailsByDate = (emails: Email[]): Record<string, Email[]> => {
  const groups: Record<string, Email[]> = {};
  
  emails.forEach(email => {
    const date = format(parseISO(email.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(email);
  });

  return groups;
};

export const sortEmails = (emails: Email[], sortBy: 'date' | 'sender' | 'subject' = 'date'): Email[] => {
  return [...emails].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'sender':
        return a.sender.localeCompare(b.sender);
      case 'subject':
        return a.subject.localeCompare(b.subject);
      default:
        return 0;
    }
  });
};

export const filterEmails = (
  emails: Email[],
  filters: {
    search?: string;
    category?: string;
    isInterested?: boolean;
  }
): Email[] => {
  return emails.filter(email => {
    const matchesSearch = !filters.search || 
      email.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      email.sender.toLowerCase().includes(filters.search.toLowerCase()) ||
      email.content.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory = !filters.category || email.category === filters.category;
    
    const matchesInterested = filters.isInterested === undefined || 
      email.is_interested === filters.isInterested;

    return matchesSearch && matchesCategory && matchesInterested;
  });
};

export const generateEmailColor = (email: string): string => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};

export const categoryColors: Record<string, { bg: string; text: string }> = {
  'Product Inquiry': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Support Request': { bg: 'bg-green-100', text: 'text-green-800' },
  'Sales Lead': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Partnership': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Other': { bg: 'bg-gray-100', text: 'text-gray-800' }
};