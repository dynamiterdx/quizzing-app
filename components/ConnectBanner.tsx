import Image from "next/image";
import Link from "next/link";
import { FaEnvelope, FaLinkedin, FaPhone } from "react-icons/fa6";
import { HiArrowUpRight } from "react-icons/hi2";

export default function ConnectBanner() {
  return (
    <section id="contact" className="mt-16">
      {/* Full-bleed dark block that hugs screen edges */}
      <div className="bg-[linear-gradient(135deg,#221a52,#352897)] text-white rounded-t-[36px] shadow-[0_-18px_36px_rgba(34,24,99,0.25)] footer-fade-in">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Let&apos;s build audit-grade GenAI</h2>
            <Link
              href="https://archit-mishra.vercel.app/"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffd24d] to-[#ffad33] text-[#2c1d05] px-5 py-3 font-semibold shadow-[0_12px_28px_rgba(255,179,71,0.32)] transition hover:shadow-[0_16px_32px_rgba(255,179,71,0.38)] hover:-translate-y-[1px]"
              target="_blank"
              rel="noreferrer"
            >
              <span>Get in Touch</span>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ff6b2c] text-white transition group-hover:bg-[#ff824c]">
                <HiArrowUpRight />
              </span>
            </Link>
          </div>

          <div className="my-8 border-t border-white/20" />

          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/logo-mark.svg" alt="logo" width={32} height={32} className="h-8 w-8 drop-shadow" />
                <span className="font-semibold text-[#ffdd7a]">GENAI</span>
              </div>
              <p className="mt-3 text-sm text-white/75 max-w-prose">
                I design and ship agentic copilots that users can trust - balancing governance, accuracy, and fast iteration
                across 130 markets. If you&apos;re wrestling with compliance or risk guardrails, let&apos;s chat.
              </p>
              <div className="mt-4 flex items-center gap-4 text-white/80">
                <a href="mailto:architmishrapro@gmail.com" aria-label="Email Archit" className="hover:text-white transition">
                  <FaEnvelope />
                </a>
                <a
                  href="https://www.linkedin.com/in/marchit/"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition"
                >
                  <FaLinkedin />
                </a>
                <a href="tel:+919161251999" aria-label="Call Archit" className="hover:text-white transition">
                  <FaPhone />
                </a>
              </div>
            </div>

            <div>
              <div className="text-[#ffd24d] font-semibold">Contact</div>
              <ul className="mt-2 space-y-1 text-white/80 text-sm">
                <li>Bengaluru, India</li>
                <li>
                  <a href="tel:+919161251999" className="hover:text-white transition">+91 9161251999</a>
                </li>
                <li>
                  <a href="mailto:architmishrapro@gmail.com" className="hover:text-white transition">architmishrapro@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="my-8 border-t border-white/20" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <div>Copyright © {new Date().getFullYear()} Archit Mishra. All rights reserved.</div>
            <div>
              <Link href="/terms" className="hover:text-white">User Terms &amp; Conditions</Link>
              <span className="mx-2">|</span>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
