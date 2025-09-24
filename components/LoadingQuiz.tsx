"use client";
export function LoadingQuiz({ label = 'Generating your quiz…' }: { label?: string }) {
  return (
    <div className="mt-3 card">
      <div className="loader-wrap">
        <div className="loader-spinner" aria-hidden />
        <div className="loader-title shimmer" style={{ width: '60%' }} />
        <div className="loader-sub shimmer" style={{ width: '40%', marginTop: 8 }} />
      </div>
      <div className="mt-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className="loader-option shimmer" />
        ))}
      </div>
      <div className="mt-3 center muted" aria-live="polite">{label}</div>
    </div>
  );
}

