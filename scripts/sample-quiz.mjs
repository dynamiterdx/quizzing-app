// Minimal sample quiz generator using Azure Chat Completions
// Loads env from .env.local if present and prints a structured quiz JSON

import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      const key = m[1];
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(text.slice(first, last + 1));
  }
  throw new Error('Model did not return valid JSON');
}

async function main() {
  loadEnvLocal();
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';
  if (!endpoint || !apiKey) throw new Error('Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY');

  const quizSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['topic', 'difficulty', 'language', 'timed', 'questions'],
    properties: {
      topic: { type: 'string' },
      difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
      language: { type: 'string' },
      timed: { type: 'boolean' },
      durationSeconds: { type: 'integer', minimum: 30 },
      questions: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'question', 'choices', 'correctChoiceId', 'explanation'],
          properties: {
            id: { type: 'string' },
            question: { type: 'string' },
            choices: {
              type: 'array',
              minItems: 3,
              maxItems: 5,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'text'],
                properties: { id: { type: 'string' }, text: { type: 'string' } },
              },
            },
            correctChoiceId: { type: 'string' },
            explanation: { type: 'string' },
            subtopic: { type: 'string' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            language: { type: 'string' },
          },
        },
      },
    },
  };

  const system = 'You are a helpful quiz generator. Create clear multiple-choice questions with exactly one correct answer, age-appropriate, no tricks, no duplicates. Keep explanations brief and helpful. Return only JSON using the provided schema.';
  const settings = { topic: 'Photosynthesis Basics', difficulty: 'beginner', numQuestions: 5, timed: false, language: 'English' };
  const user = `Generate a focused quiz on topic: "${settings.topic}". Difficulty: ${settings.difficulty}. Language: ${settings.language}. Number of questions: ${settings.numQuestions}. Timed: ${settings.timed ? 'yes' : 'no'}. Ensure one unambiguous correct option per question.`;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const body = {
    messages: [
      { role: 'system', content: `${system}\nReturn only valid JSON that strictly matches the schema.\nSchema: ${JSON.stringify(quizSchema)}` },
      { role: 'user', content: user },
    ],
    // No temperature for gpt-5 compatibility
    seed: 7,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'structured_output', schema: quizSchema, strict: true },
    },
  };

  async function send(payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(payload),
    });
    return res;
  }

  let res = await send(body);
  if (!res.ok && res.status === 400) {
    const txt = await res.text();
    if (/response_format/i.test(txt)) {
      const fallbackJson = { ...body, response_format: { type: 'json_object' } };
      res = await send(fallbackJson);
      if (!res.ok) {
        const fallback = { ...body };
        delete fallback.response_format;
        res = await send(fallback);
      }
    } else {
      throw new Error(`Azure error ${res.status}: ${txt}`);
    }
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Azure error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  const parsed = tryParseJson(text);
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch((e) => {
  console.error('[sample-quiz] Failed:', e?.message || e);
  process.exit(1);
});
