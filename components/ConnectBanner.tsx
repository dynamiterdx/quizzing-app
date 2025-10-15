"use client";

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaEnvelope, FaLinkedin, FaPhone } from 'react-icons/fa6';
import { HiArrowUpRight } from 'react-icons/hi2';

const YEAR = new Date().getFullYear();

const termsContent: ReactNode = (
  <div className="md">
    <h2>User Terms &amp; Conditions</h2>
    <p>Welcome to Quizzaroo. By using the app you agree to these terms.</p>
    <ul>
      <li><strong>Purpose</strong> — Quizzaroo helps you generate adaptive quizzes and study plans. It is provided “as is” for personal or team learning.</li>
      <li><strong>Ownership</strong> — All prompts, generated questions, and explanations created through the service remain under your control. Session data clears when you refresh or close the tab.</li>
      <li><strong>Responsible use</strong> — Do not upload content that is illegal, discriminatory, or violates the rights of others. You agree not to use Quizzaroo to generate harmful material or spam.</li>
      <li><strong>AI-generated output</strong> — Quiz questions and study guidance may contain inaccuracies. Always review content before using it in a classroom, exam, or commercial setting.</li>
      <li><strong>Availability</strong> — Uptime is not guaranteed. Maintenance, provider outages, or upgrades may interrupt access.</li>
      <li><strong>Feedback</strong> — If you share product feedback, you grant permission to use it to improve Quizzaroo.</li>
      <li><strong>Liability</strong> — Quizzaroo is not liable for losses arising from reliance on AI-generated content. Verify facts, especially in regulated or critical settings.</li>
    </ul>
    <p>Questions? Email hello@quizzaroo.app.</p>
  </div>
);

const privacyContent: ReactNode = (
  <div className="md">
    <h2>Privacy Policy</h2>
    <p>Our approach to privacy is simple: keep things session-only.</p>
    <ul>
      <li><strong>No account required</strong> — Quizzaroo does not ask for logins, passwords, or personal profiles.</li>
      <li><strong>Session storage</strong> — Quiz configuration and answers live only in your current browser session so the app can grade and adapt. Close the tab and the data disappears.</li>
      <li><strong>API keys</strong> — If you provide your own Azure OpenAI or Perplexity key, it stays in session storage and is sent only with your requests.</li>
      <li><strong>Analytics</strong> — We do not run ads or invasive tracking scripts. Basic logs may record anonymous request counts to keep the service healthy.</li>
      <li><strong>Third-party models</strong> — Prompts are sent to the selected LLM provider. Review their privacy policies for additional guarantees.</li>
      <li><strong>Contact</strong> — For privacy questions or removal requests, email hello@quizzaroo.app.</li>
    </ul>
    <p>We update this policy as the product evolves and will highlight significant changes in the app.</p>
  </div>
);

function Modal({ open, onClose, title, content }: { open: boolean; onClose: () => void; title: string; content: ReactNode }) {
  if (!open) return null;
  const headingId = `modal-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="modal-panel">
        <div className="modal-header">
          <h3 id={headingId}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {content}
        </div>
      </div>
    </div>
  );
}

export default function ConnectBanner({ children }: { children?: ReactNode }) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <section className="connect-banner" aria-labelledby="connect-heading">
      <div className="connect-wrap">
        <div className="connect-inner">
          <div className="connect-heading">
            <h2 id="connect-heading" className="connect-title">Let&apos;s build audit-grade GenAI</h2>
            <Link className="connect-cta" href="https://archit-mishra.vercel.app/" target="_blank" rel="noreferrer">
              <span>Get in Touch</span>
              <span className="connect-cta-icon">
                <HiArrowUpRight />
              </span>
            </Link>
          </div>

          <div className="connect-divider" />

            <div className="connect-body">
              <div className="connect-brand">
                <Image src="/logo-mark.svg" alt="Logo mark" width={48} height={48} />
              <div>
                <h3>GENAI</h3>
                <p>
                  I design and ship agentic copilots auditors can trust — balancing governance, accuracy, and iteration across
                  130 markets. Wrestling with compliance or risk guardrails? Let&apos;s chat.
                </p>
                <div className="connect-links" aria-label="Reach out">
                  <a href="mailto:architmishrapro@gmail.com" aria-label="Email">
                    <FaEnvelope />
                  </a>
                  <a href="https://www.linkedin.com/in/marchit/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <FaLinkedin />
                  </a>
                  <a href="tel:+919161251999" aria-label="Call">
                    <FaPhone />
                  </a>
                </div>
              </div>
            </div>

            <div className="connect-contact">
              <h4>Contact</h4>
              <ul>
                <li>Bengaluru, India</li>
                <li><a href="tel:+919161251999">+91 9161251999</a></li>
                <li><a href="mailto:architmishrapro@gmail.com">architmishrapro@gmail.com</a></li>
              </ul>
            </div>
          </div>

          <div className="connect-divider" />

          <div className="connect-meta">
            <span>Copyright © {YEAR} Archit Mishra. All rights reserved.</span>
            {children}
            <div className="connect-meta-links">
              <button type="button" onClick={() => setTermsOpen(true)}>User Terms &amp; Conditions</button>
              <span aria-hidden>|</span>
              <button type="button" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="User Terms &amp; Conditions" content={termsContent} />
      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy Policy" content={privacyContent} />
    </section>
  );
}
