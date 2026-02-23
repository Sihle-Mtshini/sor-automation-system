'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Play, FileDown, Search } from 'lucide-react';
import StatsCards from '@/components/StatsCards';
import RequestsTable from '@/components/RequestsTable';
import { api } from '@/lib/api';

interface Stats {
  total: number;
  pending: number;
  signature_sent: number;
  signed: number;
  uploaded: number;
  failed: number;
  overdue: number;
}

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
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'signature_sent', label: 'Awaiting Signature' },
  { value: 'signed', label: 'Signed' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'failed', label: 'Failed' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    signature_sent: 0,
    signed: 0,
    uploaded: 0,
    failed: 0,
    overdue: 0,
  });
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = searchTerm === '' ||
        req.learner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.learner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toString().includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      try {
        await api.checkSignatures();
      } catch (sigError) {
        console.error('Error checking signatures:', sigError);
      }

      const [statsRes, requestsRes] = await Promise.all([
        api.getStats(),
        api.getRequests(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (requestsRes.success) {
        setRequests(requestsRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: string, requestId: number) => {
    if (action === 'view') {
      router.push(`/dashboard/requests/${requestId}`);
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

  const handleProcessAllPending = async () => {
    const pendingCount = stats.pending;
    if (pendingCount === 0) {
      alert('No pending requests to process.');
      return;
    }

    if (!confirm(`Process all ${pendingCount} pending requests? This will generate PDFs and send them for signature.`)) return;

    try {
      setProcessing(true);
      const result = await api.processAllPending();
      if (result.success) {
        alert(result.message || `Successfully processed ${result.processed || pendingCount} requests.`);
        loadData();
      } else {
        alert(result.error || 'Processing failed');
      }
    } catch (error: any) {
      alert(error.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportReport = () => {
    if (requests.length === 0) {
      alert('No data to export.');
      return;
    }

    setExporting(true);

    try {
      const headers = ['ID', 'Learner Name', 'Email', 'Status', 'Overall Score', 'Created Date', 'Last Updated'];
      const csvRows = [headers.join(',')];

      requests.forEach((req) => {
        const row = [
          req.id,
          `"${req.learner_name.replace(/"/g, '""')}"`,
          `"${req.learner_email.replace(/"/g, '""')}"`,
          req.status,
          req.overall_score ?? 'N/A',
          req.created_at,
          req.updated_at,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `SOR_Report_${today}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Stats Cards */}
      <div className="flex-shrink-0">
        <StatsCards stats={stats} />
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center gap-3 mt-6 mb-4">
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

        <button
          onClick={handleProcessAllPending}
          disabled={processing || stats.pending === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <Play size={18} />
          Process All Pending {stats.pending > 0 && `(${stats.pending})`}
        </button>

        <button
          onClick={handleExportReport}
          disabled={exporting || requests.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <FileDown size={18} />
          Export Report
        </button>
      </div>

      {/* Requests Table Section */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border-2 border-gray-300 shadow-sm overflow-hidden">
        {/* Header with Search and Filter */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gray-50 border-b-2 border-gray-300">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">SOR Requests</h2>
            {(searchTerm || statusFilter !== 'all') && (
              <span className="px-3 py-1 bg-[#F26522] text-white text-sm rounded-full">
                {filteredRequests.length} of {requests.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-[#F26522] transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-[#F26522] transition-colors font-medium"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Container with Scroll */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <RequestsTable
            requests={filteredRequests}
            onAction={handleAction}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
