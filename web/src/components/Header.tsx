'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, LogOut, User, Settings, Circle, CheckCircle, X, FileText, AlertCircle, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

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
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsStatusOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentStatus = statusOptions.find(s => s.value === userStatus)!;

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsProfileOpen(false);
    router.push('/login');
  };

  const handleNavigate = (path: string) => {
    setIsProfileOpen(false);
    router.push(path);
  };

  const handleStatusChange = (status: UserStatus) => {
    setUserStatus(status);
    setIsStatusOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-500" />;
      default:
        return <FileText size={18} className="text-blue-500" />;
    }
  };

  // Get only the first 5 notifications for the dropdown
  const recentNotifications = notifications.slice(0, 5);

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
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-white hover:bg-orange-600 rounded-full transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-white text-[#F26522] text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-[#F26522] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                          !notification.read ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{notification.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400">{notification.time}</span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-[#F26522] hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        router.push('/dashboard/notifications');
                      }}
                      className="w-full text-center text-sm text-[#F26522] hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

            {/* Profile Dropdown Menu */}
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
