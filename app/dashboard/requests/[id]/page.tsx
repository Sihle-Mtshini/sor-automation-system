'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Send,
  Upload,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';

interface RequestDetail {
  id: number;
  learner_name: string;
  learner_email: string;
  learner_id: number;
  status: string;
  overall_score: number | null;
  pdf_path: string | null;
  signature_request_id: string | null;
  created_at: string;
  updated_at: string;
  audit_log: Array<{
    action: string;
    details: string | null;
    status: string;
    created_at: string;
  }>;
}

const statusDisplayNames: Record<string, string> = {
  pending: 'Pending',
  pdf_generated: 'PDF Generated',
  signature_sent: 'Awaiting Signature',
  signed: 'Signed',
  uploaded: 'Uploaded',
  failed: 'Failed',
};

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-ZA');
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [gradeSynced, setGradeSynced] = useState(false);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const result = await api.getRequest(Number(params.id));
      if (result.success) {
        setRequest(result.data);
        if (result.data.overall_score) {
          setGrade(result.data.overall_score.toString());
          setFeedback(`SOR Assessment completed. Score: ${result.data.overall_score}%`);
        }
        const hasGradeSynced = result.data.audit_log?.some(
          (log: any) => log.action === 'grade_synced'
        );
        setGradeSynced(hasGradeSynced);
      }
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadRequest();
    }
  }, [params.id]);

  const handleAction = async (action: string) => {
    try {
      setProcessing(true);
      let result;

      switch (action) {
        case 'generate-pdf':
          result = await api.generatePdf(Number(params.id));
          break;
        case 'send-signature':
          result = await api.sendForSignature(Number(params.id));
          break;
        case 'upload-moodle':
          result = await api.uploadToMoodle(Number(params.id));
          break;
        case 'sync-grade':
          result = await api.syncGrade(Number(params.id), parseFloat(grade), feedback);
          break;
        default:
          return;
      }

      if (result.success) {
        if (action === 'sync-grade') {
          setGradeSynced(true);
        }
        loadRequest();
      } else {
        alert(result.error || 'Action failed');
      }
    } catch (error: any) {
      alert(error.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#F26522]" size={32} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Request not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-[#F26522] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Request #{request.id}
          </h1>
          <p className="text-gray-500">{request.learner_name}</p>
        </div>
        <span className={`ml-auto status-${request.status}`}>
          {statusDisplayNames[request.status] || request.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Learner ID</dt>
                <dd className="text-gray-900 font-medium">{request.learner_id}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-gray-900">{request.learner_email || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Overall Score</dt>
                <dd className="text-gray-900 font-medium">
                  {request.overall_score ? `${request.overall_score}%` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-gray-900">{statusDisplayNames[request.status]}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(request.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">{formatDate(request.updated_at)}</dd>
              </div>
              {request.pdf_path && (
                <div className="col-span-2">
                  <dt className="text-sm text-gray-500">PDF Path</dt>
                  <dd className="text-gray-900 text-sm truncate">{request.pdf_path}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h2>
            {request.audit_log.length === 0 ? (
              <p className="text-gray-500">No activity recorded yet</p>
            ) : (
              <div className="space-y-3">
                {request.audit_log.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.action}</p>
                      {log.details && (
                        <p className="text-xs text-gray-500">{log.details}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {request.status === 'pending' && (
                <button
                  onClick={() => handleAction('generate-pdf')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <FileText size={18} />
                  Generate PDF
                </button>
              )}

              {request.status === 'pdf_generated' && (
                <button
                  onClick={() => handleAction('send-signature')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                  Send for Signature
                </button>
              )}

              {(request.status === 'signed' || request.status === 'pdf_generated') && (
                <button
                  onClick={() => handleAction('upload-moodle')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <Upload size={18} />
                  Upload to Moodle
                </button>
              )}

              {request.status === 'uploaded' && (
                <div className="flex items-center gap-2 text-green-600 justify-center py-3">
                  <CheckCircle size={18} />
                  <span className="font-medium">Completed</span>
                </div>
              )}

              {request.status === 'signature_sent' && (
                <div className="flex items-center gap-2 text-yellow-600 justify-center py-3">
                  <Clock size={18} />
                  <span className="font-medium">Awaiting Signature</span>
                </div>
              )}
            </div>
          </div>

          {request.status === 'uploaded' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">View in Moodle</h2>
              <a
                href={`${process.env.NEXT_PUBLIC_MOODLE_URL || 'https://lms.mindworx.co.za/academy'}/mod/assign/view.php?action=grader&id=213&userid=${request.learner_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <ExternalLink size={18} />
                View in Moodle
              </a>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Opens the learner's submission in Moodle
              </p>
            </div>
          )}

          {request.status === 'uploaded' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Grade to Moodle</h2>
              {gradeSynced ? (
                <div className="space-y-4">
                  <div className="text-center py-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <p className="text-green-600 font-semibold">Grade Synced!</p>
                    <p className="text-gray-500 text-sm">
                      {grade}% synced to Moodle
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-3">Need to update the grade?</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">New Grade (%)</label>
                        <input
                          type="number"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Feedback</label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={() => handleAction('sync-grade')}
                        disabled={processing || !grade}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        Update Grade
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Grade (%)</label>
                    <input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Feedback</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={() => handleAction('sync-grade')}
                    disabled={processing || !grade}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    Sync Grade to Moodle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
