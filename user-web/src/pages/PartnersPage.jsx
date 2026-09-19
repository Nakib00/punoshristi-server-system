import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPartners } from '../api';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';

export default function PartnersPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchPartners().then(({ partners: p }) => setPartners(p || [])).catch(() => {});
  }, []);

  const categories = useMemo(() => ['All', ...new Set(partners.map((p) => p.category))], [partners]);

  const filtered = useMemo(
    () =>
      partners.filter(
        (p) =>
          (category === 'All' || p.category === category) &&
          `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
      ),
    [partners, search, category]
  );

  const featured = partners.find((p) => p.featured);

  return (
    <div className="flex flex-col min-h-screen text-on-background bg-background">
      <TopAppBar />
      <main className="flex-grow pt-20 pb-24 px-margin-mobile">
        <section className="mb-lg">
          <h2 className="font-headline-xl text-headline-xl text-primary">{t('partners.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{t('partners.subtitle')}</p>
        </section>

        <section className="mb-lg">
          <div className="relative flex items-center">
            <Icon name="search" className="absolute left-4 text-outline" />
            <input
              className="w-full h-12 pl-12 pr-4 bg-white border border-outline-variant rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
              placeholder={t('partners.searchPlaceholder')}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        <section className="mb-lg -mx-margin-mobile overflow-x-auto hide-scrollbar">
          <div className="flex gap-sm px-margin-mobile">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  'flex-shrink-0 px-md py-2 rounded-full font-label-md text-label-md transition-colors ' +
                  (category === c
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:bg-surface-container-high')
                }
              >
                {c === 'All' ? t('partners.all') : c}
              </button>
            ))}
          </div>
        </section>

        {featured && (
          <section className="mb-xl">
            <button
              onClick={() => navigate(`/partners/${featured.id}`)}
              className="w-full relative overflow-hidden rounded-xl h-32 flex items-center bg-gradient-to-br from-primary to-secondary p-lg text-white shadow-lg text-left"
            >
              <div className="z-10 w-full">
                <span className="inline-block px-2 py-1 bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded-lg mb-xs">
                  {t('partners.featured')}
                </span>
                <h3 className="font-headline-lg text-headline-lg leading-tight">{featured.name}</h3>
                <p className="font-body-md text-body-md opacity-90 mt-xs">
                  {t('partners.fromPointsAt', { points: featured.cheapestOfferCost ?? '—', category: featured.category })}
                </p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 gap-gutter">
          {filtered.map((p) => (
            <div key={p.id} className="bg-[#F0FAF2] rounded-xl p-md border border-[#E0F2E4] shadow-[0px_4px_12px_rgba(0,67,23,0.04)] flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-sm shadow-sm border border-outline-variant">
                <Icon name="storefront" className="text-primary" size="28px" />
              </div>
              <h4 className="font-title-md text-title-md text-primary truncate w-full">{p.name}</h4>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
                {p.category} {p.distanceKm != null ? `• ${p.distanceKm}km` : ''}
              </p>
              <div className="bg-secondary-container px-2 py-0.5 rounded-full mb-md">
                <p className="font-label-md text-label-md text-on-secondary-container">
                  {p.cheapestOfferCost ?? '—'} {t('partners.pointsSuffix')}
                </p>
              </div>
              <button
                onClick={() => navigate(`/partners/${p.id}`)}
                className="w-full py-2 bg-primary text-white rounded-full font-label-md text-label-md hover:bg-primary-container transition-colors active:scale-95 duration-150"
              >
                {t('partners.viewOffer')}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 text-center font-body-md text-body-md text-on-surface-variant py-xl">{t('partners.noPartners')}</p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
