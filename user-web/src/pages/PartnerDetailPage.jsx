import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPartner, redeemOffer } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';

const OFFER_COLORS = ['bg-primary', 'bg-secondary', 'bg-tertiary-container'];

export default function PartnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [partner, setPartner] = useState(null);
  const [redeeming, setRedeeming] = useState(null);
  const [message, setMessage] = useState('');

  function load() {
    fetchPartner(id).then(({ partner: p }) => setPartner(p)).catch(() => {});
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRedeem(offer) {
    setMessage('');
    setRedeeming(offer.id);
    try {
      const { points } = await redeemOffer(id, offer.id);
      updateUser({ points });
      setMessage(t('partnerDetail.redeemedMessage', { title: offer.title }));
    } catch (err) {
      setMessage(err?.response?.data?.message || t('partnerDetail.errRedeem'));
    } finally {
      setRedeeming(null);
    }
  }

  if (!partner) return <div className="min-h-screen bg-background" />;

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-margin-mobile pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto bg-surface/80 backdrop-blur-md text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" />
        </button>
      </div>

      <div className="relative h-48 w-full bg-gradient-to-br from-primary to-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="px-margin-mobile -mt-16 relative z-10">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_8px_24px_rgba(0,67,23,0.08)] border border-outline-variant/30">
          <div className="flex items-start gap-md">
            <div className="w-20 h-20 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center shrink-0">
              <Icon name="storefront" className="text-primary" size="32px" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-xs truncate">{partner.name}</h1>
              <div className="flex items-center gap-xs mb-xs flex-wrap">
                <span className="font-label-md text-label-md text-on-surface-variant">{partner.category}</span>
                <span className="w-1 h-1 rounded-full bg-outline" />
                <div className="flex items-center gap-xs">
                  <Icon name="star" filled className="text-secondary" size="14px" />
                  <span className="font-label-md text-label-md text-on-surface">{partner.rating}</span>
                </div>
              </div>
              {partner.hours && (
                <div className="flex items-center gap-xs">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-md text-label-md text-secondary">{partner.hours}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-lg px-margin-mobile">
        <div className="bg-secondary-container/30 border border-secondary-container p-md rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Icon name="account_balance_wallet" className="text-on-secondary-container" />
            <span className="font-title-md text-title-md text-on-secondary-container">{t('partnerDetail.yourBalance')}</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{user?.points ?? 0}</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{t('partnerDetail.points')}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-md px-margin-mobile">
          <p className="font-body-md text-body-md text-secondary bg-secondary-container/20 rounded-xl p-md">{message}</p>
        </div>
      )}

      <div className="mt-xl px-margin-mobile">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-title-md text-title-md text-on-background">{t('partnerDetail.availableOffers')}</h2>
        </div>
        <div className="space-y-sm">
          {(partner.offers || []).map((offer, i) => (
            <div key={offer.id} className="bg-surface-container-low border border-outline-variant/20 p-md rounded-xl flex items-center justify-between gap-md">
              <div className="flex gap-md items-center min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 ${OFFER_COLORS[i % OFFER_COLORS.length]}`}>
                  <Icon name={offer.icon || 'redeem'} />
                </div>
                <div className="min-w-0">
                  <p className="font-title-md text-title-md text-on-surface truncate">{offer.title}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {offer.pointsCost} {t('partnerDetail.points')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRedeem(offer)}
                disabled={redeeming === offer.id || (user?.points ?? 0) < offer.pointsCost}
                className="bg-primary text-white font-label-md text-label-md px-md py-2 rounded-full active:scale-95 transition-transform disabled:opacity-40 shrink-0"
              >
                {redeeming === offer.id ? '...' : t('partnerDetail.redeem')}
              </button>
            </div>
          ))}
          {(partner.offers || []).length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant">{t('partnerDetail.noOffers')}</p>
          )}
        </div>
      </div>

      {partner.address && (
        <div className="mt-xl px-margin-mobile pb-8">
          <h2 className="font-title-md text-title-md text-on-background mb-md">{t('partnerDetail.location')}</h2>
          <div className="flex items-start gap-sm">
            <Icon name="location_on" className="text-on-surface-variant" />
            <div>
              <p className="font-body-lg text-body-lg text-on-surface">{partner.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
