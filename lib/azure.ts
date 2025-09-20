import { NextRequest } from 'next/server';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

if (!endpoint || !apiKey) {
  console.warn('[AzureOpenAI] Missing endpoint or api key. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY');
}

type Schema = Record<string, unknown>;

export async function azureResponseJson<T>(opts: {
  system: string;
  user: string;
  jsonSchema: Schema;
  seed?: number;
  temperature?: number;
  retries?: number;
}): Promise<T> {
  const url = `${endpoint}/openai/responses?api-version=${apiVersion}`;
  const body = {
    model: deployment,
    input: [
      { role: 'system', content: [{ type: 'text', text: opts.system }] },
      { role: 'user', content: [{ type: 'text', text: opts.user }] },
    ],
    temperature: opts.temperature ?? 0.7,
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
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey as string,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Azure OpenAI error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    // Responses API returns output[0].content[0].text when using json_schema
    const text = data?.output?.[0]?.content?.[0]?.text ?? data?.output_text;
    if (!text) throw new Error('Empty response from model');
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new Error('Model did not return valid JSON');
    }
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

