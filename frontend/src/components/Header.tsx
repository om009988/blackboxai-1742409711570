import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon, 
  BellIcon 
} from '@heroicons/react/24/outline';
import { emailService } from '../services/api';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  const handleSync = async () => {
    try {
      const loadingToast = toast.loading('Syncing emails...');
      await emailService.syncEmails();
      toast.success('Emails synchronized successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to sync emails. Please try again.', {
        duration: 5000,
      });
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section */}
          <div className="flex">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Search */}
            <div className="flex-1 flex items-center px-4 lg:px-8">
              <div className="w-full">
                <label htmlFor="search" className="sr-only">
                  Search emails
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <MagnifyingGlassIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search emails..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Sync button */}
            <button
              type="button"
              onClick={handleSync}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sync Emails
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;