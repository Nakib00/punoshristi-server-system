import { useEffect, useState } from 'react';
import {
  createMachine,
  deleteMachine,
  emptyMachine,
  fetchMachines,
  updateMachine,
} from '../api';

const EMPTY_FORM = { name: '', location: '', address: '', capacity: 500 };

export default function MachinesPage() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchMachines()
      .then(({ machines: list }) => setMachines(list || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.location.trim()) {
      setError('মেশিনের নাম ও লোকেশন আবশ্যক');
      return;
    }
    setSubmitting(true);
    try {
      await createMachine({
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        capacity: Number(form.capacity) || 500,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'মেশিন তৈরি করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(machine) {
    await updateMachine(machine.id, { active: !machine.active });
    load();
  }

  async function handleEmpty(machine) {
    if (!confirm(`${machine.name} মেশিনটি খালি (empty) করতে চান?`)) return;
    await emptyMachine(machine.id);
    load();
  }

  async function handleDelete(machine) {
    if (!confirm(`${machine.name} মেশিনটি মুছে ফেলতে চান? এটি ফিরিয়ে আনা যাবে না।`)) return;
    await deleteMachine(machine.id);
    load();
  }

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">মেশিন ও লোকেশন ({machines.length})</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'বাতিল' : '+ নতুন মেশিন যোগ করুন'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              মেশিনের নাম
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="যেমন: মেশিন #৪"
              />
            </label>
            <label>
              লোকেশন (এলাকা)
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="যেমন: ঢাকা - ধানমন্ডি"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              বিস্তারিত ঠিকানা (ঐচ্ছিক)
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="যেমন: রোড ৫, ধানমন্ডি, ঢাকা"
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
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'সংরক্ষণ হচ্ছে...' : 'মেশিন সংরক্ষণ করুন'}
          </button>
        </form>
      )}

      <div className="machine-grid">
        {machines.length === 0 ? (
          <p className="loading-text">কোনো মেশিন নেই। উপরে ক্লিক করে একটি যোগ করুন।</p>
        ) : (
          machines.map((m) => (
            <div className={`machine-card ${m.status}`} key={m.id}>
              <div className="machine-card-header">
                <h3>{m.name}</h3>
                <span className={`status-badge ${m.status}`}>
                  {m.status === 'critical' ? '🔴 প্রায় পূর্ণ' : m.status === 'warning' ? '🟡 অর্ধেকের বেশি' : '🟢 স্বাভাবিক'}
                </span>
              </div>
              <p className="machine-location">📍 {m.location}</p>
              {m.address && <p className="machine-address">{m.address}</p>}

              <div className="capacity-bar-wrap">
                <div className="capacity-bar">
                  <div
                    className={`capacity-bar-fill ${m.status}`}
                    style={{ width: `${Math.min(m.fillPercent, 100)}%` }}
                  />
                </div>
                <p className="capacity-text">
                  {m.currentBottles} / {m.capacity} বোতল ({m.fillPercent}%)
                </p>
              </div>

              <p className="machine-meta">মোট স্ক্যান: {m.totalScans} | অবস্থা: {m.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</p>

              <div className="machine-actions">
                <button className="btn-small" onClick={() => handleEmpty(m)}>🗑️ খালি করুন</button>
                <button className="btn-small" onClick={() => handleToggleActive(m)}>
                  {m.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                </button>
                <button className="btn-small btn-danger" onClick={() => handleDelete(m)}>মুছুন</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
