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

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

const KNOWN_MESSAGES = {
  'An account with this email already exists': 'An account with this email already exists. Try logging in instead.',
  'An account with this phone number already exists': 'An account with this phone number already exists.',
  'Invalid email or password': 'That email/phone or password is incorrect.',
  'Name, email, phone and password are required': 'Please fill in your name, email, phone and password.',
  'Email/phone and password are required': 'Please enter your email/phone and password.',
};

export function describeAuthError(err, fallback) {
  if (!err?.response) {
    return "Can't reach the server. Check that your phone and computer are on the same Wi-Fi and the server is running.";
  }
  const serverMessage = err.response.data?.message;
  return KNOWN_MESSAGES[serverMessage] || serverMessage || fallback;
}

export async function registerRequest(name, email, password, phone) {
  const { data } = await api.post('/auth/register', { name, email, password, phone });
  return data;
}

export async function loginRequest(emailOrPhone, password) {
  const { data } = await api.post('/auth/login', { emailOrPhone, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function sendOtp() {
  const { data } = await api.post('/auth/otp/send');
  return data;
}

export async function verifyOtp(code) {
  const { data } = await api.post('/auth/otp/verify', { code });
  return data;
}

export async function redeemQrToken(token) {
  const { data } = await api.post('/scan', { token });
  return data;
}

export async function fetchScanHistory() {
  const { data } = await api.get('/my/scans');
  return data;
}

export async function fetchMyStats() {
  const { data } = await api.get('/my/stats');
  return data;
}

export async function fetchMyActivity(limit = 20) {
  const { data } = await api.get('/my/activity', { params: { limit } });
  return data;
}

export async function toggleFavoriteMachine(machineId) {
  const { data } = await api.post(`/my/favorites/${machineId}`);
  return data;
}

export async function fetchMachines() {
  const { data } = await api.get('/machines');
  return data;
}

export async function fetchPartners() {
  const { data } = await api.get('/partners');
  return data;
}

export async function fetchPartner(id) {
  const { data } = await api.get(`/partners/${id}`);
  return data;
}

export async function redeemOffer(partnerId, offerId) {
  const { data } = await api.post(`/partners/${partnerId}/redeem`, { offerId });
  return data;
}

export async function fetchLeaderboard(range = 'week') {
  const { data } = await api.get('/leaderboard', { params: { range } });
  return data;
}

export async function fetchMyRank(range = 'week') {
  const { data } = await api.get('/leaderboard/me', { params: { range } });
  return data;
}
