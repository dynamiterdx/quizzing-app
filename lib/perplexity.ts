const perplexityEndpoint = 'https://api.perplexity.ai/chat/completions';
const perplexityKey = process.env.PERPLEXITY_API_KEY;

if (!perplexityKey) {
  console.warn('[Perplexity] Missing PERPLEXITY_API_KEY. Set it to enable sonar model.');
}

type Schema = Record<string, unknown>;

function tryParseJson<T>(text: string): T {
  try { return JSON.parse(text) as T; } catch {}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(text.slice(first, last + 1)) as T;
  }
  throw new Error('Model did not return valid JSON');
}

export async function perplexityChatJson<T>({
  system,
  user,
  jsonSchema,
  retries = 1,
  model = 'sonar',
}: {
  system: string;
  user: string;
  jsonSchema: Schema;
  retries?: number;
  model?: 'sonar' | 'sonar-pro';
}): Promise<T> {
  if (!perplexityKey) throw new Error('PERPLEXITY_API_KEY not configured');

  const body = {
    model,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `${system}\nReturn only valid JSON that matches the schema.\nSchema: ${JSON.stringify(jsonSchema)}`,
      },
      { role: 'user', content: `${user}\nRespond strictly with JSON.` },
    ],
  };

  const doCall = async (): Promise<T> => {
    const res = await fetch(perplexityEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Perplexity error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Perplexity');
    return tryParseJson<T>(text);
  };

  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await doCall();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 + i * 200));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Perplexity call failed');
}
