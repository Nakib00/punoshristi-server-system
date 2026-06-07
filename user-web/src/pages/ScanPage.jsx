import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { redeemQrToken } from '../api';
import { useAuth } from '../AuthContext';

const READER_ELEMENT_ID = 'qr-reader';

export default function ScanPage() {
  const navigate = useNavigate();
  const { applyBottleUpdate } = useAuth();
  const [status, setStatus] = useState('scanning'); // scanning | processing | success | error
  const [message, setMessage] = useState('');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let scanner;
    try {
      scanner = new Html5Qrcode(READER_ELEMENT_ID);
    } catch (err) {
      setStatus('error');
      setMessage(`ক্যামেরা মডিউল চালু করা যায়নি: ${err?.message || err}`);
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
        () => {
          /* ignore per-frame scan errors */
        }
      )
      .catch(() => {
        setStatus('error');
        setMessage('ক্যামেরা চালু করা যায়নি। অনুগ্রহ করে ক্যামেরা ব্যবহারের অনুমতি দিন এবং আবার চেষ্টা করুন।');
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

  async function handleScanned(decodedText) {
    setStatus('processing');
    await stopScannerAsync();

    let token = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && typeof parsed.token === 'string') {
        token = parsed.token;
      }
    } catch {
      // not JSON, treat decodedText as the raw token
    }

    try {
      const data = await redeemQrToken(token);
      applyBottleUpdate(data.bottleCount);
      setStatus('success');
      setMessage(`${data.addedBottles} টি বোতল যোগ হয়েছে! আপনার মোট সংখ্যা এখন ${data.bottleCount}।`);
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'QR কোড যাচাই করা যায়নি। আবার চেষ্টা করুন।');
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
          setMessage('ক্যামেরা চালু করা যায়নি। আবার চেষ্টা করুন।');
        });
    }, 100);
  }

  return (
    <div className="scan-page">
      <h1>QR কোড স্ক্যান করুন</h1>

      <div className="scanner-frame">
        <div id={READER_ELEMENT_ID} className="qr-reader" />
        {status === 'processing' && (
          <div className="scanner-overlay">
            <p>যাচাই করা হচ্ছে...</p>
          </div>
        )}
      </div>

      {status === 'success' && (
        <div className="result-card result-success">
          <p>✅ {message}</p>
          <div className="result-actions">
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>ড্যাশবোর্ডে ফিরে যান</button>
            <button className="btn-ghost" onClick={handleRetry}>আরেকটি QR স্ক্যান করুন</button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="result-card result-error">
          <p>❌ {message}</p>
          <div className="result-actions">
            <button className="btn-primary" onClick={handleRetry}>আবার চেষ্টা করুন</button>
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>ড্যাশবোর্ডে ফিরে যান</button>
          </div>
        </div>
      )}

      {status === 'scanning' && (
        <p className="hint">QR কোডটি ক্যামেরার সামনে ধরুন — স্বয়ংক্রিয়ভাবে স্ক্যান হয়ে যাবে।</p>
      )}
    </div>
  );
}
