'use client';

import { Eye, FileText, Send, Upload } from 'lucide-react';

interface Request {
  id: number;
  learner_name: string;
  learner_email: string;
  status: string;
  created_at: string;
  updated_at: string;
  overall_score: number | null;
}

interface RequestsTableProps {
  requests: Request[];
  onAction: (action: string, requestId: number) => void;
  loading?: boolean;
}

const statusLabels: Record<string, string> = {
  pending: 'pending',
  pdf_generated: 'pdf_generated',
  signature_sent: 'awaiting_signature',
  awaiting_signature: 'awaiting_signature',
  signed: 'signed',
  uploaded: 'uploaded',
  failed: 'failed',
};

const statusDisplayNames: Record<string, string> = {
  pending: 'Pending',
  pdf_generated: 'PDF Generated',
  signature_sent: 'Awaiting Signature',
  awaiting_signature: 'Awaiting Signature',
  signed: 'Signed',
  uploaded: 'Uploaded',
  failed: 'Failed',
};

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionButton(status: string, onAction: (action: string) => void) {
  switch (status) {
    case 'pending':
      return (
        <button
          onClick={() => onAction('generate-pdf')}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#F26522] text-white text-xs font-medium rounded hover:bg-orange-600 transition-colors"
        >
          <FileText size={14} />
          Generate PDF
        </button>
      );
    case 'pdf_generated':
      return (
        <button
          onClick={() => onAction('send-signature')}
          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded hover:bg-yellow-600 transition-colors"
        >
          <Send size={14} />
          Send for Signature
        </button>
      );
    case 'signed':
      return (
        <button
          onClick={() => onAction('upload-moodle')}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
        >
          <Upload size={14} />
          Upload to Moodle
        </button>
      );
    case 'signature_sent':
    case 'awaiting_signature':
      return (
        <span className="text-xs text-yellow-600 font-medium">Awaiting signature...</span>
      );
    case 'uploaded':
      return (
        <span className="text-xs text-green-600 font-semibold">Completed</span>
      );
    default:
      return null;
  }
}

export default function RequestsTable({ requests, onAction, loading }: RequestsTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead className="bg-gray-100 sticky top-0 z-10 border-b-2 border-gray-300">
        <tr>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-r border-gray-300">
            ID
          </th>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-r border-gray-300">
            Learner Name
          </th>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-r border-gray-300">
            Email
          </th>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-r border-gray-300">
            Status
          </th>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-r border-gray-300">
            Created
          </th>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider border-r border-gray-300">
            Last Updated
          </th>
          <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-gray-500 bg-gray-50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#F26522] border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            </td>
          </tr>
        ) : requests.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-gray-500 bg-gray-50">
              No requests found
            </td>
          </tr>
        ) : (
          requests.map((request, index) => (
            <tr
              key={request.id}
              className={`hover:bg-orange-50 transition-colors border-b border-gray-200 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-r border-gray-200">
                {request.id}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                {request.learner_name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                {request.learner_email || '-'}
              </td>
              <td className="px-4 py-3 border-r border-gray-200">
                <span className={`status-${statusLabels[request.status] || request.status}`}>
                  {statusDisplayNames[request.status] || request.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                {formatDate(request.created_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                {formatDate(request.updated_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getActionButton(request.status, (action) => onAction(action, request.id))}
                  <button
                    onClick={() => onAction('view', request.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
