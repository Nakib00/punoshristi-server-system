import { useEffect, useState } from 'react';
import { mediaUrl } from './api';

// Fullscreen idle-state slideshow. Images advance after their configured
// duration; videos advance when they finish playing. Loops forever.
export default function AdCarousel({ ads }) {
  const [index, setIndex] = useState(0);
  const current = ads[index % ads.length];

  useEffect(() => {
    setIndex(0);
  }, [ads.length]);

  useEffect(() => {
    if (!current || current.type !== 'image') return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % ads.length), (current.durationSeconds || 8) * 1000);
    return () => clearTimeout(timer);
  }, [current, ads.length]);

  if (!current) {
    return (
      <div className="ad-carousel ad-carousel-empty">
        <p>কোনো বিজ্ঞাপন যোগ করা হয়নি — অ্যাডমিন প্যানেল থেকে যোগ করুন।</p>
      </div>
    );
  }

  return (
    <div className="ad-carousel">
      {current.type === 'video' ? (
        <video
          key={current.id}
          src={mediaUrl(current.url)}
          className="ad-media"
          autoPlay
          muted
          playsInline
          onEnded={() => setIndex((i) => (i + 1) % ads.length)}
        />
      ) : (
        <img key={current.id} src={mediaUrl(current.url)} className="ad-media" alt={current.title} />
      )}
    </div>
  );
}
