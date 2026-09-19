import { useState } from 'react';
import {
  adminLogin,
  clearConfiguredMachineId,
  createMachineAsAdmin,
  setConfiguredMachineId,
  updateMachineAsAdmin,
} from './api';

const EMPTY_FORM = { name: '', location: '', address: '', capacity: 500, lat: '', lng: '' };

// On-site machine registration/repointing. An installer standing at the
// physical RVM can set its real GPS location here — via the browser's
// geolocation, or by typing coordinates looked up on a map — without
// walking back to a laptop to use the admin panel. Requires the admin
// password once per save; nothing is stored afterward.
export default function SetupModal({ machine, onClose, onSaved }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState(null);
  const [form, setForm] = useState(
    machine
      ? {
          name: machine.name || '',
          location: machine.location || '',
          address: machine.address || '',
          capacity: machine.capacity || 500,
          lat: machine.lat ?? '',
          lng: machine.lng ?? '',
        }
      : EMPTY_FORM
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      const token = await adminLogin(email, password);
      setAdminToken(token);
    } catch (err) {
      setError(err.response?.data?.message || 'অ্যাডমিন লগইন ব্যর্থ হয়েছে');
    }
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      setError('এই ব্রাউজারে GPS/লোকেশন সাপোর্ট নেই। ম্যানুয়ালি lat/lng লিখুন।');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        setError(
          `লোকেশন পাওয়া যায়নি (${err.message})। ডেস্কটপ/Pi-তে এটি প্রায়ই ওয়াইফাই/আইপি-ভিত্তিক আনুমানিক অবস্থান দেয় — সঠিকতার জন্য Google Maps থেকে কোঅর্ডিনেট খুঁজে ম্যানুয়ালি লিখুন।`
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.location.trim()) {
      setError('মেশিনের নাম ও লোকেশন (এলাকা) আবশ্যক');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        capacity: Number(form.capacity) || 500,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
      };
      const saved = machine
        ? await updateMachineAsAdmin(adminToken, machine.id, payload)
        : await createMachineAsAdmin(adminToken, payload);
      setConfiguredMachineId(saved.id);
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  }

  function handleDisconnect() {
    if (!confirm('এই কিয়স্ক থেকে মেশিন সংযোগ মুছে ফেলতে চান? পরের বার একটি ড্রপডাউন থেকে মেশিন বেছে নিতে হবে।')) return;
    clearConfiguredMachineId();
    window.location.reload();
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-header">
          <h2>{machine ? 'মেশিন সেটিংস' : 'এই কিয়স্ককে একটি মেশিন হিসেবে রেজিস্টার করুন'}</h2>
          <button className="setup-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {!adminToken ? (
          <form onSubmit={handleLogin} className="setup-form">
            <p className="setup-hint">মেশিনের তথ্য পরিবর্তন করতে অ্যাডমিন লগইন প্রয়োজন (একবারই — সংরক্ষণ করা হয় না)।</p>
            <label>
              অ্যাডমিন ইমেইল
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </label>
            <label>
              পাসওয়ার্ড
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="setup-error">{error}</p>}
            <button type="submit" className="btn btn-manual">
              লগইন করুন
            </button>
          </form>
        ) : (
          <form onSubmit={handleSave} className="setup-form">
            <label>
              মেশিনের নাম
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="যেমন: IUB Campus Gate 1"
              />
            </label>
            <label>
              লোকেশন (এলাকা)
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="যেমন: ঢাকা - বসুন্ধরা"
              />
            </label>
            <label>
              বিস্তারিত ঠিকানা (ঐচ্ছিক)
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label>
              ধারণক্ষমতা (বোতল)
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </label>

            <div className="setup-row">
              <label>
                Latitude
                <input type="number" step="any" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
              </label>
              <label>
                Longitude
                <input type="number" step="any" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
              </label>
            </div>
            <button type="button" className="btn btn-manual setup-gps-btn" onClick={handleUseGps} disabled={locating}>
              {locating ? 'খোঁজা হচ্ছে...' : '📍 বর্তমান GPS অবস্থান ব্যবহার করুন'}
            </button>
            <p className="setup-hint">
              GPS মডিউল ছাড়া Pi/ডেস্কটপে এটি ওয়াইফাই/আইপি-ভিত্তিক আনুমানিক অবস্থান দিতে পারে। নির্ভুল অবস্থানের জন্য Google Maps-এ
              জায়গাটি খুঁজে (right-click → coordinates কপি) সরাসরি lat/lng বসিয়ে দিন।
            </p>

            {error && <p className="setup-error">{error}</p>}

            <button type="submit" className="btn setup-save-btn" disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : machine ? 'আপডেট করুন' : 'রেজিস্টার করুন'}
            </button>

            {machine && (
              <button type="button" className="btn btn-secondary" onClick={handleDisconnect}>
                এই কিয়স্ক থেকে মেশিন সংযোগ মুছুন
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
