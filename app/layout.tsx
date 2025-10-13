import './globals.css';
import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LLMSettingsProvider } from '@/lib/llm-settings';

export const metadata: Metadata = {
  title: 'Quizzaroo — Fast Quizzes & Prep',
  description: 'Fast targeted quizzes and adaptive prep',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LLMSettingsProvider>
          <div className="container">
            <header className="site-header">
              <Link href="/" className="logo-link" aria-label="Quizzaroo home">
                <Image src="/logo.png" alt="Quizzaroo" width={40} height={40} priority />
                <span className="brand">Quizzaroo</span>
              </Link>
              <a className="btn btn-outline" href="/llm-settings">LLM settings</a>
            </header>
            <main>{children}</main>
            <footer className="site-footer">No accounts. Session only. Be kind to yourself.</footer>
          </div>
        </LLMSettingsProvider>
      </body>
    </html>
  );
}
