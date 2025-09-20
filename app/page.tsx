import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <section className="hero" aria-label="Welcome">
        <h2>Daily Practice, Real Progress</h2>
        <p>Targeted quizzes and adaptive prep. Clear, quick, effective.</p>
        <div className="actions">
          <Link className="btn-cta btn" href="/targeted">Play Today</Link>
          <Link className="btn btn-outline" href="/prepare">Help Me Prepare</Link>
        </div>
      </section>

      <div className="space" />
      <div className="mode-grid">
        <div className="card feature-card" role="region" aria-label="Targeted Quiz">
          <div className="badge" aria-hidden>🎯</div>
          <div>
            <h3>Targeted Quiz</h3>
            <p className="muted">Type a topic and get a concise multiple-choice quiz. Instant grading with explanations.</p>
            <div className="mt-2">
              <Link className="btn" href="/targeted">Start Now →</Link>
            </div>
          </div>
        </div>
        <div className="card feature-card" role="region" aria-label="Help Me Prepare">
          <div className="badge" aria-hidden>📈</div>
          <div>
            <h3>Help Me Prepare</h3>
            <p className="muted">We build a subtopic map, run a diagnostic, then drill weak areas until mastery improves.</p>
            <div className="mt-2">
              <Link className="btn" href="/prepare">Start Now →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
