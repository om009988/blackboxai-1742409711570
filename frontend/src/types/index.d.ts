declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '@heroicons/react/*' {
  const content: React.FC<{
    className?: string;
    'aria-hidden'?: boolean;
  }>;
  export default content;
}

declare module 'classnames' {
  const classNames: (...args: any[]) => string;
  export default classNames;
}

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
  }
}

declare module 'react-hot-toast' {
  export interface Toast {
    id: string;
    type: 'success' | 'error' | 'loading' | 'blank' | 'custom';
    message: string | React.ReactNode;
    icon?: React.ReactNode;
    duration?: number;
    pauseDuration: number;
    ariaProps: {
      role: 'status' | 'alert';
      'aria-live': 'assertive' | 'off' | 'polite';
    };
  }

  export interface ToasterProps {
    position?: Position;
    toastOptions?: DefaultToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
    children?: (toast: Toast) => JSX.Element;
  }

  export interface DefaultToastOptions {
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
    success?: Partial<ToastOptions>;
    error?: Partial<ToastOptions>;
    loading?: Partial<ToastOptions>;
    blank?: Partial<ToastOptions>;
  }

  export type Position =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

  export interface ToastOptions {
    id?: string;
    icon?: React.ReactNode;
    duration?: number;
    ariaProps?: {
      role?: 'status' | 'alert';
      'aria-live'?: 'assertive' | 'off' | 'polite';
    };
    className?: string;
    style?: React.CSSProperties;
    position?: Position;
    iconTheme?: {
      primary: string;
      secondary: string;
    };
  }

  export const Toaster: React.FC<ToasterProps>;
  
  const toast: {
    (message: string | React.ReactNode, options?: ToastOptions): string;
    success: (message: string | React.ReactNode, options?: ToastOptions) => string;
    error: (message: string | React.ReactNode, options?: ToastOptions) => string;
    loading: (message: string | React.ReactNode, options?: ToastOptions) => string;
    custom: (element: JSX.Element, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      },
      opts?: DefaultToastOptions
    ) => Promise<T>;
  };

  export default toast;
}