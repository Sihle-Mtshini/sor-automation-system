'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Filter } from 'lucide-react';
import RequestsTable from '@/components/RequestsTable';
import { api } from '@/lib/api';

interface Request {
  id: number;
  learner_name: string;
  learner_email: string;
  status: string;
  created_at: string;
  updated_at: string;
  overall_score: number | null;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'pdf_generated', label: 'PDF Generated' },
  { value: 'signature_sent', label: 'Awaiting Signature' },
  { value: 'signed', label: 'Signed' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'failed', label: 'Failed' },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });

      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, loadData]);

  const handleAction = async (action: string, requestId: number) => {
    if (action === 'view') {
      window.location.href = `/dashboard/requests/${requestId}`;
      return;
    }

    try {
      setProcessing(true);
      let result;

      switch (action) {
        case 'generate-pdf':
          result = await api.generatePdf(requestId);
          break;
        case 'send-signature':
          result = await api.sendForSignature(requestId);
          break;
        case 'upload-moodle':
          result = await api.uploadToMoodle(requestId);
          break;
        default:
          return;
      }

      if (result.success) {
        alert(result.message || 'Action completed successfully');
        loadData();
      } else {
        alert(result.error || 'Action failed');
      }
    } catch (error: any) {
      alert(error.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">SOR Requests</h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
      </p>

      <RequestsTable
        requests={requests}
        onAction={handleAction}
        loading={loading}
      />
    </div>
  );
}
