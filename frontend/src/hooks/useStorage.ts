import { useState, useEffect, useCallback } from 'react';

type StorageType = 'localStorage' | 'sessionStorage';

interface StorageOptions<T> {
  storage?: StorageType;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: Error) => void;
}

interface UseStorageResult<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  remove: () => void;
  clear: () => void;
}

const defaultSerializer = JSON.stringify;
const defaultDeserializer = JSON.parse;

export function useStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions<T> = {}
): UseStorageResult<T> {
  const {
    storage = 'localStorage',
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    onError,
  } = options;

  // Get storage object
  const storageObject = window[storage];

  // Initialize state from storage or initial value
  const [value, setValue] = useState<T>(() => {
    try {
      const item = storageObject.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get storage item');
      onError?.(err);
      return initialValue;
    }
  });

  // Update storage when value changes
  useEffect(() => {
    try {
      if (value === undefined) {
        storageObject.removeItem(key);
      } else {
        storageObject.setItem(key, serializer(value));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to set storage item');
      onError?.(err);
    }
  }, [key, value, serializer, storageObject, onError]);

  // Listen for storage changes in other windows/tabs
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === key && e.storageArea === storageObject) {
        try {
          const newValue = e.newValue ? deserializer(e.newValue) : undefined;
          setValue(newValue ?? initialValue);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Failed to handle storage change');
          onError?.(err);
        }
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storageObject, deserializer, initialValue, onError]);

  // Update state with new value
  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(current => {
      const resolvedValue = newValue instanceof Function ? newValue(current) : newValue;
      return resolvedValue;
    });
  }, []);

  // Remove item from storage
  const remove = useCallback(() => {
    try {
      storageObject.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to remove storage item');
      onError?.(err);
    }
  }, [key, storageObject, initialValue, onError]);

  // Clear all storage
  const clear = useCallback(() => {
    try {
      storageObject.clear();
      setValue(initialValue);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to clear storage');
      onError?.(err);
    }
  }, [storageObject, initialValue, onError]);

  return {
    value,
    setValue: updateValue,
    remove,
    clear,
  };
}

// Helper function to check storage availability
export function isStorageAvailable(type: StorageType): boolean {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper function to get storage size
export function getStorageSize(type: StorageType): number {
  try {
    const storage = window[type];
    let size = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key) || '';
        size += key.length + value.length;
      }
    }
    return size;
  } catch (e) {
    return 0;
  }
}

// Helper function to get remaining storage space
export function getRemainingStorageSpace(type: StorageType): number {
  try {
    const storage = window[type];
    let testData = 'a'.repeat(1024 * 1024); // 1MB of data
    let iterations = 0;

    while (iterations < 10) { // Limit to prevent infinite loop
      try {
        storage.setItem('__space_test__', testData);
        testData += testData;
        iterations++;
      } catch (e) {
        storage.removeItem('__space_test__');
        return iterations * 1024 * 1024;
      }
    }

    storage.removeItem('__space_test__');
    return iterations * 1024 * 1024;
  } catch (e) {
    return 0;
  }
}

// Helper function to migrate storage data
export async function migrateStorage(
  fromType: StorageType,
  toType: StorageType,
  keys?: string[]
): Promise<boolean> {
  try {
    const fromStorage = window[fromType];
    const toStorage = window[toType];

    if (keys) {
      keys.forEach(key => {
        const value = fromStorage.getItem(key);
        if (value) {
          toStorage.setItem(key, value);
        }
      });
    } else {
      for (let i = 0; i < fromStorage.length; i++) {
        const key = fromStorage.key(i);
        if (key) {
          const value = fromStorage.getItem(key);
          if (value) {
            toStorage.setItem(key, value);
          }
        }
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}