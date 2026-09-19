import { useEffect, useState } from 'react';
import {
  addPartnerOffer,
  createPartner,
  deletePartner,
  fetchAdminPartners,
  removePartnerOffer,
  updatePartner,
} from '../api';

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
      setError('পার্টনারের নাম ও ক্যাটাগরি আবশ্যক');
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
      setError(err?.response?.data?.message || 'পার্টনার তৈরি করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleFeatured(partner) {
    await updatePartner(partner.id, { featured: !partner.featured });
    load();
  }

  async function handleDelete(partner) {
    if (!confirm(`${partner.name} মুছে ফেলতে চান?`)) return;
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

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">পার্টনার ও অফার ({partners.length})</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'বাতিল' : '+ নতুন পার্টনার যোগ করুন'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              পার্টনারের নাম
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="যেমন: Green Sprout Cafe"
              />
            </label>
            <label>
              ক্যাটাগরি
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="যেমন: Cafe, Grocery, Fashion"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              ঠিকানা
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label>
              খোলার সময়
              <input
                type="text"
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                placeholder="যেমন: Open until 9:00 PM"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              দূরত্ব (কিমি, ঐচ্ছিক)
              <input
                type="number"
                step="any"
                value={form.distanceKm}
                onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />{' '}
              ফিচার্ড ডিল (Partners পেজের ব্যানারে দেখাবে)
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'সংরক্ষণ হচ্ছে...' : 'পার্টনার সংরক্ষণ করুন'}
          </button>
        </form>
      )}

      <div className="machine-grid">
        {partners.length === 0 ? (
          <p className="loading-text">কোনো পার্টনার নেই। উপরে ক্লিক করে একটি যোগ করুন।</p>
        ) : (
          partners.map((p) => (
            <div className="machine-card" key={p.id}>
              <div className="machine-card-header">
                <h3>{p.name}</h3>
                {p.featured && <span className="status-badge warning">⭐ ফিচার্ড</span>}
              </div>
              <p className="machine-location">🏷️ {p.category}</p>
              {p.address && <p className="machine-address">{p.address}</p>}
              <p className="machine-meta">
                ⭐ {p.rating} {p.distanceKm != null ? `• ${p.distanceKm}km` : ''} {p.hours ? `• ${p.hours}` : ''}
              </p>

              <div className="capacity-bar-wrap">
                <p className="capacity-text">অফারসমূহ:</p>
                {(p.offers || []).length === 0 && <p className="machine-meta">কোনো অফার নেই</p>}
                {(p.offers || []).map((o) => (
                  <p key={o.id} className="machine-meta">
                    • {o.title} — {o.pointsCost} pts{' '}
                    <button className="btn-small btn-danger" onClick={() => handleRemoveOffer(p.id, o.id)}>
                      মুছুন
                    </button>
                  </p>
                ))}
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="অফারের নাম"
                    value={offerForms[p.id]?.title ?? ''}
                    onChange={(e) =>
                      setOfferForms((f) => ({ ...f, [p.id]: { ...(f[p.id] || EMPTY_OFFER), title: e.target.value } }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="পয়েন্ট"
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
                  + অফার যোগ করুন
                </button>
              </div>

              <div className="machine-actions">
                <button className="btn-small" onClick={() => handleToggleFeatured(p)}>
                  {p.featured ? 'ফিচার্ড বাতিল করুন' : 'ফিচার্ড করুন'}
                </button>
                <button className="btn-small btn-danger" onClick={() => handleDelete(p)}>
                  মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
