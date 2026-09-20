import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const BACKEND_ORIGIN = baseURL.replace(/\/api\/?$/, '');

// A kiosk can be locked to one machine two ways:
//   1. Build-time: VITE_MACHINE_ID in .env (baked into the build).
//   2. On-device: the ⚙ setup screen in the kiosk itself, which writes to
//      localStorage — no rebuild needed, so an installer standing at the
//      physical machine can register/repoint it on the spot.
// localStorage wins when both are present (it's the more specific, most
// recently set value for *this* device).
const LOCAL_MACHINE_ID_KEY = 'punoshristi-kiosk/machineId';

export function getConfiguredMachineId() {
  return localStorage.getItem(LOCAL_MACHINE_ID_KEY) || import.meta.env.VITE_MACHINE_ID || null;
}

export function setConfiguredMachineId(id) {
  localStorage.setItem(LOCAL_MACHINE_ID_KEY, id);
}

export function clearConfiguredMachineId() {
  localStorage.removeItem(LOCAL_MACHINE_ID_KEY);
}

// True only when an operator/installer explicitly picked this machine via
// the on-device setup screen or the build-time env var — never guessed.
export const MACHINE_ID = getConfiguredMachineId();

// The local GPIO bridge daemon (see server/kiosk-gpio-bridge) — runs on
// this same device, never over the network.
export const GPIO_BRIDGE_URL = import.meta.env.VITE_GPIO_BRIDGE_URL || 'http://localhost:5055';

export const api = axios.create({ baseURL });

// This is a local-network dev server (see README) — on some machines the
// very first request on a fresh connection intermittently gets reset at
// the OS/network level before it ever reaches Express (confirmed: retried
// requests are never double-processed server-side). One silent retry on a
// pure network error (no response at all — a real 4xx/5xx never retries)
// smooths that over instead of surfacing a scary error on the kiosk screen.
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

export function mediaUrl(path) {
  return `${BACKEND_ORIGIN}${path}`;
}

export async function getMachines() {
  const { data } = await api.get('/machines');
  return data; // { machines: [...] }
}

export async function createSession(bottleCount, machineId) {
  const { data } = await api.post('/sessions', { bottleCount, machineId: machineId || undefined });
  return data;
}

export async function fetchAds(machineId) {
  const { data } = await api.get('/ads', { params: machineId ? { machineId } : {} });
  return data; // { ads: [...] } — already filtered server-side by schedule/targeting
}

// --- On-device machine setup (⚙ screen) ------------------------------
//
// The admin token below is requested once, used for a single write, and
// never persisted (not localStorage, not the shared `api` instance) — the
// kiosk has no standing admin session.

export async function adminLogin(email, password) {
  const { data } = await api.post('/admin/login', { email, password });
  return data.token;
}

export async function createMachineAsAdmin(adminToken, payload) {
  const { data } = await api.post('/machines', payload, { headers: { Authorization: `Bearer ${adminToken}` } });
  return data.machine;
}

export async function updateMachineAsAdmin(adminToken, id, payload) {
  const { data } = await api.put(`/machines/${id}`, payload, { headers: { Authorization: `Bearer ${adminToken}` } });
  return data.machine;
}
