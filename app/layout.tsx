import './globals.css';
import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import { LLMSettingsProvider } from '@/lib/llm-settings';
import { SiteHeader } from '@/components/SiteHeader';
import ConnectBanner from '@/components/ConnectBanner';
import localFont from 'next/font/local';

const urbanist = localFont({
  src: [
    { path: '../fonts/urbanist/static/Urbanist-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/urbanist/static/Urbanist-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/urbanist/static/Urbanist-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../fonts/urbanist/static/Urbanist-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-urbanist',
  display: 'swap',
});

const lufga = localFont({
  src: [
    { path: '../fonts/lufga/LufgaLight.ttf', weight: '300', style: 'normal' },
    { path: '../fonts/lufga/LufgaRegular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/lufga/LufgaMedium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/lufga/LufgaSemiBold.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-lufga',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quizzaroo — Fast Quizzes & Prep',
  description: 'Fast targeted quizzes and adaptive prep',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${lufga.variable} ${urbanist.variable}`}>
        <LLMSettingsProvider>
          <div className="container">
            <SiteHeader />
            <main>{children}</main>
          </div>
          <ConnectBanner>
            <footer className="site-footer">No accounts. Session only. Be kind to yourself.</footer>
          </ConnectBanner>
        </LLMSettingsProvider>
      </body>
    </html>
  );
}
