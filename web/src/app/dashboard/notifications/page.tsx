'use client';

import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, FileText, X, CheckCheck, Trash2, Filter } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = notification.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />;
      default:
        return <FileText size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm text-[#F26522] hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCheck size={18} />
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm text-gray-500 mr-2">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all' ? 'bg-[#F26522] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'unread' ? 'bg-[#F26522] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'read' ? 'bg-[#F26522] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500 mt-1">
              {filter === 'unread' ? "You've read all your notifications" : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500">{date}</h3>
              </div>

              {/* Notifications for this date */}
              {items.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-[#F26522] hover:underline whitespace-nowrap"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
