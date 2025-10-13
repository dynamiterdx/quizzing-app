import { NextRequest, NextResponse } from 'next/server';
import { azureChatJson } from '@/lib/azure';
import { perplexityChatJson } from '@/lib/perplexity';
import { ModelProvider } from '@/types/quiz';

const mapSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'subtopics'],
  properties: {
    topic: { type: 'string' },
    subtopics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          children: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                children: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id', 'name'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function POST(req: NextRequest) {
  const { topic, language, provider, perplexityKey }: { topic: string; language: string; provider?: ModelProvider; perplexityKey?: string } = await req.json();
  const modelProvider: ModelProvider = provider === 'perplexity' || provider === 'perplexity-pro' ? provider : 'azure';
  const system = `You are a tutor. Build a small, practical subtopic map (2–3 levels max) covering the essential parts of the given topic. Keep names concise and intuitive. Return only JSON.`;
  const user = `Topic: ${topic}. Language: ${language}. Keep the map small and useful for practice.`;
  try {
    const data = await (modelProvider === 'azure'
      ? azureChatJson<any>({ system, user, jsonSchema: mapSchema as any, retries: 1 })
      : perplexityChatJson<any>({ system, user, jsonSchema: mapSchema as any, retries: 1, model: modelProvider === 'perplexity-pro' ? 'sonar-pro' : 'sonar', apiKey: perplexityKey })
    );
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate subtopics' }, { status: 500 });
  }
}
