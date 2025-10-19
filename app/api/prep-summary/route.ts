import { NextRequest, NextResponse } from 'next/server';
import { azureChatJson } from '@/lib/azure';
import { perplexityChatJson } from '@/lib/perplexity';
import { ModelProvider, SubtopicScore } from '@/types/quiz';

const summarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'headline', 'encouragement', 'pointers'],
  properties: {
    topic: { type: 'string' },
    headline: { type: 'string' },
    encouragement: { type: 'string' },
    pointers: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['subtopic', 'tip'],
        properties: {
          subtopic: { type: 'string' },
          tip: { type: 'string' },
        },
      },
    },
  },
} as const;

export async function POST(req: NextRequest) {
  const {
    topic,
    language,
    scores,
    provider,
    perplexityKey,
    azureKey,
  }: {
    topic: string;
    language: string;
    scores: SubtopicScore[];
    provider?: ModelProvider;
    perplexityKey?: string;
    azureKey?: string;
  } = await req.json();

  const modelProvider: ModelProvider = provider === 'perplexity' || provider === 'perplexity-pro' ? provider : 'azure';
  const scoreLines = scores
    .map((s) => `${s.subtopic}: initial ${s.initialScore} -> latest ${s.latestScore}`)
    .join('; ');
  const system = `You are a study coach. Based on the learner's subtopic scores, craft a short summary headline, an encouraging one-liner, and 3 concise tips (each <= 14 words) telling them what to focus on next. Return only JSON matching the schema.`;
  const user = `Topic: ${topic}. Language: ${language}. Score trajectory: ${scoreLines}. Identify the biggest gaps and momentum changes, then output tips in the requested structure.`;

  try {
    const data = await (modelProvider === 'azure'
      ? azureChatJson<any>({ system, user, jsonSchema: summarySchema as any, retries: 1, apiKey: azureKey })
      : perplexityChatJson<any>({
        system,
        user,
        jsonSchema: summarySchema as any,
        retries: 1,
        model: modelProvider === 'perplexity-pro' ? 'sonar-pro' : 'sonar',
        apiKey: perplexityKey,
      })
    );
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to craft prep summary' }, { status: 500 });
  }
}
