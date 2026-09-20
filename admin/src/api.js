import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE_URL });

// This is a local-network dev server (see README) — on some machines the
// very first request on a fresh connection intermittently gets reset at
// the OS/network level before it ever reaches Express (confirmed: retried
// requests are never double-processed server-side). One silent retry on a
// pure network error (no response at all — a real 4xx/5xx never retries)
// smooths that over instead of surfacing a scary error to the user.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!error.response && config && !config.__retried) {
      config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 400));
      return api(config);
    }
    return Promise.reject(error);
  }
);

// Ad files are served from the backend's origin, not under /api.
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export function mediaUrl(path) {
  return `${BACKEND_ORIGIN}${path}`;
}

export function setAdminToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function adminLoginRequest(email, password) {
  const { data } = await api.post('/admin/login', { email, password });
  return data;
}

export async function fetchStats() {
  const { data } = await api.get('/admin/stats');
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

export async function fetchScans(params) {
  const { data } = await api.get('/admin/scans', { params });
  return data;
}

export async function fetchMachines() {
  const { data } = await api.get('/admin/machines');
  return data;
}

export async function createMachine(payload) {
  const { data } = await api.post('/machines', payload);
  return data;
}

export async function updateMachine(id, payload) {
  const { data } = await api.put(`/machines/${id}`, payload);
  return data;
}

export async function deleteMachine(id) {
  const { data } = await api.delete(`/machines/${id}`);
  return data;
}

export async function emptyMachine(id) {
  const { data } = await api.post(`/admin/machines/${id}/empty`);
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get('/admin/notifications');
  return data;
}

export async function acknowledgeNotification(id) {
  const { data } = await api.post(`/admin/notifications/${id}/acknowledge`);
  return data;
}

export async function notifyPartner(id) {
  const { data } = await api.post(`/admin/notifications/${id}/notify-partner`);
  return data;
}

export async function fetchAdminPartners() {
  const { data } = await api.get('/partners/admin/all');
  return data;
}

export async function createPartner(payload) {
  const { data } = await api.post('/partners', payload);
  return data;
}

export async function updatePartner(id, payload) {
  const { data } = await api.put(`/partners/${id}`, payload);
  return data;
}

export async function deletePartner(id) {
  const { data } = await api.delete(`/partners/${id}`);
  return data;
}

export async function addPartnerOffer(id, payload) {
  const { data } = await api.post(`/partners/${id}/offers`, payload);
  return data;
}

export async function removePartnerOffer(id, offerId) {
  const { data } = await api.delete(`/partners/${id}/offers/${offerId}`);
  return data;
}

export async function fetchAdminAds() {
  const { data } = await api.get('/ads/admin/all');
  return data;
}

export async function uploadAd(file, { title, durationSeconds, machineIds, startDate, endDate, daysOfWeek, startTime, endTime }) {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);
  if (durationSeconds) form.append('durationSeconds', durationSeconds);
  form.append('machineIds', JSON.stringify(machineIds || []));
  form.append('daysOfWeek', JSON.stringify(daysOfWeek || []));
  if (startDate) form.append('startDate', startDate);
  if (endDate) form.append('endDate', endDate);
  if (startTime) form.append('startTime', startTime);
  if (endTime) form.append('endTime', endTime);
  const { data } = await api.post('/ads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}

export async function updateAd(id, payload) {
  const { data } = await api.put(`/ads/${id}`, payload);
  return data;
}

export async function deleteAd(id) {
  const { data } = await api.delete(`/ads/${id}`);
  return data;
}
