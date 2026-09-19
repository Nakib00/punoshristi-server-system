import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { redeemQrToken } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../i18n/LanguageContext';

const READER_ELEMENT_ID = 'qr-reader';

export default function ScanPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState('scanning'); // scanning | processing | error
  const [message, setMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let scanner;
    try {
      scanner = new Html5Qrcode(READER_ELEMENT_ID);
    } catch (err) {
      setStatus('error');
      setMessage(`${t('scan.errCameraStart')}: ${err?.message || err}`);
      return undefined;
    }
    scannerRef.current = scanner;
    handledRef.current = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          handleScanned(decodedText);
        },
        () => {}
      )
      .catch(() => {
        setStatus('error');
        setMessage(t('scan.errCameraAccess'));
      });

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    const safeClear = () => {
      try {
        scanner.clear();
      } catch {
        /* ignore */
      }
    };
    if (scanner.isScanning) {
      scanner.stop().then(safeClear).catch(safeClear);
    } else {
      safeClear();
    }
  }

  async function stopScannerAsync() {
    const scanner = scannerRef.current;
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        /* ignore */
      }
    }
  }

  async function redeem(token) {
    try {
      const data = await redeemQrToken(token);
      updateUser({ bottleCount: data.bottleCount, points: data.points });
      navigate('/success', { state: data, replace: true });
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.message || t('scan.errVerify'));
    }
  }

  async function handleScanned(decodedText) {
    setStatus('processing');
    await stopScannerAsync();

    let token = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && typeof parsed.token === 'string') token = parsed.token;
    } catch {
      /* raw token */
    }
    redeem(token);
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setStatus('processing');
    await stopScannerAsync();
    redeem(manualCode.trim());
  }

  function handleRetry() {
    handledRef.current = false;
    setMessage('');
    setStatus('scanning');
    setTimeout(() => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            handleScanned(decodedText);
          },
          () => {}
        )
        .catch(() => {
          setStatus('error');
          setMessage(t('scan.errCameraRetry'));
        });
    }, 100);
  }

  return (
    <div className="bg-[#0F1F0F] min-h-screen flex flex-col font-body-md text-on-surface overflow-hidden">
      <header className="flex justify-between items-center px-margin-mobile h-16 w-full z-50 text-white">
        <div className="flex items-center gap-md">
          <button
            className="hover:bg-white/10 p-2 rounded-full transition-colors active:scale-95 duration-200"
            onClick={() => navigate('/dashboard')}
          >
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold">{t('scan.title')}</h1>
        </div>
        <LanguageToggle dark />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile relative">
        <div className="relative w-full aspect-square max-w-[320px] mb-lg overflow-hidden rounded-xl bg-black">
          <div id={READER_ELEMENT_ID} className="w-full h-full [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full" />
          <div className="absolute inset-0 border-[2px] border-white/20 rounded-xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-secondary-container rounded-tl-xl shadow-[0_0_15px_rgba(145,247,142,0.6)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-secondary-container rounded-tr-xl shadow-[0_0_15px_rgba(145,247,142,0.6)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-secondary-container rounded-bl-xl shadow-[0_0_15px_rgba(145,247,142,0.6)] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-secondary-container rounded-br-xl shadow-[0_0_15px_rgba(145,247,142,0.6)] pointer-events-none" />
          {status === 'scanning' && (
            <div className="scanner-line absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary-container to-transparent shadow-[0_0_8px_rgba(145,247,142,0.8)] z-10 pointer-events-none" />
          )}
          {status === 'processing' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <p className="text-white font-title-md text-title-md">{t('scan.verifying')}</p>
            </div>
          )}
        </div>

        <p className="text-white/80 text-center font-body-lg text-body-lg mb-lg">
          {status === 'error' ? message : t('scan.pointCamera')}
        </p>

        <div className="w-full max-w-md bg-surface-container-lowest/10 backdrop-blur-md p-lg rounded-xl border border-white/10 mt-auto mb-xl">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-md">
            <label className="text-white/60 font-label-md text-label-md">{t('scan.orManual')}</label>
            <div className="flex flex-col gap-sm">
              <input
                className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-secondary-container/50 focus:border-secondary-container transition-all"
                placeholder={t('scan.codePlaceholder')}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <button
                type="submit"
                disabled={status === 'processing'}
                className="w-full bg-secondary-container text-on-secondary-container py-4 rounded-full font-title-md text-title-md font-bold flex items-center justify-center gap-base active:scale-95 transition-transform duration-150 disabled:opacity-60"
              >
                {t('scan.confirmCode')}
                <Icon name="check_circle" />
              </button>
              {status === 'error' && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full bg-white/10 text-white py-3 rounded-full font-label-md text-label-md active:scale-95 transition-transform"
                >
                  {t('scan.retryCamera')}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
