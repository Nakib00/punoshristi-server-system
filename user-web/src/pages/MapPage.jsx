import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMachines, toggleFavoriteMachine } from '../api';
import { useAuth } from '../AuthContext';
import { haversineKm } from '../lib/geo';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';

const DHAKA_CENTER = [23.8103, 90.4125];
const STATUS_COLOR = { active: '#006e1c', almost_full: '#ba1a1a', offline: '#717a6f' };

function markerIcon(status) {
  const color = STATUS_COLOR[status] || STATUS_COLOR.active;
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:9999px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.5 3.5L18 6l-3 3v2.17l4.24 4.24-1.41 1.42L14.5 13.4V21h-2v-6.59l-1.29 1.3-1.42-1.42L14 10.17V8L11 5l2.5-2.5L15 4l.5-.5z"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function RecenterOnLocate({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 15);
  }, [coords, map]);
  return null;
}

export default function MapPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [machines, setMachines] = useState([]);
  const [coords, setCoords] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMachines().then(({ machines: m }) => setMachines(m || [])).catch(() => {});
  }, []);

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
  }

  const filtered = useMemo(
    () => machines.filter((m) => `${m.name} ${m.location}`.toLowerCase().includes(search.toLowerCase())),
    [machines, search]
  );

  async function handleFavorite(machineId) {
    const { favorites, favorited } = await toggleFavoriteMachine(machineId);
    updateUser({ favorites });
    setSelected((s) => (s ? { ...s, favorited } : s));
  }

  const selectedDistance =
    selected && coords ? haversineKm(coords.lat, coords.lng, selected.lat, selected.lng) : null;

  return (
    <div className="bg-background text-on-background font-body-md text-body-md h-screen overflow-hidden relative">
      <TopAppBar />

      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-md z-[1000] flex gap-sm">
        <div className="flex-grow flex items-center bg-white rounded-full px-4 py-2 shadow-[0px_4px_12px_rgba(0,67,23,0.1)]">
          <Icon name="search" className="text-outline mr-sm" />
          <input
            className="bg-transparent border-none focus:ring-0 outline-none text-body-md w-full placeholder:text-outline-variant"
            placeholder={t('map.findNearest')}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={locateMe}
          className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
        >
          <Icon name="my_location" />
        </button>
      </div>

      <div className="absolute top-36 left-margin-mobile z-[1000]">
        <div className="bg-white/90 backdrop-blur-md p-sm rounded-xl shadow-lg border border-outline-variant flex flex-col gap-xs">
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-label-md">{t('map.active')}</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full bg-error" />
            <span className="text-label-md">{t('map.almostFull')}</span>
          </div>
        </div>
      </div>

      <MapContainer center={DHAKA_CENTER} zoom={13} className="w-full h-full pt-16 pb-20" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnLocate coords={coords} />
        {filtered.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(m.status)} eventHandlers={{ click: () => setSelected(m) }}>
            <Popup>{m.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {selected && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-md z-[1000]">
          <div className="bg-surface rounded-xl p-md shadow-[0px_8px_24px_rgba(0,67,23,0.15)] flex flex-col gap-md">
            <div className="flex gap-md">
              <div className="w-20 h-20 rounded-lg shrink-0 bg-primary/10 flex items-center justify-center">
                <Icon name="recycling" className="text-primary" size="32px" />
              </div>
              <div className="flex-grow flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-title-md text-title-md text-primary truncate">{selected.name}</h3>
                    <span
                      className={
                        'px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ' +
                        (selected.status === 'almost_full' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container')
                      }
                    >
                      {selected.status === 'almost_full' ? t('map.almostFull') : t('map.active')}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-body-md flex items-center gap-xs mt-xs">
                    <Icon name="near_me" size="16px" />
                    {selectedDistance != null ? t('map.kmAway', { km: selectedDistance.toFixed(1) }) : selected.location}
                  </p>
                </div>
                <p className="text-on-surface-variant text-[12px] opacity-70">{selected.address || selected.location}</p>
              </div>
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, '_blank')}
                className="flex-grow bg-primary text-white font-label-md py-3 rounded-full flex items-center justify-center gap-xs shadow-md active:scale-95 transition-transform"
              >
                <Icon name="directions" size="18px" />
                {t('map.getDirections')}
              </button>
              <button
                onClick={() => handleFavorite(selected.id)}
                className="w-12 h-12 bg-surface-container-high text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
              >
                <Icon name="favorite" filled={user?.favorites?.includes(selected.id)} />
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
