import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ERROR_MESSAGES } from '../utils/constants';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface UseErrorBoundaryOptions {
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

interface ErrorLogData {
  error: Error;
  errorInfo?: ErrorInfo;
  timestamp: number;
  userAgent: string;
  url: string;
  componentStack?: string;
}

export function useErrorBoundary(options: UseErrorBoundaryOptions = {}) {
  const { onError, onReset } = options;
  const [state, setState] = useState<ErrorBoundaryState>({
    error: null,
    errorInfo: null,
  });

  const resetError = useCallback(() => {
    setState({ error: null, errorInfo: null });
    onReset?.();
  }, [onReset]);

  const handleError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      setState({ error, errorInfo });
      onError?.(error, errorInfo);

      // Log error
      logError({
        error,
        errorInfo,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        componentStack: errorInfo.componentStack,
      });

      // Show error toast
      toast.error(getErrorMessage(error));
    },
    [onError]
  );

  return {
    error: state.error,
    errorInfo: state.errorInfo,
    resetError,
    handleError,
  };
}

// Helper function to get user-friendly error message
function getErrorMessage(error: Error): string {
  if (error.name === 'NetworkError') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.name === 'ValidationError') {
    return error.message || ERROR_MESSAGES.VALIDATION_ERROR;
  }

  if (error.name === 'AuthenticationError') {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Helper function to log errors
async function logError(errorData: ErrorLogData): Promise<void> {
  try {
    // Format error data
    const formattedError = {
      ...errorData,
      error: {
        name: errorData.error.name,
        message: errorData.error.message,
        stack: errorData.error.stack,
      },
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', formattedError);
    }

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedError),
      });
    }
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

// Error boundary component using the hook
export class ErrorBoundary extends React.Component<
  UseErrorBoundaryOptions & { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: UseErrorBoundaryOptions & { children: React.ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    logError({
      error,
      errorInfo,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack: errorInfo.componentStack,
    });
  }

  render(): React.ReactNode {
    const { error, errorInfo } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <details>
            <summary>{error.toString()}</summary>
            <pre>{errorInfo?.componentStack}</pre>
          </details>
          <button
            onClick={() => {
              this.setState({ error: null, errorInfo: null });
              this.props.onReset?.();
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}

// Custom error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message);
    this.name = 'AuthenticationError';
  }
}