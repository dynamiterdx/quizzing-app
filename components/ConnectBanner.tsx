import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaEnvelope, FaLinkedin, FaPhone } from 'react-icons/fa6';
import { HiArrowUpRight } from 'react-icons/hi2';

const YEAR = new Date().getFullYear();

export default function ConnectBanner({ children }: { children?: ReactNode }) {
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
            <a href="#">User Terms &amp; Conditions</a>
            <span aria-hidden>|</span>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </section>
  );
}
