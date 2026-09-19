import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MACHINE_ID, createSession, fetchAds, getMachines } from './api';
import { useGpioBridge } from './useGpioBridge';
import AdCarousel from './AdCarousel';
import SetupModal from './SetupModal';
import './App.css';

const STATE = {
  IDLE: 'idle',
  COUNTING: 'counting',
  GENERATING: 'generating',
  QR: 'qr',
};

const QR_DISPLAY_SECONDS = 30;
const COUNTING_IDLE_TIMEOUT_MS = 2 * 60 * 1000; // auto-cancel if nobody presses Stop
const ADS_REFRESH_MS = 3 * 60 * 1000; // re-check schedule/targeting periodically

function App() {
  const [state, setState] = useState(STATE.IDLE);
  const [bottleCount, setBottleCount] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [ads, setAds] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState(MACHINE_ID || '');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_DISPLAY_SECONDS);
  const [showSetup, setShowSetup] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const countingTimeoutRef = useRef(null);
  const bottleCountRef = useRef(0);

  useEffect(() => {
    // Always fetch the machine list — even when MACHINE_ID is fixed — so
    // the status badge and the setup screen's "edit existing machine" mode
    // have real data to show, not just an id.
    getMachines()
      .then(({ machines: list }) => {
        setMachines(list || []);
        if (!MACHINE_ID && list && list.length > 0) setSelectedMachineId(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Ads are targeted per-machine and scheduled by date/day/time (see admin
  // panel), so: refetch whenever the machine changes, and periodically
  // while idle so a schedule boundary (e.g. an ad's end time) takes effect
  // without needing a manual reload.
  useEffect(() => {
    function loadAds() {
      fetchAds(selectedMachineId)
        .then(({ ads: list }) => setAds(list || []))
        .catch(() => {});
    }
    loadAds();
    const interval = setInterval(loadAds, ADS_REFRESH_MS);
    return () => clearInterval(interval);
  }, [selectedMachineId]);

  const resetToIdle = useCallback(() => {
    clearTimeout(countingTimeoutRef.current);
    bottleCountRef.current = 0;
    setState(STATE.IDLE);
    setBottleCount(0);
    setError('');
    setResult(null);
  }, []);

  const handleStart = useCallback(() => {
    if (stateRef.current !== STATE.IDLE) return;
    if (!selectedMachineId) {
      setError('কোনো মেশিন নির্বাচিত নেই। অ্যাডমিন প্যানেল থেকে মেশিন যোগ করুন।');
      return;
    }
    setError('');
    bottleCountRef.current = 0;
    setBottleCount(0);
    setState(STATE.COUNTING);
    clearTimeout(countingTimeoutRef.current);
    countingTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === STATE.COUNTING) resetToIdle();
    }, COUNTING_IDLE_TIMEOUT_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMachineId, resetToIdle]);

  const handleBottle = useCallback(() => {
    if (stateRef.current !== STATE.COUNTING) return;
    bottleCountRef.current += 1;
    setBottleCount(bottleCountRef.current);
  }, []);

  const handleStop = useCallback(async () => {
    if (stateRef.current !== STATE.COUNTING) return;
    clearTimeout(countingTimeoutRef.current);

    const count = bottleCountRef.current;
    if (count <= 0) {
      resetToIdle();
      return;
    }
    setState(STATE.GENERATING);
    try {
      const data = await createSession(count, selectedMachineId);
      setResult(data);
      setQrSecondsLeft(QR_DISPLAY_SECONDS);
      setState(STATE.QR);
    } catch (err) {
      setError(err.response?.data?.message || 'QR কোড তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setState(STATE.IDLE);
    }
  }, [resetToIdle, selectedMachineId]);

  const { connected: hardwareConnected } = useGpioBridge({
    onStart: handleStart,
    onStop: handleStop,
    onBottle: handleBottle,
  });

  // Auto-return to the ad carousel after the QR has been up for a while.
  useEffect(() => {
    if (state !== STATE.QR) return undefined;
    if (qrSecondsLeft <= 0) {
      resetToIdle();
      return undefined;
    }
    const t = setTimeout(() => setQrSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [state, qrSecondsLeft, resetToIdle]);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || null;

  return (
    <div className="kiosk">
      <div className="kiosk-status-bar">
        <span className={`hw-badge ${hardwareConnected ? 'hw-connected' : 'hw-manual'}`}>
          {hardwareConnected ? '🟢 হার্ডওয়্যার সংযুক্ত' : '⚪ ম্যানুয়াল মোড'}
        </span>
        {!MACHINE_ID && machines.length > 0 && state === STATE.IDLE && (
          <select
            className="machine-picker"
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.location}
              </option>
            ))}
          </select>
        )}
        <div className="status-bar-right">
          {selectedMachine && (
            <span className="machine-name-badge">
              📍 {selectedMachine.name} — {selectedMachine.location}
            </span>
          )}
          {state === STATE.IDLE && (
            <button className="setup-gear-btn" onClick={() => setShowSetup(true)} title="মেশিন সেটআপ">
              ⚙
            </button>
          )}
        </div>
      </div>

      {showSetup && (
        <SetupModal
          machine={selectedMachine}
          onClose={() => setShowSetup(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      {state === STATE.IDLE && (
        <div className="kiosk-idle">
          <AdCarousel ads={ads} />
          <button className="btn-start-overlay" onClick={handleStart} disabled={!selectedMachineId}>
            ▶ Start
          </button>
          {error && <p className="kiosk-error">{error}</p>}
        </div>
      )}

      {state === STATE.COUNTING && (
        <div className="kiosk-counting">
          <p className="counting-label">বোতল জমা দিন...</p>
          <p className="counting-number">{bottleCount}</p>
          <p className="counting-sub">টি বোতল গণনা হয়েছে</p>
          <div className="counting-actions">
            <button className="btn btn-manual" onClick={handleBottle}>
              +1 (ম্যানুয়াল)
            </button>
            <button className="btn btn-stop" onClick={handleStop}>
              ■ Stop ও QR তৈরি করুন
            </button>
          </div>
        </div>
      )}

      {state === STATE.GENERATING && (
        <div className="kiosk-generating">
          <p>QR কোড তৈরি হচ্ছে...</p>
        </div>
      )}

      {state === STATE.QR && result && (
        <div className="kiosk-qr">
          <p className="result-count">
            <strong>{result.session.bottleCount}</strong> টি বোতলের জন্য QR কোড তৈরি হয়েছে
          </p>
          <div className="qr-box">
            <QRCodeSVG value={JSON.stringify({ type: 'bottle-deposit', token: result.session.token })} size={280} />
          </div>
          <p className="hint">আপনার ফোনের ব্রাউজার দিয়ে এই QR কোডটি স্ক্যান করুন — পয়েন্ট যোগ হয়ে যাবে।</p>
          <p className="qr-countdown">{qrSecondsLeft}s পর বিজ্ঞাপনে ফিরে যাবে</p>
          <button className="btn btn-secondary" onClick={resetToIdle}>
            ✓ শেষ — এখনই বিজ্ঞাপনে ফিরুন
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
