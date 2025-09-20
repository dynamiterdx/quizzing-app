import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="card">
      <h2>Practice effectively</h2>
      <p className="muted">Pick a mode to start practicing right away.</p>
      <div className="space" />
      <div className="mode-grid">
        <div className="card" role="region" aria-label="Targeted Quiz">
          <h3>Targeted Quiz</h3>
          <p>Type a topic and get a concise multiple-choice quiz. Instant grading with explanations, and follow-ups on what you missed.</p>
          <div className="mt-3">
            <Link className="btn" href="/targeted">Start Targeted Quiz</Link>
          </div>
        </div>
        <div className="card" role="region" aria-label="Help Me Prepare">
          <h3>Help Me Prepare</h3>
          <p>We build a quick subtopic map, run a short diagnostic, then drill weak areas until your mastery rises.</p>
          <div className="mt-3">
            <Link className="btn" href="/prepare">Start Help Me Prepare</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

