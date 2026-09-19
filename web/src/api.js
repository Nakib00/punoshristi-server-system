import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const BACKEND_ORIGIN = baseURL.replace(/\/api\/?$/, '');

// Set once per physical kiosk deployment — locks this screen to a single
// machine and skips the manual machine-picker below. Leave unset while
// testing on a laptop with no fixed hardware.
export const MACHINE_ID = import.meta.env.VITE_MACHINE_ID || null;

// The local GPIO bridge daemon (see server/kiosk-gpio-bridge) — runs on
// this same device, never over the network.
export const GPIO_BRIDGE_URL = import.meta.env.VITE_GPIO_BRIDGE_URL || 'http://localhost:5055';

export const api = axios.create({ baseURL });

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

export async function fetchAds() {
  const { data } = await api.get('/ads');
  return data; // { ads: [...] }
}
