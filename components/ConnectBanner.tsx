"use client";

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaEnvelope, FaLinkedin, FaPhone } from 'react-icons/fa6';
import { HiArrowUpRight } from 'react-icons/hi2';

const YEAR = new Date().getFullYear();

const termsContent = `
USER TERMS & CONDITIONS

Welcome to Quizzaroo. By using the app you agree to these terms.

Purpose — Quizzaroo helps you generate adaptive quizzes and study plans. It is provided “as is” for personal or team learning.
Ownership — All prompts, generated questions, and explanations created through the service remain under your control. Quizzaroo does not store long-term copies; session data clears when you refresh or close the tab.
Responsible use — Do not upload content that is illegal, discriminatory, or violates the rights of others. You agree not to use Quizzaroo to generate harmful material or spam.
AI-generated output — Quiz questions and study guidance are produced by language models and may contain inaccuracies. Always review content before using it in a classroom, exam, or commercial setting.
Availability — We aim to keep the service available, but uptime is not guaranteed. Planned maintenance, provider outages, or upgrades may interrupt access.
Feedback — If you share product feedback, you grant us permission to use it to improve the experience.
Liability — Quizzaroo is not liable for losses arising from reliance on AI-generated content. You are responsible for verifying facts, especially in regulated or critical settings.

Questions? Email hello@quizzaroo.app.
`;

const privacyContent = `
PRIVACY POLICY

Our approach to privacy is simple: keep things session-only.

No account required — Quizzaroo does not ask for logins, passwords, or personal profiles.
Session storage — We store your quiz configuration and answers only in your current browser session so the app can grade and adapt. Close the tab and the data disappears.
API keys — If you provide your own Azure OpenAI or Perplexity key, it is held in session storage and sent only with your requests. We never transmit those keys to third parties beyond the selected model provider.
Analytics — We do not run ads or invasive tracking scripts. Basic logs may record anonymous request counts to keep the service healthy.
Third-party models — When you request content, we send the prompt (and only the prompt) to the selected LLM provider. Review their respective privacy policies for additional guarantees.
Contact — For privacy questions or removal requests, email hello@quizzaroo.app.

We update this policy as the product evolves. We will highlight significant changes in the app.
`;

function Modal({ open, onClose, title, content }: { open: boolean; onClose: () => void; title: string; content: string }) {
  if (!open) return null;
  const blocks = content.trim().split(/\n\n+/);
  const headingId = `modal-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="modal-panel">
        <div className="modal-header">
          <h3 id={headingId}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <article className="md">
            {blocks.map((block, idx) => (
              <p key={idx}>{block.trim()}</p>
            ))}
          </article>
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
        <div className="connect-heading">
          <h2 id="connect-heading">Let&apos;s build audit-grade GenAI</h2>
          <Link
            className="connect-cta"
            href="mailto:architmishrapro@gmail.com?subject=Say%20hello%20to%20Archit&body=Hi%20Archit%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20wanted%20to%20connect%20about..."
          >
            <span>Get in Touch</span>
            <span className="connect-cta-icon">
              <HiArrowUpRight />
            </span>
          </Link>
        </div>

        <div className="connect-divider" />

        <div className="connect-body">
          <div className="connect-brand">
            <Image src="/logo-mark.svg" alt="Logo mark" width={40} height={40} />
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
          <a className="connect-maker" href="https://archit-mishra.vercel.app/" target="_blank" rel="noreferrer">
            Meet the maker →
          </a>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="User Terms &amp; Conditions" content={termsContent} />
      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy Policy" content={privacyContent} />
    </section>
  );
}
