import { NextRequest, NextResponse } from 'next/server';
import { azureResponseJson, validateQuiz } from '@/lib/azure';

const diagSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'questions'],
  properties: {
    topic: { type: 'string' },
    questions: {
      type: 'array',
      minItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'question', 'choices', 'correctChoiceId', 'explanation', 'subtopic', 'difficulty'],
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
} as const;

export async function POST(req: NextRequest) {
  const { topic, subtopics, language } = await req.json();
  const system = `You are a tutor. Create a short diagnostic multiple-choice quiz sampling across given subtopics. Exactly one correct answer per question. Keep questions clear and explanations brief. Return only JSON.`;
  const user = `Topic: ${topic}. Subtopics to sample: ${Array.isArray(subtopics) ? subtopics.join(', ') : ''}. Language: ${language}. Number of questions: 6.`;
  try {
    for (let i = 0; i < 3; i++) {
      const quiz = await azureResponseJson<any>({ system, user, jsonSchema: diagSchema as any, temperature: 0.6, retries: 1 });
      const v = validateQuiz(quiz);
      if (v.ok) return NextResponse.json(quiz);
    }
    return NextResponse.json({ error: 'Low-quality diagnostic after retries' }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate diagnostic' }, { status: 500 });
  }
}

