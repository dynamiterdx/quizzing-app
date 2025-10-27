"use client";
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ModelProvider } from '@/types/quiz';
import { useLLMSettings } from '@/lib/llm-settings';

const providerOptions: { value: ModelProvider; label: string; help: string }[] = [
  { value: 'perplexity', label: 'Perplexity Sonar', help: 'Requires a Perplexity API key.' },
  { value: 'perplexity-pro', label: 'Perplexity Sonar Pro', help: 'Higher quality Sonar model. Requires API key.' },
];

function LLMSettingsForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { settings, setSettings } = useLLMSettings();
  const [provider, setProvider] = useState<ModelProvider>(settings.provider);
  const [perplexityKey, setPerplexityKey] = useState(settings.perplexityKey ?? '');
  const [azureKey, setAzureKey] = useState(settings.azureKey ?? '');
  const [error, setError] = useState<string | null>(null);
  const [envLoading, setEnvLoading] = useState(false);

  const [envKeys, setEnvKeys] = useState<{ azureKey?: string | null; perplexityKey?: string | null } | null>(null);

  const fetchEnvKeys = async () => {
    try {
      setEnvLoading(true);
      const res = await fetch('/api/llm-env');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEnvKeys({ azureKey: data.azureKey, perplexityKey: data.perplexityKey });
      return data;
    } catch (e: any) {
      setError(e?.message || 'Failed to read environment keys.');
      return null;
    } finally {
      setEnvLoading(false);
    }
  };

  const applyEnvKey = async (type: 'azure' | 'perplexity') => {
    const keys = envKeys || (await fetchEnvKeys());
    if (!keys) return;
    if (type === 'azure') {
      if (keys.azureKey) {
        setAzureKey(keys.azureKey);
        setError(null);
      } else {
        setError('No Azure API key found in environment.');
      }
    } else {
      if (keys.perplexityKey) {
        setPerplexityKey(keys.perplexityKey);
        setError(null);
      } else {
        setError('No Perplexity API key found in environment.');
      }
    }
  };

  useEffect(() => {
    setProvider(settings.provider);
    setPerplexityKey(settings.perplexityKey ?? '');
    setAzureKey(settings.azureKey ?? '');
  }, [settings]);

  const needsPerplexityKey = provider === 'perplexity' || provider === 'perplexity-pro';
  const needsAzureKey = false;

  const next = params.get('next') || '/';

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsPerplexityKey && !perplexityKey.trim()) {
      setError('Perplexity API key is required for the selected model.');
      return;
    }
    // Azure input hidden; ignore azure validation for now.
    setError(null);
    setSettings({
      provider,
      perplexityKey: needsPerplexityKey ? perplexityKey.trim() : settings.perplexityKey,
      azureKey: needsAzureKey ? azureKey.trim() : settings.azureKey,
    });
    router.push(next);
  };

  return (
    <div className="card">
      <h2>Choose Your AI Model</h2>
      <p className="muted">Pick the provider and model you want to use for generating quizzes. You can change this anytime.</p>
      <form className="mt-3" onSubmit={onSubmit}>
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="muted" style={{ marginBottom: 12 }}>Provider & Model</legend>
          <div className="answers" role="radiogroup" aria-label="Model selection">
            {providerOptions.map((opt) => (
              <label key={opt.value} className={provider === opt.value ? 'selected' : ''}>
                <input
                  type="radio"
                  name="provider"
                  value={opt.value}
                  checked={provider === opt.value}
                  onChange={() => setProvider(opt.value)}
                />
                <div className="ans-text">
                  <strong>{opt.label}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>{opt.help}</div>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {needsPerplexityKey && (
          <div className="mt-3">
            <label htmlFor="perplexityKey">Perplexity API Key</label>
            <input
              id="perplexityKey"
              type="password"
              placeholder="pplx-..."
              value={perplexityKey}
              onChange={(e) => setPerplexityKey(e.target.value)}
            />
            <div className="mt-1 flex">
              <button type="button" className="btn btn-outline" onClick={() => applyEnvKey('perplexity')} disabled={envLoading}>Use environment key</button>
            </div>
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: 6 }}>
              Key is stored in session storage only and sent to the server for each request.
            </p>
          </div>
        )}

        {error && <div className="mt-2 bad">{error}</div>}

        <div className="mt-3 flex">
          <button type="submit">Save & Continue</button>
          <span className="muted">Next: {next}</span>
        </div>
      </form>
    </div>
  );
}

export default function LLMSettingsPage() {
  return (
    <Suspense fallback={<div className="card"><p className="muted">Loading settings…</p></div>}>
      <LLMSettingsForm />
    </Suspense>
  );
}
