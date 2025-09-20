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
          let style: React.CSSProperties | undefined;
          if (review) {
            if (c.id === review.correctChoiceId) style = { borderColor: 'var(--success)' };
            else if (checked && c.id !== review.correctChoiceId) style = { borderColor: 'var(--danger)' };
          }
          return (
            <label key={c.id} style={style} tabIndex={0}>
              <input
                type="radio"
                name={`q-${q.id}`}
                value={c.id}
                checked={checked}
                onChange={() => onChange(c.id)}
                aria-checked={checked}
              />
              <span>{c.text}</span>
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

