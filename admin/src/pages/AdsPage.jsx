import { useEffect, useRef, useState } from 'react';
import { deleteAd, fetchAdminAds, fetchMachines, mediaUrl, updateAd, uploadAd } from '../api';

const DAY_LABELS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

const EMPTY_SCHEDULE = {
  machineIds: [],
  startDate: '',
  endDate: '',
  daysOfWeek: [],
  startTime: '',
  endTime: '',
};

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function ScheduleFields({ machines, value, onChange }) {
  return (
    <div className="ad-schedule-fields">
      <div>
        <p className="machine-meta" style={{ marginBottom: 4 }}>
          কোন মেশিনে দেখাবে? (কিছু না বাছলে — সব মেশিনে দেখাবে)
        </p>
        <div className="ad-machine-checkboxes">
          {machines.map((m) => (
            <label key={m.id} className="ad-checkbox-label">
              <input
                type="checkbox"
                checked={value.machineIds.includes(m.id)}
                onChange={() => onChange({ ...value, machineIds: toggleInArray(value.machineIds, m.id) })}
              />
              {m.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>
          শুরুর তারিখ (ঐচ্ছিক)
          <input type="date" value={value.startDate} onChange={(e) => onChange({ ...value, startDate: e.target.value })} />
        </label>
        <label>
          শেষ তারিখ (ঐচ্ছিক)
          <input type="date" value={value.endDate} onChange={(e) => onChange({ ...value, endDate: e.target.value })} />
        </label>
      </div>

      <div>
        <p className="machine-meta" style={{ marginBottom: 4 }}>
          সপ্তাহের কোন দিনগুলোতে? (কিছু না বাছলে — প্রতিদিন)
        </p>
        <div className="ad-machine-checkboxes">
          {DAY_LABELS.map((label, i) => (
            <label key={i} className="ad-checkbox-label">
              <input
                type="checkbox"
                checked={value.daysOfWeek.includes(i)}
                onChange={() => onChange({ ...value, daysOfWeek: toggleInArray(value.daysOfWeek, i) })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>
          দিনের কোন সময় থেকে (ঐচ্ছিক)
          <input type="time" value={value.startTime} onChange={(e) => onChange({ ...value, startTime: e.target.value })} />
        </label>
        <label>
          কোন সময় পর্যন্ত (ঐচ্ছিক)
          <input type="time" value={value.endTime} onChange={(e) => onChange({ ...value, endTime: e.target.value })} />
        </label>
      </div>
      <p className="setup-hint">সময় ফাঁকা রাখলে সারাদিন দেখাবে। শুধু সময় দিলে (তারিখ ছাড়া) প্রতিদিন ওই সময়ে লুপে দেখাবে — অনেকটা Facebook Ads-এর "ad scheduling"-এর মতো।</p>
    </div>
  );
}

function describeSchedule(ad, machines) {
  const parts = [];
  if (ad.machineIds?.length) {
    const names = ad.machineIds.map((id) => machines.find((m) => m.id === id)?.name || id.slice(0, 6));
    parts.push(`📍 ${names.join(', ')}`);
  } else {
    parts.push('📍 সব মেশিন');
  }
  if (ad.startDate || ad.endDate) parts.push(`🗓️ ${ad.startDate || '...'} — ${ad.endDate || '...'}`);
  if (ad.daysOfWeek?.length) parts.push(`📆 ${ad.daysOfWeek.map((d) => DAY_LABELS[d]).join('/')}`);
  if (ad.startTime || ad.endTime) parts.push(`⏰ ${ad.startTime || '00:00'}–${ad.endTime || '24:00'}`);
  return parts.join(' • ');
}

export default function AdsPage() {
  const [ads, setAds] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(8);
  const [schedule, setSchedule] = useState(EMPTY_SCHEDULE);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editSchedule, setEditSchedule] = useState(EMPTY_SCHEDULE);
  const fileRef = useRef(null);

  function load() {
    Promise.all([fetchAdminAds(), fetchMachines()])
      .then(([adsRes, machinesRes]) => {
        setAds(adsRes.ads || []);
        setMachines(machinesRes.machines || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('একটি ছবি (jpg/png/webp/gif) অথবা mp4 ভিডিও ফাইল বেছে নিন');
      return;
    }
    setUploading(true);
    try {
      await uploadAd(file, { title, durationSeconds: duration, ...schedule });
      setTitle('');
      setDuration(8);
      setSchedule(EMPTY_SCHEDULE);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(ad) {
    await updateAd(ad.id, { active: !ad.active });
    load();
  }

  async function handleMove(ad, direction) {
    const index = ads.findIndex((a) => a.id === ad.id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= ads.length) return;
    const other = ads[swapIndex];
    await Promise.all([updateAd(ad.id, { order: other.order }), updateAd(other.id, { order: ad.order })]);
    load();
  }

  async function handleDelete(ad) {
    if (!confirm(`"${ad.title}" মুছে ফেলতে চান?`)) return;
    await deleteAd(ad.id);
    load();
  }

  function openEdit(ad) {
    setEditingId(ad.id);
    setEditSchedule({
      machineIds: ad.machineIds || [],
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
      daysOfWeek: ad.daysOfWeek || [],
      startTime: ad.startTime || '',
      endTime: ad.endTime || '',
    });
  }

  async function handleSaveSchedule(ad) {
    await updateAd(ad.id, editSchedule);
    setEditingId(null);
    load();
  }

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">কিয়স্ক বিজ্ঞাপন / স্লাইড ({ads.length})</h1>
      </div>
      <p className="loading-text" style={{ marginTop: -8, marginBottom: 16 }}>
        মেশিনের মনিটরে অলস অবস্থায় (idle) এই ছবি/ভিডিওগুলো ক্রমানুসারে ঘুরতে থাকবে। প্রতিটি বিজ্ঞাপনে নির্দিষ্ট মেশিন, তারিখ, সপ্তাহের
        দিন ও দিনের সময় বেঁধে দেওয়া যায় (Facebook Ads-এর শিডিউলের মতো) — শর্ত পূরণ না হলে সেই বিজ্ঞাপন লুপে দেখাবে না।
      </p>

      <form className="inline-form" onSubmit={handleUpload}>
        <div className="form-row">
          <label>
            টাইটেল (ঐচ্ছিক)
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: Recycle Campaign 1" />
          </label>
          <label>
            ছবি দেখানোর সময় (সেকেন্ড, ভিডিওর জন্য প্রযোজ্য নয়)
            <input type="number" min="2" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            ফাইল (jpg/png/webp/gif অথবা mp4)
            <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" />
          </label>
        </div>

        <ScheduleFields machines={machines} value={schedule} onChange={setSchedule} />

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? 'আপলোড হচ্ছে...' : '+ আপলোড করুন'}
        </button>
      </form>

      <div className="machine-grid">
        {ads.length === 0 ? (
          <p className="loading-text">কোনো বিজ্ঞাপন নেই। উপরে থেকে একটি আপলোড করুন।</p>
        ) : (
          ads.map((ad, i) => (
            <div className={`machine-card ${ad.active ? '' : 'offline'}`} key={ad.id}>
              <div className="machine-card-header">
                <h3>{ad.title}</h3>
                <span className="status-badge">{ad.type === 'video' ? '🎬 ভিডিও' : '🖼️ ছবি'}</span>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 8 }}>
                {ad.type === 'video' ? (
                  <video src={mediaUrl(ad.url)} style={{ width: '100%', maxHeight: 160 }} muted controls />
                ) : (
                  <img src={mediaUrl(ad.url)} alt={ad.title} style={{ width: '100%', maxHeight: 160, objectFit: 'cover' }} />
                )}
              </div>
              <p className="machine-meta">
                ক্রম: {i + 1} {ad.type === 'image' ? `• ${ad.durationSeconds}s` : ''} • অবস্থা: {ad.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </p>
              <p className="machine-meta">{describeSchedule(ad, machines)}</p>

              {editingId === ad.id ? (
                <div>
                  <ScheduleFields machines={machines} value={editSchedule} onChange={setEditSchedule} />
                  <div className="machine-actions">
                    <button className="btn-small" onClick={() => handleSaveSchedule(ad)}>
                      সংরক্ষণ করুন
                    </button>
                    <button className="btn-small" onClick={() => setEditingId(null)}>
                      বাতিল
                    </button>
                  </div>
                </div>
              ) : (
                <div className="machine-actions">
                  <button className="btn-small" onClick={() => openEdit(ad)}>
                    🎯 টার্গেট/শিডিউল এডিট
                  </button>
                  <button className="btn-small" onClick={() => handleMove(ad, -1)} disabled={i === 0}>
                    ↑ উপরে
                  </button>
                  <button className="btn-small" onClick={() => handleMove(ad, 1)} disabled={i === ads.length - 1}>
                    ↓ নিচে
                  </button>
                  <button className="btn-small" onClick={() => handleToggleActive(ad)}>
                    {ad.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(ad)}>
                    মুছুন
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
