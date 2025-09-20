import { NextRequest, NextResponse } from 'next/server';
import { azureChatJson } from '@/lib/azure';

const sampleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['greeting', 'tips'],
  properties: {
    greeting: { type: 'string' },
    tips: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' },
    },
  },
} as const;

export async function GET(_req: NextRequest) {
  const system = 'You are a friendly assistant for a quiz app. Return only JSON that matches the schema.';
  const user = 'Produce a short greeting and three short tips for effective practice, each 5 words or fewer.';
  try {
    const data = await azureChatJson<{ greeting: string; tips: string[] }>({
      system,
      user,
      jsonSchema: sampleSchema as any,
      temperature: 0.4,
      retries: 1,
    });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Sample call failed' }, { status: 500 });
  }
}

