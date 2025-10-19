"use client";
import { useCallback, useMemo, useRef, useState } from 'react';
import { QuizQuestion, QuizSet } from '@/types/quiz';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { Timer } from './Timer';

type Answers = Record<string, string | undefined>;

export interface QuizRunSummary {
  quiz: QuizSet;
  answers: Answers;
  correctCount: number;
  answeredCount: number;
  total: number;
  missed: QuizQuestion[];
  expired: boolean;
  submittedAt: string;
}

export function QuizRunner({
  quiz,
  onPracticeMore,
  onSubmitComplete,
  showPracticeButton = true,
}: {
  quiz: QuizSet;
  onPracticeMore?: (missed: QuizQuestion[]) => void;
  onSubmitComplete?: (summary: QuizRunSummary) => void;
  showPracticeButton?: boolean;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (qid: string, cid: string) => setAnswers((a) => ({ ...a, [qid]: cid }));
  const total = quiz.questions.length;
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const correctCount = useMemo(
    () => quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.correctChoiceId ? 1 : 0), 0),
    [answers, quiz.questions]
  );

  const missed = useMemo(() => quiz.questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctChoiceId), [answers, quiz.questions]);

  const finalize = useCallback(
    (forceExpired = false) => {
      const summary: QuizRunSummary = {
        quiz,
        answers: { ...answers },
        correctCount,
        answeredCount,
        total,
        missed: missed.slice(),
        expired: forceExpired || expired,
        submittedAt: new Date().toISOString(),
      };
      setExpired((prev) => prev || forceExpired);
      setSubmitted(true);
      onSubmitComplete?.(summary);
      setTimeout(() => {
        if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
      return summary;
    },
    [answers, correctCount, answeredCount, total, quiz, expired, onSubmitComplete, missed]
  );

  const onSubmit = useCallback(() => {
    if (!submitted) finalize(false);
  }, [finalize, submitted]);

  const timeUp = useCallback(() => {
    if (!submitted) finalize(true);
  }, [finalize, submitted]);

  return (
    <div className="mt-3" ref={topRef}>
      <div className="card">
        <div className="flex justify-between">
          <div>
            <div className="pill">{quiz.topic}</div>
            <div className="muted">Difficulty: {quiz.difficulty} • Language: {quiz.language}</div>
          </div>
          <div className="flex" aria-live="polite">
            <div className="pill">{answeredCount}/{total} answered</div>
            {quiz.timed && quiz.durationSeconds && !submitted && (
              <div className="pill">
                <Timer seconds={quiz.durationSeconds} onExpire={timeUp} />
              </div>
            )}
          </div>
        </div>
        <div className="mt-2"><ProgressBar value={answeredCount} max={total} /></div>
      </div>

      {submitted ? (() => {
        const pct = Math.round((correctCount / total) * 100);
        const tier = pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad';
        const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '✨';
        const line = pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Nice progress!' : 'You’re getting there!';
        return (
          <div className={`mt-3 score-banner ${tier}`} role="status" aria-live="polite">
            <div className="left">
              <div className="emoji" aria-hidden>{emoji}</div>
              <div>
                <div className="big">{line} {pct}%</div>
                <div className="muted">Score: {correctCount} of {total}</div>
                {expired && <div className="warn">Time expired. Unanswered are marked incorrect.</div>}
              </div>
            </div>
            {showPracticeButton && (
              <div>
                <button onClick={() => onPracticeMore?.(missed)} disabled={missed.length === 0}>Practice similar to missed</button>
              </div>
            )}
          </div>
        );
      })() : null}

      <div className="mt-3 row" style={{ gap: 16 }}>
        {quiz.questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={idx}
            total={total}
            value={answers[q.id]}
            onChange={(cid) => handleChange(q.id, cid)}
            review={submitted ? { correct: answers[q.id] === q.correctChoiceId, correctChoiceId: q.correctChoiceId } : undefined}
          />
        ))}
      </div>

      {!submitted && (
        <div className="mt-3 flex">
          <button
            className="btn"
            onClick={onSubmit}
            disabled={answeredCount === 0}
          >
            Submit
          </button>
          <span className="muted">You can submit anytime.</span>
        </div>
      )}
    </div>
  );
}
