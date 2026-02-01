'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { NotificationProvider } from '@/context/NotificationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-100">
        <Sidebar />
        <div className="ml-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
