"use client";
import { useCallback, useMemo, useState } from 'react';
import { QuizQuestion, QuizSet } from '@/types/quiz';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { Timer } from './Timer';

type Answers = Record<string, string | undefined>;

export function QuizRunner({ quiz, onPracticeMore }: { quiz: QuizSet; onPracticeMore?: (missed: QuizQuestion[]) => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [expired, setExpired] = useState(false);

  const handleChange = (qid: string, cid: string) => setAnswers((a) => ({ ...a, [qid]: cid }));
  const total = quiz.questions.length;
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const correctCount = useMemo(
    () => quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.correctChoiceId ? 1 : 0), 0),
    [answers, quiz.questions]
  );

  const missed = useMemo(() => quiz.questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctChoiceId), [answers, quiz.questions]);

  const onSubmit = useCallback(() => {
    setSubmitted(true);
  }, []);

  const timeUp = useCallback(() => {
    setExpired(true);
    setSubmitted(true);
  }, []);

  return (
    <div className="mt-3">
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

      {!submitted ? (
        <div className="mt-3 flex">
          <button className="btn" onClick={onSubmit} disabled={answeredCount === 0}>Submit</button>
          <span className="muted">You can submit anytime.</span>
        </div>
      ) : (
        <div className="mt-3 card">
          <div className="flex justify-between">
            <div>
              <div className="score">Score: {correctCount}/{total} ({Math.round((correctCount / total) * 100)}%)</div>
              {expired && <div className="warn">Time expired. Unanswered are marked incorrect.</div>}
            </div>
            <div className="pill">{missed.length} to practice</div>
          </div>
          <div className="mt-2">
            <button onClick={() => onPracticeMore?.(missed)} disabled={missed.length === 0}>Practice similar to missed</button>
          </div>
        </div>
      )}
    </div>
  );
}

