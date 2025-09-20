"use client";
import { useEffect, useState } from 'react';

export function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);
  useEffect(() => {
    if (remaining <= 0) return onExpire();
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return <span aria-live="polite" className={remaining <= 10 ? 'warn' : ''}>{mins}:{secs.toString().padStart(2, '0')}</span>;
}

