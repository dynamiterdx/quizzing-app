"use client";
import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ModelProvider } from '@/types/quiz';
import { useLLMSettings } from '@/lib/llm-settings';

const providerOptions: { value: ModelProvider; label: string; help: string }[] = [
  { value: 'azure', label: 'Azure OpenAI', help: 'Uses your server environment credentials.' },
  { value: 'perplexity', label: 'Perplexity Sonar', help: 'Requires a Perplexity API key.' },
  { value: 'perplexity-pro', label: 'Perplexity Sonar Pro', help: 'Higher quality Sonar model. Requires API key.' },
];

export default function LLMSettingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { settings, setSettings } = useLLMSettings();
  const [provider, setProvider] = useState<ModelProvider>(settings.provider);
  const [perplexityKey, setPerplexityKey] = useState(settings.perplexityKey ?? '');
  const [azureKey, setAzureKey] = useState(settings.azureKey ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProvider(settings.provider);
    setPerplexityKey(settings.perplexityKey ?? '');
    setAzureKey(settings.azureKey ?? '');
  }, [settings]);

  const needsPerplexityKey = provider === 'perplexity' || provider === 'perplexity-pro';
  const needsAzureKey = provider === 'azure';

  const next = params.get('next') || '/';

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsPerplexityKey && !perplexityKey.trim()) {
      setError('Perplexity API key is required for the selected model.');
      return;
    }
    if (needsAzureKey && !azureKey.trim()) {
      setError('Azure OpenAI API key is required.');
      return;
    }
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

        {needsAzureKey && (
          <div className="mt-3">
            <label htmlFor="azureKey">Azure OpenAI API Key</label>
            <input
              id="azureKey"
              type="password"
              placeholder="Azure api-key"
              value={azureKey}
              onChange={(e) => setAzureKey(e.target.value)}
            />
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: 6 }}>
              Used for calls to your Azure OpenAI deployment. Stored in session storage only.
            </p>
          </div>
        )}

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
