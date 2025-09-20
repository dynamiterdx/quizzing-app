"use client";
import { useState } from 'react';

export default function SamplePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/sample');
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || 'Request failed');
      setResult(json.data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="card">
      <h2>API Sample Test</h2>
      <p className="muted">Calls Azure Chat Completions with a tiny structured schema.</p>
      <div className="mt-2">
        <button onClick={run} disabled={loading}>{loading ? 'Calling…' : 'Run Sample Call'}</button>
      </div>
      {error && <div className="mt-2 warn">{error}</div>}
      {result && (
        <div className="mt-2 card">
          <div><strong>Greeting:</strong> {result.greeting}</div>
          <div className="mt-1"><strong>Tips:</strong>
            <ul>
              {result.tips?.map((t: string, i: number) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

