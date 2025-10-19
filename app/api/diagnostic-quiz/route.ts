import { NextRequest, NextResponse } from 'next/server';
import { azureChatJson, validateQuiz } from '@/lib/azure';
import { perplexityChatJson } from '@/lib/perplexity';
import { ModelProvider } from '@/types/quiz';

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
          difficulty: { type: 'string', enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'] },
          language: { type: 'string' },
        },
      },
    },
  },
} as const;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const topic: string = body.topic;
  const rawSubtopics: Array<string | { name: string; weight?: string }> = body.subtopics || [];
  const language: string = body.language;
  const provider: ModelProvider | undefined = body.provider;
  const perplexityKey: string | undefined = body.perplexityKey;
  const azureKey: string | undefined = body.azureKey;
  const questionCount: number | undefined = body.questionCount;
  const modelProvider: ModelProvider = provider === 'perplexity' || provider === 'perplexity-pro' ? provider : 'azure';
  const count = Math.max(4, Math.min(questionCount ?? 6, 10));
  const normalizedSubtopics = rawSubtopics.map((entry) => {
    if (typeof entry === 'string') return { name: entry, weight: 'med' };
    return { name: entry?.name ?? 'General', weight: entry?.weight ?? 'med' };
  });
  const subtopicList = normalizedSubtopics.map((item) => `${item.name} (priority: ${item.weight})`).join(', ');
  const system = `You are a tutor. Create a short diagnostic multiple-choice quiz sampling across given subtopics. Exactly one correct answer per question. Use Markdown and LaTeX where useful for clarity in questions, choices, and explanations (formulas $...$ / $$...$$, code in backticks). Keep questions clear, age-appropriate, and explanations brief. Return only JSON.`;
  const user = `Topic: ${topic}. Subtopics to sample with priorities: ${subtopicList}. Language: ${language}. Number of questions: ${count}. Mix beginner through advanced difficulty where sensible, giving slightly more coverage to items marked high. Only one unambiguous correct option per question.`;
  try {
    for (let i = 0; i < 3; i++) {
      const quiz = await (modelProvider === 'azure'
        ? azureChatJson<any>({ system, user, jsonSchema: diagSchema as any, retries: 1, apiKey: azureKey })
        : perplexityChatJson<any>({ system, user, jsonSchema: diagSchema as any, retries: 1, model: modelProvider === 'perplexity-pro' ? 'sonar-pro' : 'sonar', apiKey: perplexityKey })
      );
      const v = validateQuiz(quiz);
      if (v.ok) return NextResponse.json(quiz);
    }
    return NextResponse.json({ error: 'Low-quality diagnostic after retries' }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate diagnostic' }, { status: 500 });
  }
}
