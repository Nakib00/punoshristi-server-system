import { useEffect, useRef, useState } from 'react';
import { deleteAd, fetchAdminAds, fetchMachines, mediaUrl, updateAd, uploadAd } from '../api';
import Icon from '../components/Icon';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          Which machines should this show on? (none selected = all machines)
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
          Start date (optional)
          <input type="date" value={value.startDate} onChange={(e) => onChange({ ...value, startDate: e.target.value })} />
        </label>
        <label>
          End date (optional)
          <input type="date" value={value.endDate} onChange={(e) => onChange({ ...value, endDate: e.target.value })} />
        </label>
      </div>

      <div>
        <p className="machine-meta" style={{ marginBottom: 4 }}>
          Which days of the week? (none selected = every day)
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
          Start time (optional)
          <input type="time" value={value.startTime} onChange={(e) => onChange({ ...value, startTime: e.target.value })} />
        </label>
        <label>
          End time (optional)
          <input type="time" value={value.endTime} onChange={(e) => onChange({ ...value, endTime: e.target.value })} />
        </label>
      </div>
      <p className="setup-hint">
        Leave the time blank to show all day. Setting only a time (no dates) loops that window every day — like Facebook
        Ads&apos; ad scheduling.
      </p>
    </div>
  );
}

function describeSchedule(ad, machines) {
  const parts = [];
  if (ad.machineIds?.length) {
    const names = ad.machineIds.map((id) => machines.find((m) => m.id === id)?.name || id.slice(0, 6));
    parts.push(`Machines: ${names.join(', ')}`);
  } else {
    parts.push('All machines');
  }
  if (ad.startDate || ad.endDate) parts.push(`${ad.startDate || '...'} — ${ad.endDate || '...'}`);
  if (ad.daysOfWeek?.length) parts.push(ad.daysOfWeek.map((d) => DAY_LABELS[d]).join('/'));
  if (ad.startTime || ad.endTime) parts.push(`${ad.startTime || '00:00'}–${ad.endTime || '24:00'}`);
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
      setError('Choose an image (jpg/png/webp/gif) or an mp4 video file');
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
      setError(err?.response?.data?.message || 'Upload failed');
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
    if (!confirm(`Delete "${ad.title}"?`)) return;
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

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kiosk Ads / Slides ({ads.length})</h1>
      </div>
      <p className="loading-text" style={{ marginTop: -8, marginBottom: 16, justifyContent: 'flex-start', minHeight: 'auto' }}>
        These images/videos loop on the machine&apos;s monitor while it&apos;s idle. Each ad can be targeted to specific
        machines and scheduled by date, day of week, and time of day (like Facebook Ads scheduling) — it only shows in the
        loop when all of its conditions are met.
      </p>

      <form className="inline-form" onSubmit={handleUpload}>
        <div className="form-row">
          <label>
            Title (optional)
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Recycle Campaign 1" />
          </label>
          <label>
            Display duration (seconds, images only)
            <input type="number" min="2" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            File (jpg/png/webp/gif or mp4)
            <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" />
          </label>
        </div>

        <ScheduleFields machines={machines} value={schedule} onChange={setSchedule} />

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={uploading}>
          <Icon name="upload" size="18px" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <div className="machine-grid">
        {ads.length === 0 ? (
          <p className="loading-text">No ads yet. Upload one above.</p>
        ) : (
          ads.map((ad, i) => (
            <div className={`machine-card ${ad.active ? '' : 'offline'}`} key={ad.id}>
              <div className="machine-card-header">
                <h3>{ad.title}</h3>
                <span className="status-badge">
                  <Icon name={ad.type === 'video' ? 'movie' : 'image'} />
                  {ad.type === 'video' ? 'Video' : 'Image'}
                </span>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 8, marginTop: 10 }}>
                {ad.type === 'video' ? (
                  <video src={mediaUrl(ad.url)} style={{ width: '100%', maxHeight: 160 }} muted controls />
                ) : (
                  <img src={mediaUrl(ad.url)} alt={ad.title} style={{ width: '100%', maxHeight: 160, objectFit: 'cover' }} />
                )}
              </div>
              <p className="machine-meta">
                Order: {i + 1} {ad.type === 'image' ? `• ${ad.durationSeconds}s` : ''} • Status: {ad.active ? 'Active' : 'Inactive'}
              </p>
              <p className="machine-meta">{describeSchedule(ad, machines)}</p>

              {editingId === ad.id ? (
                <div>
                  <ScheduleFields machines={machines} value={editSchedule} onChange={setEditSchedule} />
                  <div className="machine-actions">
                    <button className="btn-small" onClick={() => handleSaveSchedule(ad)}>
                      <Icon name="check" size="16px" />
                      Save
                    </button>
                    <button className="btn-small" onClick={() => setEditingId(null)}>
                      <Icon name="close" size="16px" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="machine-actions">
                  <button className="btn-small" onClick={() => openEdit(ad)}>
                    <Icon name="tune" size="16px" />
                    Target / Schedule
                  </button>
                  <button className="btn-small" onClick={() => handleMove(ad, -1)} disabled={i === 0}>
                    <Icon name="arrow_upward" size="16px" />
                  </button>
                  <button className="btn-small" onClick={() => handleMove(ad, 1)} disabled={i === ads.length - 1}>
                    <Icon name="arrow_downward" size="16px" />
                  </button>
                  <button className="btn-small" onClick={() => handleToggleActive(ad)}>
                    <Icon name={ad.active ? 'pause_circle' : 'play_circle'} size="16px" />
                    {ad.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(ad)}>
                    <Icon name="delete" size="16px" />
                    Delete
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
