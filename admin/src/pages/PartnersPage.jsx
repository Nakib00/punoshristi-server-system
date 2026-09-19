import { useEffect, useState } from 'react';
import {
  addPartnerOffer,
  createPartner,
  deletePartner,
  fetchAdminPartners,
  removePartnerOffer,
  updatePartner,
} from '../api';
import Icon from '../components/Icon';

const EMPTY_FORM = { name: '', category: '', address: '', hours: '', rating: 4.5, distanceKm: '', featured: false };
const EMPTY_OFFER = { title: '', pointsCost: 300, icon: 'redeem' };

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [offerForms, setOfferForms] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchAdminPartners()
      .then(({ partners: list }) => setPartners(list || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.category.trim()) {
      setError('Partner name and category are required');
      return;
    }
    setSubmitting(true);
    try {
      await createPartner({
        ...form,
        distanceKm: form.distanceKm === '' ? undefined : Number(form.distanceKm),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create the partner');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleFeatured(partner) {
    await updatePartner(partner.id, { featured: !partner.featured });
    load();
  }

  async function handleDelete(partner) {
    if (!confirm(`Delete ${partner.name}?`)) return;
    await deletePartner(partner.id);
    load();
  }

  async function handleAddOffer(partnerId) {
    const offer = offerForms[partnerId] || EMPTY_OFFER;
    if (!offer.title?.trim()) return;
    await addPartnerOffer(partnerId, { ...offer, pointsCost: Number(offer.pointsCost) || 0 });
    setOfferForms((f) => ({ ...f, [partnerId]: EMPTY_OFFER }));
    load();
  }

  async function handleRemoveOffer(partnerId, offerId) {
    await removePartnerOffer(partnerId, offerId);
    load();
  }

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Partners & Offers ({partners.length})</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Icon name={showForm ? 'close' : 'add'} size="18px" />
          {showForm ? 'Cancel' : 'Add New Partner'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Partner name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Green Sprout Cafe"
              />
            </label>
            <label>
              Category
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Cafe, Grocery, Fashion"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Address
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label>
              Opening hours
              <input
                type="text"
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                placeholder="e.g. Open until 9:00 PM"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Distance (km, optional)
              <input
                type="number"
                step="any"
                value={form.distanceKm}
                onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
              />
            </label>
            <label className="ad-checkbox-label" style={{ alignSelf: 'center' }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Featured deal (shows on the Partners page banner)
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Partner'}
          </button>
        </form>
      )}

      <div className="machine-grid">
        {partners.length === 0 ? (
          <p className="loading-text">No partners yet. Click above to add one.</p>
        ) : (
          partners.map((p) => (
            <div className="machine-card" key={p.id}>
              <div className="machine-card-header">
                <h3>{p.name}</h3>
                {p.featured && (
                  <span className="status-badge warning">
                    <Icon name="star" filled />
                    Featured
                  </span>
                )}
              </div>
              <p className="machine-location">
                <Icon name="sell" />
                {p.category}
              </p>
              {p.address && <p className="machine-address">{p.address}</p>}
              <p className="machine-meta">
                <Icon name="star" filled size="14px" style={{ verticalAlign: 'text-bottom' }} /> {p.rating}{' '}
                {p.distanceKm != null ? `• ${p.distanceKm}km` : ''} {p.hours ? `• ${p.hours}` : ''}
              </p>

              <div className="capacity-bar-wrap">
                <p className="capacity-text">Offers:</p>
                {(p.offers || []).length === 0 && <p className="machine-meta">No offers yet</p>}
                {(p.offers || []).map((o) => (
                  <p key={o.id} className="machine-meta">
                    • {o.title} — {o.pointsCost} pts{' '}
                    <button className="btn-small btn-danger" onClick={() => handleRemoveOffer(p.id, o.id)}>
                      <Icon name="delete" size="14px" />
                      Remove
                    </button>
                  </p>
                ))}
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Offer name"
                    value={offerForms[p.id]?.title ?? ''}
                    onChange={(e) =>
                      setOfferForms((f) => ({ ...f, [p.id]: { ...(f[p.id] || EMPTY_OFFER), title: e.target.value } }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Points"
                    value={offerForms[p.id]?.pointsCost ?? ''}
                    onChange={(e) =>
                      setOfferForms((f) => ({
                        ...f,
                        [p.id]: { ...(f[p.id] || EMPTY_OFFER), pointsCost: e.target.value },
                      }))
                    }
                  />
                </div>
                <button className="btn-small" onClick={() => handleAddOffer(p.id)}>
                  <Icon name="add" size="16px" />
                  Add Offer
                </button>
              </div>

              <div className="machine-actions">
                <button className="btn-small" onClick={() => handleToggleFeatured(p)}>
                  <Icon name={p.featured ? 'star_border' : 'star'} size="16px" />
                  {p.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button className="btn-small btn-danger" onClick={() => handleDelete(p)}>
                  <Icon name="delete" size="16px" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
