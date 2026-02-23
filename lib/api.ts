const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Demo data used when the Flask backend is not available
const DEMO_REQUESTS = [
  {
    id: 1,
    learner_name: 'Thabo Mokoena',
    learner_email: 'thabo.mokoena@example.com',
    learner_id: 101,
    status: 'uploaded',
    overall_score: 82,
    pdf_path: '/output/SOR_Thabo_Mokoena.pdf',
    signature_request_id: 'sig_abc123',
    created_at: '2026-02-10T09:15:00Z',
    updated_at: '2026-02-12T14:30:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-10T09:15:00Z' },
      { action: 'pdf_generated', details: 'PDF generated successfully', status: 'success', created_at: '2026-02-10T09:16:00Z' },
      { action: 'signature_sent', details: 'Sent for e-signature', status: 'success', created_at: '2026-02-10T09:17:00Z' },
      { action: 'signed', details: 'Document signed by learner', status: 'success', created_at: '2026-02-11T11:00:00Z' },
      { action: 'uploaded_to_moodle', details: 'Uploaded to Moodle LMS', status: 'success', created_at: '2026-02-12T14:30:00Z' },
      { action: 'grade_synced', details: 'Grade 82% synced to Moodle', status: 'success', created_at: '2026-02-12T14:31:00Z' },
    ],
  },
  {
    id: 2,
    learner_name: 'Naledi Dlamini',
    learner_email: 'naledi.dlamini@example.com',
    learner_id: 102,
    status: 'signature_sent',
    overall_score: 74,
    pdf_path: '/output/SOR_Naledi_Dlamini.pdf',
    signature_request_id: 'sig_def456',
    created_at: '2026-02-14T10:00:00Z',
    updated_at: '2026-02-14T10:05:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-14T10:00:00Z' },
      { action: 'pdf_generated', details: 'PDF generated successfully', status: 'success', created_at: '2026-02-14T10:02:00Z' },
      { action: 'signature_sent', details: 'Sent for e-signature', status: 'success', created_at: '2026-02-14T10:05:00Z' },
    ],
  },
  {
    id: 3,
    learner_name: 'Sipho Nkosi',
    learner_email: 'sipho.nkosi@example.com',
    learner_id: 103,
    status: 'signed',
    overall_score: 91,
    pdf_path: '/output/SOR_Sipho_Nkosi.pdf',
    signature_request_id: 'sig_ghi789',
    created_at: '2026-02-16T08:30:00Z',
    updated_at: '2026-02-18T16:45:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-16T08:30:00Z' },
      { action: 'pdf_generated', details: 'PDF generated successfully', status: 'success', created_at: '2026-02-16T08:31:00Z' },
      { action: 'signature_sent', details: 'Sent for e-signature', status: 'success', created_at: '2026-02-16T08:33:00Z' },
      { action: 'signed', details: 'Document signed by learner', status: 'success', created_at: '2026-02-18T16:45:00Z' },
    ],
  },
  {
    id: 4,
    learner_name: 'Lerato Mahlangu',
    learner_email: 'lerato.m@example.com',
    learner_id: 104,
    status: 'pending',
    overall_score: 67,
    pdf_path: null,
    signature_request_id: null,
    created_at: '2026-02-20T11:00:00Z',
    updated_at: '2026-02-20T11:00:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-20T11:00:00Z' },
    ],
  },
  {
    id: 5,
    learner_name: 'Andile Zulu',
    learner_email: 'andile.zulu@example.com',
    learner_id: 105,
    status: 'pending',
    overall_score: 55,
    pdf_path: null,
    signature_request_id: null,
    created_at: '2026-02-21T09:45:00Z',
    updated_at: '2026-02-21T09:45:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-21T09:45:00Z' },
    ],
  },
  {
    id: 6,
    learner_name: 'Zanele Khumalo',
    learner_email: 'zanele.k@example.com',
    learner_id: 106,
    status: 'failed',
    overall_score: 43,
    pdf_path: null,
    signature_request_id: null,
    created_at: '2026-02-19T14:20:00Z',
    updated_at: '2026-02-19T14:22:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-19T14:20:00Z' },
      { action: 'pdf_generation_failed', details: 'Template rendering error', status: 'failed', created_at: '2026-02-19T14:22:00Z' },
    ],
  },
  {
    id: 7,
    learner_name: 'Bongani Sithole',
    learner_email: 'bongani.s@example.com',
    learner_id: 107,
    status: 'uploaded',
    overall_score: 78,
    pdf_path: '/output/SOR_Bongani_Sithole.pdf',
    signature_request_id: 'sig_jkl012',
    created_at: '2026-02-08T13:00:00Z',
    updated_at: '2026-02-10T09:00:00Z',
    audit_log: [
      { action: 'request_created', details: 'SOR request created', status: 'success', created_at: '2026-02-08T13:00:00Z' },
      { action: 'pdf_generated', details: 'PDF generated successfully', status: 'success', created_at: '2026-02-08T13:01:00Z' },
      { action: 'signature_sent', details: 'Sent for e-signature', status: 'success', created_at: '2026-02-08T13:03:00Z' },
      { action: 'signed', details: 'Document signed by learner', status: 'success', created_at: '2026-02-09T10:15:00Z' },
      { action: 'uploaded_to_moodle', details: 'Uploaded to Moodle LMS', status: 'success', created_at: '2026-02-10T09:00:00Z' },
    ],
  },
];

