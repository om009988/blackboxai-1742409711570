/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
    readonly REACT_APP_API_URL: string;
  }
}

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
    SVGSVGElement
  > & { title?: string }>;

  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '@heroicons/react/24/outline' {
  export const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const InboxIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ArchiveBoxIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ReplyIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

declare module '@headlessui/react' {
  export const Dialog: React.FC<{
    as?: React.ElementType;
    className?: string;
    onClose: () => void;
    children?: React.ReactNode;
    static?: boolean;
    open?: boolean;
  }>;

  export const Transition: {
    Root: React.FC<{
      as?: React.ElementType;
      show?: boolean;
      appear?: boolean;
      unmount?: boolean;
      children: React.ReactNode;
    }>;
    Child: React.FC<{
      as?: React.ElementType;
      enter?: string;
      enterFrom?: string;
      enterTo?: string;
      leave?: string;
      leaveFrom?: string;
      leaveTo?: string;
      children: React.ReactNode;
    }>;
  } & React.FC<{
    as?: React.ElementType;
    show?: boolean;
    appear?: boolean;
    unmount?: boolean;
    children: React.ReactNode;
  }>;
}

declare module 'classnames' {
  const classNames: (...args: any[]) => string;
  export default classNames;
}