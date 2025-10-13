import { NextRequest, NextResponse } from 'next/server';
import { azureChatJson, validateQuiz } from '@/lib/azure';
import { perplexityChatJson } from '@/lib/perplexity';
import { ModelProvider } from '@/types/quiz';

const quizSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'difficulty', 'language', 'timed', 'questions'],
  properties: {
    topic: { type: 'string' },
    difficulty: { type: 'string', enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'] },
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
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
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
  const { topic, difficulty, numQuestions, timed, language, provider, perplexityKey }: { topic: string; difficulty: string; numQuestions: number; timed: boolean; language: string; provider?: ModelProvider; perplexityKey?: string } = await req.json();
  const modelProvider: ModelProvider = provider === 'perplexity' || provider === 'perplexity-pro' ? provider : 'azure';

  const system = `You are a helpful quiz generator. Create clear multiple-choice questions with exactly one correct answer, age-appropriate, no tricks, no duplicates. Use Markdown and LaTeX where helpful in questions, choices, and explanations (e.g., math with $...$ / $$...$$, code/SQL in backticks). Keep explanations brief. Return only JSON using the provided schema.`;
  const user = `Generate a focused quiz on topic: "${topic}". Difficulty: ${difficulty} (levels: beginner, elementary, intermediate, advanced, expert). Language: ${language}. Number of questions: ${numQuestions}. Timed: ${timed ? 'yes' : 'no'}. Ensure one unambiguous correct option per question. Use Markdown/LaTeX where appropriate.`;

  // Attempt up to 2 retries plus validation loop
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (modelProvider === 'azure') {
        const quiz = await azureChatJson<any>({
          system,
          user,
          jsonSchema: quizSchema as any,
          retries: 1,
        });
        const v = validateQuiz(quiz);
        if (v.ok) return NextResponse.json(quiz);
      } else {
        const quiz = await perplexityChatJson<any>({
          system,
          user,
          jsonSchema: quizSchema as any,
          retries: 1,
          model: modelProvider === 'perplexity-pro' ? 'sonar-pro' : 'sonar',
          apiKey: perplexityKey,
        });
        const v = validateQuiz(quiz);
        if (v.ok) return NextResponse.json(quiz);
      }
    } catch (e: any) {
      if (attempt === 2) return NextResponse.json({ error: e?.message || 'Failed to generate quiz' }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Could not get a high-quality quiz after retries' }, { status: 502 });
}
