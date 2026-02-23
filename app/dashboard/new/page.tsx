'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Search, CheckCircle, RefreshCw, FileText, Send, Upload, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface QuizResult {
  quiz_id: number;
  topic_name: string;
  score: number;
  total_marks: number;
  percentage: number;
}

interface GradesData {
  learner_name: string;
  quizzes: QuizResult[];
  overall_score: number | null;
  quiz_count: number;
  message?: string;
}

interface WorkflowStatus {
  request_created: boolean;
  pdf_generated: boolean;
  signature_sent: boolean;
  uploaded: boolean;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    learner_name: '',
    learner_email: '',
    learner_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingGrades, setFetchingGrades] = useState(false);
  const [error, setError] = useState('');
  const [gradesData, setGradesData] = useState<GradesData | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const handleFetchGrades = async () => {
    if (!formData.learner_id || !formData.learner_name) {
      setError('Please enter both Learner Name and Moodle User ID');
      return;
    }

    setError('');
    setFetchingGrades(true);
    setGradesData(null);

    try {
      const result = await api.getLearnerGrades(
        parseInt(formData.learner_id),
        formData.learner_name
      );

      if (result.success) {
        setGradesData(result.data);
        if (!result.data.quizzes || result.data.quizzes.length === 0) {
          setError('No quiz results found for this learner. They need to complete quizzes first.');
        } else {
          setError('');
        }
      } else {
        setError(result.error || 'Failed to fetch grades');
      }
    } catch (err: any) {
      console.error('Fetch grades error:', err);
      setError(err.message || 'Failed to fetch grades');
    } finally {
      setFetchingGrades(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setWorkflowStatus(null);
    setWorkflowError(null);

    try {
      const result = await api.createRequest({
        learner_name: formData.learner_name,
        learner_email: formData.learner_email,
        learner_id: parseInt(formData.learner_id),
      });

      if (result.success) {
        setSuccess(true);
        setCreatedId(result.data.id);
        setWorkflowStatus(result.data.workflow_status);
        setWorkflowError(result.data.error);
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  if (success && workflowStatus) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">SOR Request #{createdId} Created!</h2>
                <p className="text-gray-600">{formData.learner_name}</p>
              </div>
            </div>
            {gradesData && (
              <div className="bg-[#F26522] px-4 py-2 rounded-lg text-white">
                <span className="text-sm">Overall Score: </span>
                <span className="text-xl font-bold">{gradesData.overall_score}%</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Workflow Progress</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className={`flex flex-col items-center p-4 rounded-lg border-2 ${workflowStatus.request_created ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                {workflowStatus.request_created ? (
                  <CheckCircle size={28} className="text-green-600 mb-2" />
                ) : (
                  <XCircle size={28} className="text-gray-300 mb-2" />
                )}
                <span className={`text-sm font-medium ${workflowStatus.request_created ? 'text-green-700' : 'text-gray-400'}`}>
                  Request Created
                </span>
              </div>

              <div className={`flex flex-col items-center p-4 rounded-lg border-2 ${workflowStatus.pdf_generated ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                {workflowStatus.pdf_generated ? (
                  <CheckCircle size={28} className="text-green-600 mb-2" />
                ) : (
                  <XCircle size={28} className="text-gray-300 mb-2" />
                )}
                <span className={`text-sm font-medium ${workflowStatus.pdf_generated ? 'text-green-700' : 'text-gray-400'}`}>
                  PDF Generated
                </span>
              </div>

              <div className={`flex flex-col items-center p-4 rounded-lg border-2 ${workflowStatus.signature_sent ? 'border-green-500 bg-green-50' : workflowStatus.uploaded && !workflowStatus.signature_sent ? 'border-gray-300 bg-gray-100' : 'border-gray-200 bg-gray-50'}`}>
                {workflowStatus.signature_sent ? (
                  <CheckCircle size={28} className="text-green-600 mb-2" />
                ) : workflowStatus.uploaded ? (
                  <span className="text-gray-400 text-xs mb-2">Skipped</span>
                ) : (
                  <XCircle size={28} className="text-gray-300 mb-2" />
                )}
                <span className={`text-sm font-medium ${workflowStatus.signature_sent ? 'text-green-700' : 'text-gray-400'}`}>
                  Sent for Signature
                </span>
              </div>

              <div className={`flex flex-col items-center p-4 rounded-lg border-2 ${workflowStatus.uploaded ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                {workflowStatus.uploaded ? (
                  <CheckCircle size={28} className="text-green-600 mb-2" />
                ) : (
                  <XCircle size={28} className="text-gray-300 mb-2" />
                )}
                <span className={`text-sm font-medium ${workflowStatus.uploaded ? 'text-green-700' : 'text-gray-400'}`}>
                  Uploaded to Moodle
                </span>
              </div>
            </div>
          </div>

          {workflowError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {workflowError}
            </div>
          )}

          {workflowStatus.signature_sent && !workflowStatus.uploaded && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              Awaiting signature from learner. The document will be uploaded automatically once signed.
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push(`/dashboard/requests/${createdId}`)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Request Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New SOR Request</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-blue-800 font-medium">Automated Workflow</p>
            <p className="text-blue-700 text-sm">
              When you click "Create & Process", the system will automatically:<br />
              1. Create the SOR request with quiz scores<br />
              2. Generate the Statement of Results PDF<br />
              3. Send for e-signature (if email provided)<br />
              4. Upload to Moodle (after signature or immediately if no email)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learner Name * <span className="text-gray-400 font-normal text-xs">(must match Moodle)</span>
            </label>
            <input
              type="text"
              required
              value={formData.learner_name}
              onChange={(e) => {
                setFormData({ ...formData, learner_name: e.target.value });
                setGradesData(null);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent"
              placeholder="e.g., SOR POD Internal POD"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learner Email <span className="text-gray-400 font-normal text-xs">(for e-signature)</span>
            </label>
            <input
              type="email"
              value={formData.learner_email}
              onChange={(e) => setFormData({ ...formData, learner_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent"
              placeholder="learner@example.com"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moodle User ID *
            </label>
            <input
              type="number"
              required
              value={formData.learner_id}
              onChange={(e) => {
                setFormData({ ...formData, learner_id: e.target.value });
                setGradesData(null);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522] focus:border-transparent"
              placeholder="e.g., 6"
            />
          </div>

          <div className="col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleFetchGrades}
              disabled={fetchingGrades || !formData.learner_name || !formData.learner_id}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {fetchingGrades ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Fetch Grades from Moodle
            </button>
          </div>
        </div>

        {gradesData && gradesData.quizzes.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Quiz Results Preview</h3>
                <p className="text-sm text-gray-500">{gradesData.quiz_count} quizzes completed</p>
              </div>
              <div className="bg-[#F26522] px-4 py-2 rounded-lg text-white">
                <span className="text-sm font-medium">Overall Score: </span>
                <span className="text-xl font-bold">{gradesData.overall_score}%</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {gradesData.quizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <span className="text-sm text-gray-700 truncate mr-2" title={quiz.topic_name}>
                    {quiz.topic_name}
                  </span>
                  <span className={`text-sm font-semibold whitespace-nowrap ${quiz.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {quiz.score}/{quiz.total_marks} ({quiz.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!gradesData && (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg mb-6">
            Enter learner details and click "Fetch Grades" to verify quiz completion
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !gradesData || gradesData.quizzes.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create & Process SOR
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
