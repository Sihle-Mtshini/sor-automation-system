async function fetchApi(endpoint: string, options?: RequestInit) {
  const response = await fetch(`/api${endpoint}`, {
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
    const qs = searchParams.toString();
    return fetchApi(`/requests${qs ? `?${qs}` : ''}`);
  },

  getRequest: (id: number) => fetchApi(`/requests/${id}`),

  createRequest: (data: {
    learner_name: string;
    learner_email?: string;
    learner_id: number;
    overall_score?: number | null;
  }) =>
    fetchApi('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Bulk SOR creation
  createBulkRequests: (learners: {
    learner_id: number;
    learner_name: string;
    learner_email?: string;
    overall_score?: number | null;
  }[]) =>
    fetchApi('/requests/bulk', {
      method: 'POST',
      body: JSON.stringify({ learners }),
    }),

  // Learners
  getLearners: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi(`/learners${qs}`);
  },

  getLearnerGrades: (learnerId: number, learnerName?: string) => {
    const qs = learnerName ? `?name=${encodeURIComponent(learnerName)}` : '';
    return fetchApi(`/learners/${learnerId}/grades${qs}`);
  },

  // Moodle completions
  getMoodleCompletions: (courseId?: number) => {
    const qs = courseId ? `?courseId=${courseId}` : '';
    return fetchApi(`/moodle/completions${qs}`);
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
};
