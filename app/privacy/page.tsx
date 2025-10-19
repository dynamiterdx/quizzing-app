import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Quizzaroo',
  description: 'Learn how Quizzaroo handles data, API keys, and learner privacy.',
};

const updatedOn = 'October 19, 2025';

interface Section {
  heading: string;
  body: ReactNode[];
}

const sections: Section[] = [
  {
    heading: '1. Overview',
    body: [
      'Quizzaroo is designed to be a fast, account-free practice tool. We keep the footprint of personal data as small as possible and give you control over the information you share with the app.',
    ],
  },
  {
    heading: '2. Data We Do Not Collect',
    body: [
      'We do not run user accounts or maintain learner profiles on our servers.',
      'We do not intentionally collect personal identifiers, assessment results, or usage analytics beyond what is necessary for basic server health (HTTP access logs with timestamp, route, and status code).',
    ],
  },
  {
    heading: '3. Information Stored in Your Browser',
    body: [
      'Session progress, selected quiz settings, and any API keys you paste into the LLM Settings screen are stored in `window.sessionStorage`. This storage is scoped to the current browser tab and is cleared automatically when the tab is closed or the session is reset.',
      'Because data lives in the browser, clearing your storage or reloading the page will remove quizzes and configuration history.',
    ],
  },
  {
    heading: '4. API Keys & Third-Party Model Calls',
    body: [
      'To generate quizzes, we call Azure OpenAI or Perplexity APIs using either environment credentials configured by the deployer or API keys you provide in the LLM Settings form.',
      'Keys that you paste are sent with each relevant request solely to authenticate the upstream API call and are not written to disk or logged by Quizzaroo.',
      'Microsoft, OpenAI, and Perplexity may store request metadata according to their own privacy policies. Review their documentation to understand how they handle prompts, completions, and telemetry.',
    ],
  },
  {
    heading: '5. Cookies & Tracking',
    body: [
      'Quizzaroo does not set tracking cookies, run third-party analytics pixels, or use programmatic advertising.',
    ],
  },
  {
    heading: '6. Server Logs',
    body: [
      'Basic access logs (timestamp, IP address, URL path, HTTP method, status code) may be retained temporarily for debugging, security monitoring, and abuse prevention.',
      'Logs are rotated and discarded on a rolling basis and are never combined with marketing or analytics datasets.',
    ],
  },
  {
    heading: '7. Data Retention & Deletion',
    body: [
      'Because user data stays in the browser session, deletion is under your control—close the tab or clear storage to remove quiz history and settings.',
      'If you deploy Quizzaroo yourself, ensure your hosting provider respects similar retention limits for server logs.',
    ],
  },
  {
    heading: '8. Learners Under 13',
    body: [
      'Quizzaroo is not intended for children under 13 without verified adult supervision. Do not share personal information about minors when using the app.',
    ],
  },
  {
    heading: '9. Changes to This Policy',
    body: [
      'We may update this Privacy Policy as features evolve or legal requirements change. The “Last updated” date will reflect the most recent version. Continued use of Quizzaroo after updates means you accept the revised policy.',
    ],
  },
  {
    heading: '10. Contact',
    body: [
      <>
        Privacy questions? Reach out at{' '}
        <Link href="mailto:architmishrapro@gmail.com">architmishrapro@gmail.com</Link>.
      </>,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="card">
      <h2>Quizzaroo Privacy Policy</h2>
      <p className="muted">Last updated {updatedOn}</p>
      <div className="mt-3 row" style={{ gap: 20 }}>
        {sections.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            {section.body.map((entry, idx) => (
              <p key={idx}>{entry}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
