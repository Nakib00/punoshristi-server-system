import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createSession } from './api';
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

    setError('');
    setState(STATE.GENERATING);
    try {
      const data = await createSession(count);
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

        {state === STATE.IDLE && (
          <button className="btn btn-start" onClick={handleStart}>
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
              placeholder="যেমন: 10"
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
            <div className="qr-box">
              <QRCodeSVG
                value={JSON.stringify({ type: 'bottle-deposit', token: result.session.token })}
                size={240}
              />
            </div>
            <p className="hint">
              মোবাইল অ্যাপ দিয়ে এই কোডটি স্ক্যান করুন। প্রতিটি কোড শুধুমাত্র একবার ব্যবহার করা যাবে।
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
