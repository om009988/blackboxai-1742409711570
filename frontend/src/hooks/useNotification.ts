import { useCallback } from 'react';
import toast, { Toast, ToastOptions } from 'react-hot-toast';
import { TOAST_CONFIG } from '../utils/constants';

interface NotificationOptions extends Partial<ToastOptions> {
  duration?: number;
  icon?: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

interface UseNotificationResult {
  notify: (message: string, options?: NotificationOptions) => string;
  success: (message: string, options?: NotificationOptions) => string;
  error: (message: string, options?: NotificationOptions) => string;
  warning: (message: string, options?: NotificationOptions) => string;
  info: (message: string, options?: NotificationOptions) => string;
  loading: (message: string, options?: NotificationOptions) => string;
  dismiss: (toastId?: string) => void;
  dismissAll: () => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: NotificationOptions
  ) => Promise<T>;
}

export function useNotification(): UseNotificationResult {
  const notify = useCallback((message: string, options: NotificationOptions = {}) => {
    return toast(message, {
      ...TOAST_CONFIG.INFO,
      ...options,
    });
  }, []);

  const success = useCallback((message: string, options: NotificationOptions = {}) => {
    return toast.success(message, {
      ...TOAST_CONFIG.SUCCESS,
      ...options,
    });
  }, []);

  const error = useCallback((message: string, options: NotificationOptions = {}) => {
    return toast.error(message, {
      ...TOAST_CONFIG.ERROR,
      ...options,
    });
  }, []);

  const warning = useCallback((message: string, options: NotificationOptions = {}) => {
    return toast(message, {
      ...TOAST_CONFIG.WARNING,
      icon: '⚠️',
      ...options,
    });
  }, []);

  const info = useCallback((message: string, options: NotificationOptions = {}) => {
    return toast(message, {
      ...TOAST_CONFIG.INFO,
      icon: 'ℹ️',
      ...options,
    });
  }, []);

  const loading = useCallback((message: string, options: NotificationOptions = {}) => {
    return toast.loading(message, {
      ...TOAST_CONFIG.LOADING,
      ...options,
    });
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    toast.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  const promise = useCallback(
    async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      },
      options: NotificationOptions = {}
    ): Promise<T> => {
      const toastId = loading(messages.loading, options);

      try {
        const data = await promise;
        const successMessage = typeof messages.success === 'function'
          ? messages.success(data)
          : messages.success;
        success(successMessage, { id: toastId, ...options });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        const errorMessage = typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
        toast.error(errorMessage, { id: toastId, ...options });
        throw error;
      }
    },
    [loading, success]
  );

  return {
    notify,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    dismissAll,
    promise,
  };
}

// Helper function to create a custom toast component
export function createCustomToast(
  content: React.ReactNode,
  options: NotificationOptions = {}
): string {
  return toast.custom(content, options);
}

// Helper function to update an existing toast
export function updateToast(
  toastId: string,
  content: React.ReactNode,
  options: NotificationOptions = {}
): void {
  toast.custom(content, { id: toastId, ...options });
}

// Helper function to check if a toast is active
export function isToastActive(toastId: string): boolean {
  const toasts = toast.get(toastId);
  return toasts.length > 0;
}

// Helper function to get all active toasts
export function getActiveToasts(): Toast[] {
  return toast.get();
}