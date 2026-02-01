'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, LogOut, User, Settings, Circle, CheckCircle } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

type UserStatus = 'available' | 'busy' | 'away' | 'offline';

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'text-green-500' },
  { value: 'busy', label: 'Busy', color: 'text-red-500' },
  { value: 'away', label: 'Away', color: 'text-yellow-500' },
  { value: 'offline', label: 'Offline', color: 'text-gray-400' },
];

export default function Header({ title }: HeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentStatus = statusOptions.find(s => s.value === userStatus)!;

  const handleSignOut = () => {
    // Clear any stored session/token
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsProfileOpen(false);
    // Redirect to login page
    router.push('/login');
  };

  const handleNavigate = (path: string) => {
    setIsProfileOpen(false);
    router.push(path);
  };

  const handleStatusChange = (status: UserStatus) => {
    setUserStatus(status);
    setIsStatusOpen(false);
    // Here you could also save the status to an API
  };

  return (
    <header className="bg-[#F26522] px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">
            Occupational Certificate: Software Engineer 119458
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-white hover:bg-orange-600 rounded-full">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-white text-[#F26522] rounded-full flex items-center justify-center font-semibold">
                  AU
                </div>
                {/* Status indicator */}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#F26522] ${
                  userStatus === 'available' ? 'bg-green-500' :
                  userStatus === 'busy' ? 'bg-red-500' :
                  userStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-white">Admin</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {/* Header with Logo */}
                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                  <img
                    src="/mindworx_academy.png"
                    alt="MindWorx Academy"
                    className="h-8"
                  />
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                  <div className="relative">
                    <div className="w-12 h-12 bg-[#F26522] text-white rounded-full flex items-center justify-center font-semibold text-lg">
                      AU
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      userStatus === 'available' ? 'bg-green-500' :
                      userStatus === 'busy' ? 'bg-red-500' :
                      userStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Admin User</p>
                    <p className="text-sm text-gray-500">admin@mindworx.co.za</p>
                    <button
                      onClick={() => handleNavigate('/dashboard/profile')}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View account
                      <span className="text-xs">↗</span>
                    </button>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {/* Status Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setIsStatusOpen(!isStatusOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Circle size={18} className={currentStatus.color} fill="currentColor" />
                        <span className="text-sm text-gray-700">{currentStatus.label}</span>
                      </div>
                      <ChevronRight size={16} className={`text-gray-400 transition-transform ${isStatusOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Status Dropdown */}
                    {isStatusOpen && (
                      <div className="bg-gray-50 border-t border-b border-gray-100">
                        {statusOptions.map((status) => (
                          <button
                            key={status.value}
                            onClick={() => handleStatusChange(status.value)}
                            className="w-full flex items-center justify-between px-8 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Circle size={14} className={status.color} fill="currentColor" />
                              <span className="text-sm text-gray-700">{status.label}</span>
                            </div>
                            {userStatus === status.value && (
                              <CheckCircle size={16} className="text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleNavigate('/dashboard/profile')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  <button
                    onClick={() => handleNavigate('/dashboard/settings')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
