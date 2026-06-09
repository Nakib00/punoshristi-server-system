import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE_URL });

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

const KNOWN_MESSAGES = {
  'An account with this email already exists': 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। লগইন করুন অথবা ভিন্ন ইমেইল ব্যবহার করুন।',
  'Invalid email or password': 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।',
  'Name, email and password are required': 'নাম, ইমেইল এবং পাসওয়ার্ড — সবগুলো তথ্য দিন।',
  'Email and password are required': 'ইমেইল এবং পাসওয়ার্ড দিন।',
};

export function describeAuthError(err, fallback) {
  if (!err?.response) {
    return 'সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ফোন ও কম্পিউটার একই Wi-Fi-তে আছে কিনা এবং সার্ভার চালু আছে কিনা পরীক্ষা করুন।';
  }
  const serverMessage = err.response.data?.message;
  return KNOWN_MESSAGES[serverMessage] || serverMessage || fallback;
}

export async function registerRequest(name, email, password, phone) {
  const { data } = await api.post('/auth/register', { name, email, password, phone: phone || undefined });
  return data;
}

export async function loginRequest(emailOrPhone, password) {
  const { data } = await api.post('/auth/login', { emailOrPhone, password });
  return data;
}

export async function fetchScanHistory() {
  const { data } = await api.get('/my/scans');
  return data; // { scans: [...] }
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function redeemQrToken(token) {
  const { data } = await api.post('/scan', { token });
  return data;
}