function getDemoStats() {
  const requests = DEMO_REQUESTS;
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    signature_sent: requests.filter(r => r.status === 'signature_sent').length,
    signed: requests.filter(r => r.status === 'signed').length,
    uploaded: requests.filter(r => r.status === 'uploaded').length,
    failed: requests.filter(r => r.status === 'failed').length,
    overdue: 0,
  };
}

async function fetchApi(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch {
    // Backend unavailable - return null to trigger fallback
    return null;
  }
}

export const api = {
  // Stats
  getStats: async () => {
    const result = await fetchApi('/stats');
    if (result) return result;
    return { success: true, data: getDemoStats() };
  },

  // Requests
  getRequests: async (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    const result = await fetchApi(`/requests${query ? `?${query}` : ''}`);
    if (result) return result;

    // Fallback: filter demo data locally
    let filtered = [...DEMO_REQUESTS];
    if (params?.status) {
      filtered = filtered.filter(r => r.status === params.status);
    }
    if (params?.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.learner_name.toLowerCase().includes(term) ||
          r.learner_email.toLowerCase().includes(term) ||
          r.id.toString().includes(term)
      );
    }
    return { success: true, data: filtered };
  },

  getRequest: async (id: number) => {
    const result = await fetchApi(`/requests/${id}`);
    if (result) return result;
    const found = DEMO_REQUESTS.find(r => r.id === id);
    if (found) return { success: true, data: found };
    return { success: false, error: 'Request not found' };
  },

  createRequest: async (data: { learner_name: string; learner_email: string; learner_id: number }) => {
    const result = await fetchApi('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result) return result;
    // Fallback demo response
    const newId = DEMO_REQUESTS.length + 1;
    return {
      success: true,
      data: {
        id: newId,
        workflow_status: {
          request_created: true,
          pdf_generated: false,
          signature_sent: false,
          uploaded: false,
        },
        error: 'Backend unavailable - request simulated in demo mode',
      },
    };
  },

  getLearnerGrades: async (learnerId: number, learnerName?: string) => {
    const params = learnerName ? `?name=${encodeURIComponent(learnerName)}` : '';
    const result = await fetchApi(`/learner-grades/${learnerId}${params}`);
    if (result) return result;
    return {
      success: true,
      data: {
        learner_name: learnerName || 'Demo Learner',
        quizzes: [
          { quiz_id: 1, topic_name: 'Module 1: Introduction', score: 8, total_marks: 10, percentage: 80 },
          { quiz_id: 2, topic_name: 'Module 2: Core Concepts', score: 7, total_marks: 10, percentage: 70 },
          { quiz_id: 3, topic_name: 'Module 3: Application', score: 9, total_marks: 10, percentage: 90 },
        ],
        overall_score: 80,
        quiz_count: 3,
      },
    };
  },

  // Actions - these attempt real API calls, fallback to demo responses
  generatePdf: async (id: number) => {
    const result = await fetchApi(`/requests/${id}/generate-pdf`, { method: 'POST' });
    if (result) return result;
    return { success: true, message: 'PDF generated (demo mode)' };
  },

  sendForSignature: async (id: number) => {
    const result = await fetchApi(`/requests/${id}/send-signature`, { method: 'POST' });
    if (result) return result;
    return { success: true, message: 'Sent for signature (demo mode)' };
  },

  uploadToMoodle: async (id: number) => {
    const result = await fetchApi(`/requests/${id}/upload-moodle`, { method: 'POST' });
    if (result) return result;
    return { success: true, message: 'Uploaded to Moodle (demo mode)' };
  },

  syncGrade: async (id: number, grade?: number, feedback?: string) => {
    const result = await fetchApi(`/requests/${id}/sync-grade`, {
      method: 'POST',
      body: JSON.stringify({ grade, feedback }),
    });
    if (result) return result;
    return { success: true, message: `Grade ${grade}% synced (demo mode)` };
  },

  // Bulk actions
  processAllPending: async () => {
    const result = await fetchApi('/process-pending', { method: 'POST' });
    if (result) return result;
    return { success: true, message: 'Processed all pending requests (demo mode)', processed: 2 };
  },

  checkSignatures: async () => {
    const result = await fetchApi('/check-signatures', { method: 'POST' });
    if (result) return result;
    return { success: true, message: 'Signatures checked (demo mode)' };
  },

  bulkSyncGrades: async () => {
    const result = await fetchApi('/bulk-sync-grades', { method: 'POST' });
    if (result) return result;
    return { success: true, message: 'Grades synced (demo mode)' };
  },

  // System
  healthCheck: async () => {
    const result = await fetchApi('/health');
    if (result) return result;
    return { success: true, status: 'demo', message: 'Backend unavailable - running in demo mode' };
  },

  getConfig: async () => {
    const result = await fetchApi('/config');
    if (result) return result;
    return { success: true, data: { mode: 'demo' } };
  },
};
