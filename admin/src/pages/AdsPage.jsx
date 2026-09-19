import { useEffect, useRef, useState } from 'react';
import { deleteAd, fetchAdminAds, mediaUrl, updateAd, uploadAd } from '../api';

export default function AdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(8);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  function load() {
    fetchAdminAds()
      .then(({ ads: list }) => setAds(list || []))
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
      await uploadAd(file, { title, durationSeconds: duration });
      setTitle('');
      setDuration(8);
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

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">কিয়স্ক বিজ্ঞাপন / স্লাইড ({ads.length})</h1>
      </div>
      <p className="loading-text" style={{ marginTop: -8, marginBottom: 16 }}>
        মেশিনের মনিটরে অলস অবস্থায় (idle) এই ছবি/ভিডিওগুলো ক্রমানুসারে ঘুরতে থাকবে। বোতল স্ক্যান শুরু হলে এই স্লাইডশো বন্ধ হয়ে যাবে।
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
              <div className="machine-actions">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
