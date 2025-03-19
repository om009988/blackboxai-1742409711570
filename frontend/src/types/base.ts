// React types
import type {
  ReactElement,
  ReactNode,
  ComponentType,
  FC,
  PropsWithChildren,
  Dispatch,
  SetStateAction,
  RefObject,
  MutableRefObject,
  CSSProperties,
  ChangeEvent,
  FormEvent,
  MouseEvent,
  KeyboardEvent,
} from 'react';

// Common type aliases
export type VoidFunction = () => void;
export type AnyFunction = (...args: any[]) => any;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type SetState<T> = Dispatch<SetStateAction<T>>;
export type UseStateResult<T> = [T, SetState<T>];

// React component types
export type ReactComponent<P = {}> = ComponentType<P>;
export type ReactFC<P = {}> = FC<P>;
export type WithChildren<P = {}> = PropsWithChildren<P>;
export type ElementRef<T> = RefObject<T>;
export type MutableRef<T> = MutableRefObject<T>;

// Event types
export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
export type FormSubmitEvent = FormEvent<HTMLFormElement>;
export type ButtonClickEvent = MouseEvent<HTMLButtonElement>;
export type DivClickEvent = MouseEvent<HTMLDivElement>;
export type KeyPress = KeyboardEvent<HTMLElement>;

// Style types
export type StyleProps = CSSProperties;
export type CSSVariables = { [key: `--${string}`]: string | number };

// Common prop types
export interface BaseProps {
  className?: string;
  style?: StyleProps;
  id?: string;
  'data-testid'?: string;
}

export interface WithChildrenProps extends BaseProps {
  children?: ReactNode;
}

// Common state types
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

// Common response types
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Common utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Common validation types
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface FieldConfig<T> {
  initialValue: T;
  rules?: ValidationRule<T>[];
}

// Common form types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormConfig<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

// Common query types
export interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  retry?: boolean | number;
  retryDelay?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number | false;
}

// Common animation types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  onComplete?: VoidFunction;
}

// Common theme types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: Record<string, string>;
  spacing: Record<string, string | number>;
  breakpoints: Record<string, number>;
  typography: Record<string, string | number>;
}

// Common media types
export interface MediaQueryConfig {
  minWidth?: number;
  maxWidth?: number;
  orientation?: 'portrait' | 'landscape';
  prefersColorScheme?: 'light' | 'dark';
  prefersReducedMotion?: boolean;
}

// Common storage types
export interface StorageConfig {
  prefix?: string;
  storage?: 'localStorage' | 'sessionStorage';
  serialize?: <T>(value: T) => string;
  deserialize?: <T>(value: string) => T;
}