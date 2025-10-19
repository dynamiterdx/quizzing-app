"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
  const pathname = usePathname();
  const showHeroLogo = pathname === '/' || pathname === null;

  return (
    <header className="site-header">
      <div className="site-header-shell" role="presentation" />
      <div className="site-header-inner">
        {!showHeroLogo ? (
          <Link href="/" className="logo-link" aria-label="Quizzaroo home">
            <Image src="/purple_logo.png" alt="Quizzaroo" width={60} height={60} priority />
          </Link>
        ) : (
          <span aria-hidden className="logo-placeholder" />
        )}
        <div className="site-header-copy">
          <span className="brand">Quizzaroo</span>
          <span className="muted">Study smarter with adaptive AI drills</span>
        </div>
        <a className="llm-button" href="/llm-settings">LLM settings</a>
      </div>
    </header>
  );
}
