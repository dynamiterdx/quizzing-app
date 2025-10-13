import { NextRequest, NextResponse } from 'next/server';
import { azureChatJson, validateQuiz } from '@/lib/azure';
import { perplexityChatJson } from '@/lib/perplexity';
import { ModelProvider } from '@/types/quiz';

const drillSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'questions'],
  properties: {
    topic: { type: 'string' },
    questions: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
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
            items: { type: 'object', additionalProperties: false, required: ['id', 'text'], properties: { id: { type: 'string' }, text: { type: 'string' } } },
          },
          correctChoiceId: { type: 'string' },
          explanation: { type: 'string' },
          subtopic: { type: 'string' },
          difficulty: { type: 'string', enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'] },
          language: { type: 'string' },
        },
      },
    },
  },
} as const;

export async function POST(req: NextRequest) {
  const { topic, targetSubtopics, targetDifficulty, language, provider, perplexityKey, azureKey }: { topic: string; targetSubtopics: string[]; targetDifficulty: string; language: string; provider?: ModelProvider; perplexityKey?: string; azureKey?: string } = await req.json();
  const modelProvider: ModelProvider = provider === 'perplexity' || provider === 'perplexity-pro' ? provider : 'azure';
  const system = `You are a tutor. Create a short drill quiz focusing on the selected subtopics. Keep clarity high and explanations brief. Exactly one correct answer per question. Use Markdown and LaTeX where helpful in questions, choices, and explanations (math $...$ / $$...$$, code in backticks). Return only JSON.`;
  const user = `Topic: ${topic}. Focus subtopics: ${Array.isArray(targetSubtopics) ? targetSubtopics.join(', ') : ''}. Difficulty: ${targetDifficulty} (levels: beginner, elementary, intermediate, advanced, expert). Language: ${language}. Questions: 4.`;
  try {
    for (let i = 0; i < 3; i++) {
      const quiz = await (modelProvider === 'azure'
        ? azureChatJson<any>({ system, user, jsonSchema: drillSchema as any, retries: 1, apiKey: azureKey })
        : perplexityChatJson<any>({ system, user, jsonSchema: drillSchema as any, retries: 1, model: modelProvider === 'perplexity-pro' ? 'sonar-pro' : 'sonar', apiKey: perplexityKey })
      );
      const v = validateQuiz(quiz);
      if (v.ok) return NextResponse.json(quiz);
    }
    return NextResponse.json({ error: 'Low-quality drill after retries' }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate drill' }, { status: 500 });
  }
}
