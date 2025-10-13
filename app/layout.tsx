import './globals.css';
import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import { LLMSettingsProvider } from '@/lib/llm-settings';
import { SiteHeader } from '@/components/SiteHeader';
import ConnectBanner from '@/components/ConnectBanner';
import localFont from 'next/font/local';

const lufga = localFont({
  src: [
    { path: '../fonts/lufga/LufgaThin.ttf', weight: '100', style: 'normal' },
    { path: '../fonts/lufga/LufgaThinItalic.ttf', weight: '100', style: 'italic' },
    { path: '../fonts/lufga/LufgaExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../fonts/lufga/LufgaExtraLightItalic.ttf', weight: '200', style: 'italic' },
    { path: '../fonts/lufga/LufgaLight.ttf', weight: '300', style: 'normal' },
    { path: '../fonts/lufga/LufgaLightItalic.ttf', weight: '300', style: 'italic' },
    { path: '../fonts/lufga/LufgaRegular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/lufga/LufgaItalic.ttf', weight: '400', style: 'italic' },
    { path: '../fonts/lufga/LufgaMedium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/lufga/LufgaMediumItalic.ttf', weight: '500', style: 'italic' },
    { path: '../fonts/lufga/LufgaSemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../fonts/lufga/LufgaSemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: '../fonts/lufga/LufgaBold.ttf', weight: '700', style: 'normal' },
    { path: '../fonts/lufga/LufgaBoldItalic.ttf', weight: '700', style: 'italic' },
    { path: '../fonts/lufga/LufgaExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../fonts/lufga/LufgaExtraBoldItalic.ttf', weight: '800', style: 'italic' },
    { path: '../fonts/lufga/LufgaBlack.ttf', weight: '900', style: 'normal' },
    { path: '../fonts/lufga/LufgaBlackItalic.ttf', weight: '900', style: 'italic' },
  ],
  variable: '--font-lufga',
  display: 'swap',
});

const urbanist = localFont({
  src: [
    { path: '../fonts/urbanist/Urbanist-VariableFont_wght.ttf', weight: '100 900', style: 'normal' },
    { path: '../fonts/urbanist/Urbanist-Italic-VariableFont_wght.ttf', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-urbanist',
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
