import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE_URL });

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
