'use client';

import {
  FileText,
  Clock,
  PenTool,
  CheckCircle,
  Upload,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    signature_sent: number;
    signed: number;
    uploaded: number;
    failed: number;
    overdue: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Requests',
      value: stats.total,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Awaiting Signature',
      value: stats.signature_sent,
      icon: PenTool,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Signed',
      value: stats.signed,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Uploaded',
      value: stats.uploaded,
      icon: Upload,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Failed',
      value: stats.failed,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={card.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.title}</p>
          </div>
        );
      })}
    </div>
  );
}
