import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  InboxIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const navigation = [
  { name: 'Inbox', href: '/dashboard', icon: InboxIcon },
  { name: 'Starred', href: '/starred', icon: StarIcon },
  { name: 'Archive', href: '/archive', icon: ArchiveBoxIcon },
  { name: 'Trash', href: '/trash', icon: TrashIcon },
];

const categories = [
  { name: 'Product Inquiry', color: 'bg-blue-100 text-blue-800' },
  { name: 'Support Request', color: 'bg-green-100 text-green-800' },
  { name: 'Sales Lead', color: 'bg-purple-100 text-purple-800' },
  { name: 'Partnership', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Other', color: 'bg-gray-100 text-gray-800' },
];

const SidebarContent: React.FC = () => (
  <div className="h-full flex flex-col bg-white shadow-xl">
    {/* Logo */}
    <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-700">
      <img
        className="h-8 w-auto"
        src="/logo.svg"
        alt="Onebox"
      />
      <span className="ml-2 text-white text-lg font-semibold">Onebox</span>
    </div>

    {/* Navigation */}
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            classNames(
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            )
          }
        >
          <item.icon
            className={classNames(
              'mr-3 flex-shrink-0 h-6 w-6'
            )}
            aria-hidden="true"
          />
          {item.name}
        </NavLink>
      ))}
    </nav>

    {/* Categories */}
    <div className="flex-shrink-0 flex flex-col border-t border-gray-200 p-4">
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Categories
      </h3>
      <div className="mt-3 space-y-1">
        {categories.map((category) => (
          <button
            key={category.name}
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 w-full text-left"
          >
            <TagIcon className="mr-3 h-5 w-5" />
            <span className="truncate">{category.name}</span>
            <span
              className={classNames(
                'ml-auto inline-block py-0.5 px-2 text-xs rounded-full',
                category.color
              )}
            >
              0
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, className }) => {
  // Mobile sidebar
  const mobileSidebar = (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 flex z-40 lg:hidden"
        onClose={onClose || (() => {})}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={onClose}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
            </Transition.Child>
            <SidebarContent />
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );

  // Desktop sidebar
  const desktopSidebar = (
    <div className={classNames('hidden lg:flex lg:flex-shrink-0', className)}>
      <div className="flex flex-col w-64">
        <SidebarContent />
      </div>
    </div>
  );

  return (
    <>
      {mobileSidebar}
      {desktopSidebar}
    </>
  );
};

export default Sidebar;