import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quizzaroo — Fast Quizzes & Prep',
  description: 'Fast targeted quizzes and adaptive prep',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="site-header">
            <h1 className="brand">Quizzaroo</h1>
          </header>
          <main>{children}</main>
          <footer className="site-footer">No accounts. Session only. Be kind to yourself.</footer>
        </div>
      </body>
    </html>
  );
}
