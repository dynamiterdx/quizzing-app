"use client";
import { useCallback, useMemo, useState, useEffect } from 'react';
import { QuizSet, QuizQuestion } from '@/types/quiz';
import { QuizRunner } from '@/components/QuizRunner';
import { ErrorNotice } from '@/components/ErrorNotice';
import { useLLMSettings } from '@/lib/llm-settings';
import { useRouter } from 'next/navigation';
import { LoadingQuiz } from '@/components/LoadingQuiz';
import { LANGUAGE_OPTIONS, getLanguageLabel } from '@/lib/languages';

export default function TargetedPage() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert'>('beginner');
  const [numQuestions, setNumQuestions] = useState(6);
  const [timed, setTimed] = useState(false);
  const [language, setLanguage] = useState('en');
  const { settings, isConfigured } = useLLMSettings();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizSet | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      router.replace('/llm-settings?next=/targeted');
    }
  }, [isConfigured, router]);

  const provider = settings.provider;
  const perplexityKey = settings.perplexityKey;
  const azureKey = settings.azureKey;

  const canGenerate = topic.trim().length > 2 && numQuestions >= 3 && numQuestions <= 15 && isConfigured;
  const languageLabel = useMemo(() => getLanguageLabel(language), [language]);

  const formatError = useCallback((raw: string, fallback: string) => {
    let text = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error) text = String(parsed.error);
    } catch {
      // raw was not JSON; keep original string
    }
    if (/429/.test(text)) return `Rate limited. Please wait a few seconds and try again.\n\nDetails: ${text}`;
    if (/401/.test(text) || /api key/i.test(text)) {
      return `Check your Azure OpenAI API key and endpoint in LLM Settings, then try again.\n\nDetails: ${text}`;
    }
    if (/deployment/i.test(text) || /404/.test(text)) {
      return `Verify your Azure deployment name and API version match the values in .env.local.\n\nDetails: ${text}`;
    }
    return `${fallback}\n\nDetails: ${text}`;
  }, []);

  const generateQuiz = useCallback(async () => {
    setLoading(true); setError(null); setQuiz(null);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, numQuestions, timed, language: languageLabel, provider, perplexityKey, azureKey }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }
      const q = await res.json();
      const durationSeconds = timed ? Math.max(45, Math.round(numQuestions * 45)) : undefined;
      setQuiz({ ...q, durationSeconds, language: languageLabel });
    } catch (e: any) {
      const raw = e?.message || 'Failed to generate quiz.';
      setError(formatError(raw, 'Error generating quiz. Please retry.'));
    } finally { setLoading(false); }
  }, [topic, difficulty, numQuestions, timed, language, provider, perplexityKey, azureKey, formatError]);

  const practiceMore = useCallback(async (missed: QuizQuestion[]) => {
    if (!missed.length) return;
    setLoading(true); setError(null);
    try {
      const missedSubtopics = Array.from(new Set(missed.map((m) => m.subtopic).filter(Boolean))) as string[];
      const res = await fetch('/api/drill-quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetSubtopics: missedSubtopics, targetDifficulty: difficulty, language: languageLabel, provider, perplexityKey, azureKey }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }
      const q = await res.json();
      const durationSeconds = timed ? Math.max(45, Math.round((q?.questions?.length || 4) * 45)) : undefined;
      setQuiz({ topic, difficulty, language: languageLabel, timed, durationSeconds, questions: q.questions });
    } catch (e: any) {
      const raw = e?.message || 'Failed to generate drill questions.';
      setError(formatError(raw, 'Could not generate follow-up questions. Please retry.'));
    } finally { setLoading(false); }
  }, [topic, difficulty, language, timed, provider, perplexityKey, azureKey, formatError]);

  return (
    <div className="card">
      <h2>Targeted Quiz</h2>
      <p className="muted">Type a topic and start practicing quickly. One correct answer per question, clear explanations.</p>

      <div className="mt-2 row cols-2">
        <div>
          <label htmlFor="topic">Topic</label>
          <input id="topic" placeholder="e.g., Binomial Theorem" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <div>
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
            <option value="beginner">Beginner</option>
            <option value="elementary">Elementary</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div>
          <label htmlFor="count">Number of questions</label>
          <input id="count" type="number" min={3} max={15} value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value || '0', 10))} />
        </div>
        <div>
          <label htmlFor="language">Language</label>
          <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2 flex">
        <label className="flex" htmlFor="timed">
          <input id="timed" type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Timed
        </label>
        <button onClick={generateQuiz} disabled={!canGenerate || loading}>{loading ? 'Generating…' : 'Generate quiz'}</button>
        <button type="button" className="btn btn-outline" onClick={() => router.push('/llm-settings?next=/targeted')}>Change model</button>
      </div>

      {error && (
        <div className="mt-3"><ErrorNotice message={error} retry={generateQuiz} /></div>
      )}

      {loading && <LoadingQuiz />}
      {quiz && !loading && <QuizRunner quiz={quiz} onPracticeMore={practiceMore} />}
      <p className="muted mt-2">Using model: {provider === 'azure' ? 'Azure OpenAI' : provider === 'perplexity' ? 'Perplexity Sonar' : 'Perplexity Sonar Pro'}</p>
    </div>
  );
}
