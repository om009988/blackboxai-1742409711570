import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseClipboardOptions {
  successDuration?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseClipboardResult {
  copied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  readFromClipboard: () => Promise<string>;
  clearCopiedStatus: () => void;
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardResult {
  const {
    successDuration = 2000,
    onSuccess,
    onError,
  } = options;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern Clipboard API if available
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      onSuccess?.();
      toast.success('Copied to clipboard');

      if (successDuration) {
        setTimeout(() => {
          setCopied(false);
        }, successDuration);
      }

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to copy');
      onError?.(err);
      toast.error('Failed to copy to clipboard');
      return false;
    }
  }, [successDuration, onSuccess, onError]);

  const readFromClipboard = useCallback(async (): Promise<string> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern Clipboard API if available
        return await navigator.clipboard.readText();
      } else {
        throw new Error('Clipboard reading is not supported in this environment');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to read from clipboard');
      onError?.(err);
      toast.error('Failed to read from clipboard');
      throw err;
    }
  }, [onError]);

  const clearCopiedStatus = useCallback(() => {
    setCopied(false);
  }, []);

  return {
    copied,
    copyToClipboard,
    readFromClipboard,
    clearCopiedStatus,
  };
}

// Helper function to copy text with formatting
export async function copyRichText(html: string): Promise<boolean> {
  try {
    const blob = new Blob([html], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob })];
    await navigator.clipboard.write(data);
    return true;
  } catch (error) {
    console.error('Failed to copy rich text:', error);
    return false;
  }
}

// Helper function to copy image to clipboard
export async function copyImage(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const data = [new ClipboardItem({ [blob.type]: blob })];
    await navigator.clipboard.write(data);
    return true;
  } catch (error) {
    console.error('Failed to copy image:', error);
    return false;
  }
}

// Helper function to handle multiple clipboard formats
export async function copyMultipleFormats(data: Record<string, string>): Promise<boolean> {
  try {
    const items = await Promise.all(
      Object.entries(data).map(async ([mimeType, content]) => {
        const blob = new Blob([content], { type: mimeType });
        return [mimeType, blob];
      })
    );

    const clipboardItems = items.map(([mimeType, blob]) => ({
      [mimeType as string]: blob as Blob,
    }));

    await navigator.clipboard.write([new ClipboardItem(Object.assign({}, ...clipboardItems))]);
    return true;
  } catch (error) {
    console.error('Failed to copy multiple formats:', error);
    return false;
  }
}

// Helper function to sanitize text for clipboard
export function sanitizeClipboardText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
}

// Helper function to format text for clipboard
export function formatClipboardText(text: string, options: {
  prefix?: string;
  suffix?: string;
  maxLength?: number;
  ellipsis?: string;
} = {}): string {
  const {
    prefix = '',
    suffix = '',
    maxLength,
    ellipsis = '...',
  } = options;

  let formatted = `${prefix}${text}${suffix}`;

  if (maxLength && formatted.length > maxLength) {
    const actualMaxLength = maxLength - ellipsis.length;
    formatted = formatted.slice(0, actualMaxLength) + ellipsis;
  }

  return formatted;
}