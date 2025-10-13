import './globals.css';
import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import { LLMSettingsProvider } from '@/lib/llm-settings';
import { SiteHeader } from '@/components/SiteHeader';

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
            <SiteHeader />
            <main>{children}</main>
            <footer className="site-footer">No accounts. Session only. Be kind to yourself.</footer>
          </div>
        </LLMSettingsProvider>
      </body>
    </html>
  );
}
