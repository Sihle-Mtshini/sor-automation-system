'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  type: 'success' | 'warning' | 'info';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  clearAll: () => void;
}

const initialNotifications: Notification[] = [
  { id: 1, title: 'SOR Generated', message: 'SOR for John Doe has been generated successfully', time: '5 min ago', date: 'Today', read: false, type: 'success' },
  { id: 2, title: 'Signature Pending', message: 'Waiting for signature from Jane Smith', time: '1 hour ago', date: 'Today', read: false, type: 'warning' },
  { id: 3, title: 'Upload Complete', message: 'SOR uploaded to Moodle for Mike Johnson', time: '2 hours ago', date: 'Today', read: false, type: 'success' },
  { id: 4, title: 'New Request', message: 'New SOR request submitted for Sarah Williams', time: '3 hours ago', date: 'Today', read: true, type: 'info' },
  { id: 5, title: 'Signature Completed', message: 'Document signed by David Brown', time: '5 hours ago', date: 'Today', read: true, type: 'success' },
  { id: 6, title: 'Processing Error', message: 'Failed to generate SOR for Emily Clark - Missing data', time: '6 hours ago', date: 'Today', read: true, type: 'warning' },
  { id: 7, title: 'SOR Generated', message: 'SOR for Robert Taylor has been generated successfully', time: '9:30 AM', date: 'Yesterday', read: true, type: 'success' },
  { id: 8, title: 'New Request', message: 'New SOR request submitted for Lisa Anderson', time: '8:15 AM', date: 'Yesterday', read: true, type: 'info' },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newId = Math.max(...notifications.map(n => n.id), 0) + 1;
    setNotifications([{ ...notification, id: newId }, ...notifications]);
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
