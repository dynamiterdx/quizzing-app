import Image from "next/image";
import Link from "next/link";
import { FaEnvelope, FaLinkedin, FaPhone } from "react-icons/fa6";
import { HiArrowUpRight } from "react-icons/hi2";

export default function ConnectBanner() {
  return (
    <section id="contact" className="mt-16">
      {/* Full-bleed dark block that hugs screen edges */}
      <div className="bg-zinc-900 text-white rounded-t-[36px] footer-fade-in">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Let&apos;s build audit-grade GenAI</h2>
            <Link
              href="mailto:architmishrapro@gmail.com?subject=Say%20hello%20to%20Archit&body=Hi%20Archit%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20wanted%20to%20connect%20about..."
              className="group inline-flex items-center gap-2 rounded-full bg-white text-zinc-900 px-5 py-3 font-semibold shadow-sm transition hover:bg-zinc-200"
            >
              <span>Get in Touch</span>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-white transition group-hover:bg-orange-400">
                <HiArrowUpRight />
              </span>
            </Link>
          </div>

          <div className="my-8 border-t border-white/10" />

          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/logo-mark.svg" alt="logo" width={32} height={32} className="h-8 w-8" />
                <span className="font-semibold">GENAI</span>
              </div>
              <p className="mt-3 text-sm text-zinc-300 max-w-prose">
                I design and ship agentic copilots that users can trust - balancing governance, accuracy, and fast iteration
                across 130 markets. If you&apos;re wrestling with compliance or risk guardrails, let&apos;s chat.
              </p>
              <div className="mt-4 flex items-center gap-4 text-white/80">
                <a href="mailto:architmishrapro@gmail.com" aria-label="Email Archit" className="hover:text-white">
                  <FaEnvelope />
                </a>
                <a
                  href="https://www.linkedin.com/in/marchit/"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  <FaLinkedin />
                </a>
                <a href="tel:+919161251999" aria-label="Call Archit" className="hover:text-white">
                  <FaPhone />
                </a>
              </div>
            </div>

            <div>
              <div className="text-orange-400 font-semibold">Contact</div>
              <ul className="mt-2 space-y-1 text-zinc-300 text-sm">
                <li>Bengaluru, India</li>
                <li>
                  <a href="tel:+919161251999" className="hover:text-white">+91 9161251999</a>
                </li>
                <li>
                  <a href="mailto:architmishrapro@gmail.com" className="hover:text-white">architmishrapro@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="my-8 border-t border-white/10" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <div>Copyright © {new Date().getFullYear()} Archit Mishra. All rights reserved.</div>
            <div>
              <a href="#" className="hover:text-white">User Terms & Conditions</a>
              <span className="mx-2">|</span>
              <a href="#" className="hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
