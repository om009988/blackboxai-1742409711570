import * as React from 'react';
import type { SVGProps } from 'react';

// HeroIcon type definition
export type HeroIconType = (props: SVGProps<SVGSVGElement>) => JSX.Element;

// Navigation item type
export interface NavigationItem {
  name: string;
  href: string;
  icon: HeroIconType;
}

// Category type
export interface Category {
  name: string;
  color: string;
}

// Component prop types
export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export interface HeaderProps {
  onMenuClick: () => void;
}

// Email types (matching backend types)
export interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  category?: string;
  is_interested: boolean;
}

export interface EmailsResponse {
  total: number;
  emails: Email[];
}

export interface SuggestedReply {
  text: string;
  confidence: number;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

// Toast types
export interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  success?: {
    duration?: number;
    icon?: React.ReactNode;
  };
  error?: {
    duration?: number;
    icon?: React.ReactNode;
  };
}

// Environment variables type
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
      PUBLIC_URL: string;
    }
  }
}

// Re-export common types
export type { SVGProps } from 'react';