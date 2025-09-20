import { NextRequest, NextResponse } from 'next/server';
import { azureResponseJson } from '@/lib/azure';

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
  const { topic, language } = await req.json();
  const system = `You are a tutor. Build a small, practical subtopic map (2–3 levels max) covering the essential parts of the given topic. Keep names concise and intuitive. Return only JSON.`;
  const user = `Topic: ${topic}. Language: ${language}. Keep the map small and useful for practice.`;
  try {
    const data = await azureResponseJson<any>({ system, user, jsonSchema: mapSchema as any, temperature: 0.5, retries: 1 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate subtopics' }, { status: 500 });
  }
}

