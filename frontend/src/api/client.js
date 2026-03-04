import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || err)
);

// ── Engagements ───────────────────────────────────────────────────────────────
export const getEngagements = () => api.get('/engagements');
export const createEngagement = data => api.post('/engagements', data);
export const getEngagement = id => api.get(`/engagements/${id}`);
export const updateEngagement = (id, data) => api.patch(`/engagements/${id}`, data);
export const deleteEngagement = id => api.delete(`/engagements/${id}`);
export const getEngagementSummary = id => api.get(`/engagements/${id}/summary`);

// ── Assessments ───────────────────────────────────────────────────────────────
export const getAssessments = engId => api.get(`/engagements/${engId}/assessments`);
export const upsertAssessment = (engId, subId, data) => api.put(`/engagements/${engId}/assessments/${subId}`, data);
export const bulkUpsertAssessments = (engId, items) => api.post(`/engagements/${engId}/assessments/bulk`, { items });

// ── SoA ───────────────────────────────────────────────────────────────────────
export const getSoa = engId => api.get(`/engagements/${engId}/soa`);
export const upsertSoa = (engId, refId, data) => api.put(`/engagements/${engId}/soa/${refId}`, data);
export const bulkUpsertSoa = (engId, items) => api.post(`/engagements/${engId}/soa/bulk`, { items });

// ── Risk Profile ──────────────────────────────────────────────────────────────
export const getRiskProfile = engId => api.get(`/engagements/${engId}/risk-profile`);
export const saveRiskProfile = (engId, data) => api.put(`/engagements/${engId}/risk-profile`, data);

// ── Remediation ───────────────────────────────────────────────────────────────
export const getRemediation = (engId, params) => api.get(`/engagements/${engId}/remediation`, { params });
export const createRemediation = (engId, data) => api.post(`/engagements/${engId}/remediation`, data);
export const updateRemediation = (engId, remId, data) => api.patch(`/engagements/${engId}/remediation/${remId}`, data);
export const deleteRemediation = (engId, remId) => api.delete(`/engagements/${engId}/remediation/${remId}`);

// ── Reports ───────────────────────────────────────────────────────────────────
export const downloadPDF = engId => window.open(`/api/engagements/${engId}/reports/pdf`, '_blank');
export const downloadExcel = engId => window.open(`/api/engagements/${engId}/reports/excel`, '_blank');

// ── CORF Reference Data ───────────────────────────────────────────────────────
export const getCorfData = () => api.get('/corf-data');

export default api;
