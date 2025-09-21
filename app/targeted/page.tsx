"use client";
import { useCallback, useMemo, useState } from 'react';
import { QuizSet, QuizQuestion } from '@/types/quiz';
import { QuizRunner } from '@/components/QuizRunner';
import { ErrorNotice } from '@/components/ErrorNotice';

export default function TargetedPage() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert'>('beginner');
  const [numQuestions, setNumQuestions] = useState(6);
  const [timed, setTimed] = useState(false);
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizSet | null>(null);

  const canGenerate = topic.trim().length > 2 && numQuestions >= 3 && numQuestions <= 15;

  const generateQuiz = useCallback(async () => {
    setLoading(true); setError(null); setQuiz(null);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, numQuestions, timed, language }),
      });
      if (!res.ok) throw new Error(await res.text());
      const q = await res.json();
      const durationSeconds = timed ? Math.max(45, Math.round(numQuestions * 45)) : undefined;
      setQuiz({ ...q, durationSeconds });
    } catch (e: any) {
      const msg = e?.message || 'Failed to generate quiz. Please retry.';
      setError(msg.includes('429') ? 'Rate limited. Please wait a few seconds and try again.' : 'Error generating quiz. Please retry.');
    } finally { setLoading(false); }
  }, [topic, difficulty, numQuestions, timed, language]);

  const practiceMore = useCallback(async (missed: QuizQuestion[]) => {
    if (!missed.length) return;
    setLoading(true); setError(null);
    try {
      const missedSubtopics = Array.from(new Set(missed.map((m) => m.subtopic).filter(Boolean))) as string[];
      const res = await fetch('/api/drill-quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetSubtopics: missedSubtopics, targetDifficulty: difficulty, language }),
      });
      if (!res.ok) throw new Error(await res.text());
      const q = await res.json();
      const durationSeconds = timed ? Math.max(45, Math.round((q?.questions?.length || 4) * 45)) : undefined;
      setQuiz({ topic, difficulty, language, timed, durationSeconds, questions: q.questions });
    } catch (e: any) {
      setError('Could not generate follow-up questions. Please retry.');
    } finally { setLoading(false); }
  }, [topic, difficulty, language, timed]);

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
          <input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
        </div>
      </div>
      <div className="mt-2 flex">
        <label className="flex" htmlFor="timed">
          <input id="timed" type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          Timed
        </label>
        <button onClick={generateQuiz} disabled={!canGenerate || loading}>{loading ? 'Generating…' : 'Generate quiz'}</button>
      </div>

      {error && (
        <div className="mt-3"><ErrorNotice message={error} retry={generateQuiz} /></div>
      )}

      {quiz && <QuizRunner quiz={quiz} onPracticeMore={practiceMore} />}
    </div>
  );
}
