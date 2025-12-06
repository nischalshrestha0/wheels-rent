import { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function TestDB() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setStatus('loading');
    setData(null);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/user`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setData(json);
      setStatus('success');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
    }
  };

  return (
    <div style={{ marginTop: 24, textAlign: 'center' }}>
      <h2>Backend DB Test</h2>
      <p>Backend: <code>{BACKEND_URL}</code></p>
      <button onClick={runTest} style={{ padding: '0.6em 1.2em', borderRadius: 8 }}>
        Test DB / API
      </button>

      <div style={{ marginTop: 16 }}>
        {status === 'idle' && <p>Click the button to test connection.</p>}
        {status === 'loading' && <p>Testing…</p>}
        {status === 'success' && (
          <div style={{ textAlign: 'left', display: 'inline-block', maxWidth: 800 }}>
            <p style={{ color: 'green' }}>Success — response:</p>
            <pre style={{ background: '#111', color: '#eee', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p style={{ color: 'crimson' }}>Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
