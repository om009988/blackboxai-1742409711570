import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Configure React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

// Configure toast notifications
export const toasterConfig = {
  position: 'top-right',
  toastOptions: {
    duration: 4000,
    success: {
      duration: 3000,
      className: 'bg-green-500',
    },
    error: {
      duration: 5000,
      className: 'bg-red-500',
    },
    loading: {
      duration: Infinity,
      className: 'bg-blue-500',
    },
  },
};

// Root component wrapper
interface RootWrapperProps {
  children: React.ReactNode;
}

export function RootWrapper({ children }: RootWrapperProps) {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster {...toasterConfig} />
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Helper function to render the app
export function renderApp(App: React.ComponentType) {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');

  ReactDOM.render(
    <RootWrapper>
      <App />
    </RootWrapper>,
    rootElement
  );
}

// Type declarations for modules
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

declare module 'react-query' {
  export interface QueryKey extends Array<string | number | null | undefined> {}
}

declare module 'react-hot-toast' {
  export interface ToastOptions {
    className?: string;
    style?: React.CSSProperties;
    duration?: number;
    icon?: React.ReactNode;
  }
}

// Environment type declarations
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      REACT_APP_API_URL: string;
      REACT_APP_VERSION: string;
      PUBLIC_URL: string;
    }
  }
}

// React component type helpers
export type ReactComponent<P = {}> = React.ComponentType<P>;
export type ReactFC<P = {}> = React.FC<P>;
export type ReactElement = React.ReactElement;
export type ReactNode = React.ReactNode;

// Hook type helpers
export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
export type RefObject<T> = React.RefObject<T>;
export type MutableRefObject<T> = React.MutableRefObject<T>;

// Event type helpers
export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
export type FormEvent<T = Element> = React.FormEvent<T>;
export type MouseEvent<T = Element> = React.MouseEvent<T>;
export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;

// Style type helpers
export type CSSProperties = React.CSSProperties;
export type CSSVariables = { [key: `--${string}`]: string | number };

// Utility type helpers
export type PropsWithChildren<P = unknown> = React.PropsWithChildren<P>;
export type PropsWithRef<P = unknown> = React.PropsWithRef<P>;
export type PropsWithoutRef<P = unknown> = React.PropsWithoutRef<P>;

// Export React and ReactDOM for convenience
export { React, ReactDOM };