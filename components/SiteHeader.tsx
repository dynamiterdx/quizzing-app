"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
  const pathname = usePathname();
  const showHeroLogo = pathname === '/' || pathname === null;

  return (
    <header className="site-header">
      {!showHeroLogo ? (
        <Link href="/" className="logo-link" aria-label="Quizzaroo home">
          <Image src="/purple_logo.png" alt="Quizzaroo" width={68} height={68} priority />
        </Link>
      ) : (
        <span aria-hidden className="logo-placeholder" />
      )}
      <a className="llm-button" href="/llm-settings">LLM settings</a>
    </header>
  );
}
