import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createSession, getMachines } from './api';
import './App.css';

const STATE = {
  IDLE: 'idle',
  COUNTING: 'counting',
  GENERATING: 'generating',
  DONE: 'done',
};

function App() {
  const [state, setState] = useState(STATE.IDLE);
  const [bottleCount, setBottleCount] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [loadingMachines, setLoadingMachines] = useState(true);

  useEffect(() => {
    getMachines()
      .then(({ machines: list }) => {
        setMachines(list || []);
        if (list && list.length > 0) setSelectedMachineId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingMachines(false));
  }, []);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || null;

  function handleStart() {
    setError('');
    setResult(null);
    setBottleCount('');
    setState(STATE.COUNTING);
  }

  function handleReset() {
    setError('');
    setResult(null);
    setBottleCount('');
    setState(STATE.IDLE);
  }

  async function handleStop() {
    const count = Number(bottleCount);
    if (!Number.isInteger(count) || count <= 0) {
      setError('অনুগ্রহ করে কয়টি বোতল জমা দেওয়া হয়েছে তার সঠিক সংখ্যা লিখুন।');
      return;
    }
    if (!selectedMachineId) {
      setError('অনুগ্রহ করে একটি মেশিন নির্বাচন করুন।');
      return;
    }
    setError('');
    setState(STATE.GENERATING);
    try {
      const data = await createSession(count, selectedMachineId);
      setResult(data);
      setState(STATE.DONE);
    } catch (err) {
      setError(err.response?.data?.message || 'QR কোড তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setState(STATE.COUNTING);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>বোতল জমা কাউন্টার</h1>
        <p className="subtitle">প্রতিটি জমার জন্য একটি ওয়ান-টাইম QR কোড তৈরি হয়</p>

        {/* Machine Selector */}
        <div className="machine-selector">
          <label htmlFor="machineSelect">মেশিন নির্বাচন করুন</label>
          {loadingMachines ? (
            <p className="loading-text">মেশিনের তালিকা লোড হচ্ছে...</p>
          ) : machines.length === 0 ? (
            <p className="no-machine-text">⚠️ কোনো মেশিন পাওয়া যায়নি। অ্যাডমিন প্যানেল থেকে মেশিন যোগ করুন।</p>
          ) : (
            <select
              id="machineSelect"
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              disabled={state !== STATE.IDLE}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.location}
                </option>
              ))}
            </select>
          )}
          {selectedMachine && (
            <div className="machine-info">
              <span className="machine-badge">📍 {selectedMachine.location}</span>
              <span className="machine-badge">
                🗑️ {selectedMachine.currentBottles}/{selectedMachine.capacity} বোতল
                ({Math.round((selectedMachine.currentBottles / selectedMachine.capacity) * 100)}%)
              </span>
            </div>
          )}
        </div>

        {state === STATE.IDLE && (
          <button
            className="btn btn-start"
            onClick={handleStart}
            disabled={!selectedMachineId || loadingMachines}
          >
            ▶ Start
          </button>
        )}

        {(state === STATE.COUNTING || state === STATE.GENERATING) && (
          <div className="counting">
            <label htmlFor="bottleCount">কয়টি বোতল জমা দেওয়া হয়েছে?</label>
            <input
              id="bottleCount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="যেমন: ১০"
              value={bottleCount}
              onChange={(e) => setBottleCount(e.target.value)}
              disabled={state === STATE.GENERATING}
              autoFocus
            />
            <div className="actions">
              <button
                className="btn btn-stop"
                onClick={handleStop}
                disabled={state === STATE.GENERATING}
              >
                {state === STATE.GENERATING ? 'তৈরি হচ্ছে...' : '■ Stop ও QR তৈরি করুন'}
              </button>
              <button className="btn btn-secondary" onClick={handleReset} disabled={state === STATE.GENERATING}>
                বাতিল
              </button>
            </div>
          </div>
        )}

        {state === STATE.DONE && result && (
          <div className="result">
            <p className="result-count">
              <strong>{result.session.bottleCount}</strong> টি বোতলের জন্য QR কোড তৈরি হয়েছে
            </p>
            {result.session.machineName && (
              <p className="result-machine">
                📍 {result.session.machineName} — {result.session.machineLocation}
              </p>
            )}
            <div className="qr-box">
              <QRCodeSVG
                value={JSON.stringify({ type: 'bottle-deposit', token: result.session.token })}
                size={240}
              />
            </div>
            <p className="hint">
              ব্যবহারকারী তার ফোনের ব্রাউজার থেকে এই QR কোডটি স্ক্যান করবেন। প্রতিটি কোড শুধুমাত্র একবার কাজ করবে।
            </p>
            <button className="btn btn-start" onClick={handleReset}>
              নতুন গণনা শুরু করুন
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default App;
