const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

if (!endpoint || !apiKey) {
  console.warn('[AzureOpenAI] Missing endpoint or api key. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY');
}

type Schema = Record<string, unknown>;

function tryParseJson<T>(text: string): T {
  try { return JSON.parse(text) as T; } catch {}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    const slice = text.slice(first, last + 1);
    return JSON.parse(slice) as T;
  }
  throw new Error('Model did not return valid JSON');
}

export async function azureChatJson<T>(opts: {
  system: string;
  user: string;
  jsonSchema: Schema;
  seed?: number;
  temperature?: number;
  retries?: number;
}): Promise<T> {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const body: any = {
    messages: [
      { role: 'system', content: `${opts.system}\nReturn only valid JSON that strictly matches the schema.` },
      { role: 'user', content: opts.user },
    ],
    seed: opts.seed ?? 7,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'structured_output',
        schema: opts.jsonSchema,
        strict: true,
      },
    },
  };

  const doCall = async (): Promise<T> => {
    const send = async (payload: any) => fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey as string,
      },
      body: JSON.stringify(payload),
    });

    let res = await send(body);
    // Fallback: if response_format unsupported in this deployment, retry without it
    if (!res.ok && res.status === 400) {
      const txt = await res.text().catch(() => '');
      if (/response_format/i.test(txt)) {
        const fallback = { ...body };
        delete (fallback as any).response_format;
        res = await send(fallback);
        if (!res.ok) throw new Error(`Azure OpenAI error ${res.status}: ${txt}`);
      } else {
        throw new Error(`Azure OpenAI error ${res.status}: ${txt}`);
      }
    } else if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Azure OpenAI error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from model');
    return tryParseJson<T>(text);
  };

  const retries = opts.retries ?? 1;
  let lastErr: unknown = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await doCall();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 + 200 * i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Azure call failed');
}

export function validateQuiz(quiz: any): { ok: boolean; reason?: string } {
  try {
    if (!quiz?.questions?.length) return { ok: false, reason: 'no questions' };
    const seenIds = new Set<string>();
    for (const q of quiz.questions) {
      if (!q.id || seenIds.has(q.id)) return { ok: false, reason: 'duplicate question id' };
      seenIds.add(q.id);
      if (!q.question || !Array.isArray(q.choices) || q.choices.length < 3) return { ok: false, reason: 'bad choices' };
      const correct = q.choices.find((c: any) => c.id === q.correctChoiceId);
      if (!correct) return { ok: false, reason: 'no correct choice' };
      const texts = new Set(q.choices.map((c: any) => c.text.trim().toLowerCase()));
      if (texts.size !== q.choices.length) return { ok: false, reason: 'duplicate choices' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'validation error' };
  }
}
