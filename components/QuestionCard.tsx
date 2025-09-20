"use client";
import { QuizQuestion } from '@/types/quiz';

export function QuestionCard({
  q,
  index,
  total,
  value,
  onChange,
  review,
}: {
  q: QuizQuestion;
  index: number;
  total: number;
  value?: string;
  onChange: (choiceId: string) => void;
  review?: { correct: boolean; correctChoiceId: string };
}) {
  return (
    <div className="card">
      <div className="flex justify-between">
        <div className="pill">Q {index + 1} of {total}</div>
        {q.subtopic && <div className="pill">{q.subtopic}</div>}
      </div>
      <h3 className="mt-2" id={`q-${q.id}`}>{q.question}</h3>
      <div className="answers mt-2" role="radiogroup" aria-labelledby={`q-${q.id}`}>
        {q.choices.map((c) => {
          const checked = value === c.id;
          const isCorrect = review && c.id === review.correctChoiceId;
          const isWrongSelected = review && checked && !isCorrect;
          const cls = [
            checked && !review ? 'selected' : '',
            isCorrect ? 'correct' : '',
            isWrongSelected ? 'wrong' : '',
          ].filter(Boolean).join(' ');
          return (
            <label key={c.id} className={cls} tabIndex={0}>
              <input
                type="radio"
                name={`q-${q.id}`}
                value={c.id}
                checked={checked}
                onChange={() => onChange(c.id)}
                aria-checked={checked}
              />
              {review && isCorrect && <span className="ans-icon correct" aria-hidden>✓</span>}
              {review && isWrongSelected && <span className="ans-icon wrong" aria-hidden>✕</span>}
              <span className="ans-text">{c.text}</span>
            </label>
          );
        })}
      </div>
      {review && (
        <div className="mt-2">
          <div className="muted">Explanation:</div>
          <div>{q.explanation}</div>
        </div>
      )}
    </div>
  );
}
