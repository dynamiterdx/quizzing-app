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
          description: { type: 'string' },
          children: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'name'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                children: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id', 'name'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
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
  const {
    topic,
    language,
    provider,
    perplexityKey,
    azureKey,
    compact,
  }: {
    topic: string;
    language: string;
    provider?: ModelProvider;
    perplexityKey?: string;
    azureKey?: string;
    compact?: boolean;
  } = await req.json();
  const modelProvider: ModelProvider = provider === 'perplexity' || provider === 'perplexity-pro' ? provider : 'azure';
  const system = `You are a tutor. Build a concise subtopic map (maximum 2 levels deep) that helps a learner plan study sessions. Each node must include a short description (12 words or fewer) explaining what to cover. Return only JSON.`;
  const sizeHint = compact ? 'Aim for the 3–4 most essential subtopics with no children unless critical.' : 'Include the 4–6 top subtopics, and children only when it clarifies the arc.';
  const user = `Topic: ${topic}. Language: ${language}. ${sizeHint}`;
  try {
    const data = await (modelProvider === 'azure'
      ? azureChatJson<any>({ system, user, jsonSchema: mapSchema as any, retries: 1, apiKey: azureKey })
      : perplexityChatJson<any>({ system, user, jsonSchema: mapSchema as any, retries: 1, model: modelProvider === 'perplexity-pro' ? 'sonar-pro' : 'sonar', apiKey: perplexityKey })
    );
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate subtopics' }, { status: 500 });
  }
}
