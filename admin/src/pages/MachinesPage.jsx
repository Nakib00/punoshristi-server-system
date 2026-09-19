import { useEffect, useState } from 'react';
import {
  createMachine,
  deleteMachine,
  emptyMachine,
  fetchMachines,
  updateMachine,
} from '../api';
import Icon from '../components/Icon';

const EMPTY_FORM = { name: '', location: '', address: '', capacity: 500, lat: '', lng: '' };

const STATUS_META = {
  critical: { icon: 'error', label: 'Almost full' },
  warning: { icon: 'warning', label: 'Over half full' },
  ok: { icon: 'check_circle', label: 'Normal' },
};

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
      setError('Machine name and location are required');
      return;
    }
    setSubmitting(true);
    try {
      await createMachine({
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        capacity: Number(form.capacity) || 500,
        lat: form.lat === '' ? undefined : Number(form.lat),
        lng: form.lng === '' ? undefined : Number(form.lng),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create the machine');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(machine) {
    await updateMachine(machine.id, { active: !machine.active });
    load();
  }

  async function handleEmpty(machine) {
    if (!confirm(`Empty out ${machine.name}?`)) return;
    await emptyMachine(machine.id);
    load();
  }

  async function handleDelete(machine) {
    if (!confirm(`Delete ${machine.name}? This cannot be undone.`)) return;
    await deleteMachine(machine.id);
    load();
  }

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Machines & Locations ({machines.length})</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Icon name={showForm ? 'close' : 'add'} size="18px" />
          {showForm ? 'Cancel' : 'Add New Machine'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Machine name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Machine #4"
              />
            </label>
            <label>
              Location (area)
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Dhaka - Dhanmondi"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Detailed address (optional)
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="e.g. Road 5, Dhanmondi, Dhaka"
              />
            </label>
            <label>
              Capacity (bottles)
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Latitude (optional — for an accurate map location)
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="e.g. 23.8103"
              />
            </label>
            <label>
              Longitude (optional)
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="e.g. 90.4125"
              />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Machine'}
          </button>
        </form>
      )}

      <div className="machine-grid">
        {machines.length === 0 ? (
          <p className="loading-text">No machines yet. Click above to add one.</p>
        ) : (
          machines.map((m) => {
            const meta = STATUS_META[m.status] || STATUS_META.ok;
            return (
              <div className={`machine-card ${m.status}`} key={m.id}>
                <div className="machine-card-header">
                  <h3>{m.name}</h3>
                  <span className={`status-badge ${m.status}`}>
                    <Icon name={meta.icon} filled />
                    {meta.label}
                  </span>
                </div>
                <p className="machine-location">
                  <Icon name="location_on" />
                  {m.location}
                </p>
                {m.address && <p className="machine-address">{m.address}</p>}

                <div className="capacity-bar-wrap">
                  <div className="capacity-bar">
                    <div
                      className={`capacity-bar-fill ${m.status}`}
                      style={{ width: `${Math.min(m.fillPercent, 100)}%` }}
                    />
                  </div>
                  <p className="capacity-text">
                    {m.currentBottles} / {m.capacity} bottles ({m.fillPercent}%)
                  </p>
                </div>

                <p className="machine-meta">Total scans: {m.totalScans} | Status: {m.active ? 'Active' : 'Inactive'}</p>
                <p className="machine-meta">
                  {m.hasPreciseLocation ? 'Precise GPS location set' : 'Approximate location (set Lat/Lng for accuracy)'}
                </p>

                <div className="machine-actions">
                  <button className="btn-small" onClick={() => handleEmpty(m)}>
                    <Icon name="delete_sweep" />
                    Empty
                  </button>
                  <button className="btn-small" onClick={() => handleToggleActive(m)}>
                    <Icon name={m.active ? 'pause_circle' : 'play_circle'} />
                    {m.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(m)}>
                    <Icon name="delete" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
