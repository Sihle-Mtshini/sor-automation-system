const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchApi(endpoint: string, options?: RequestInit) {
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
}

export const api = {
  // Stats
  getStats: () => fetchApi('/stats'),

  // Requests
  getRequests: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchApi(`/requests${query ? `?${query}` : ''}`);
  },

  getRequest: (id: number) => fetchApi(`/requests/${id}`),

  createRequest: (data: { learner_name: string; learner_email: string; learner_id: number }) =>
    fetchApi('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLearnerGrades: (learnerId: number, learnerName?: string) => {
    const params = learnerName ? `?name=${encodeURIComponent(learnerName)}` : '';
    return fetchApi(`/learner-grades/${learnerId}${params}`);
  },

  // Actions
  generatePdf: (id: number) =>
    fetchApi(`/requests/${id}/generate-pdf`, { method: 'POST' }),

  sendForSignature: (id: number) =>
    fetchApi(`/requests/${id}/send-signature`, { method: 'POST' }),

  uploadToMoodle: (id: number) =>
    fetchApi(`/requests/${id}/upload-moodle`, { method: 'POST' }),

  syncGrade: (id: number, grade?: number, feedback?: string) =>
    fetchApi(`/requests/${id}/sync-grade`, {
      method: 'POST',
      body: JSON.stringify({ grade, feedback }),
    }),

  // Bulk actions
  processAllPending: () =>
    fetchApi('/process-pending', { method: 'POST' }),

  checkSignatures: () =>
    fetchApi('/check-signatures', { method: 'POST' }),

  bulkSyncGrades: () =>
    fetchApi('/bulk-sync-grades', { method: 'POST' }),

  // System
  healthCheck: () => fetchApi('/health'),
  getConfig: () => fetchApi('/config'),
};
