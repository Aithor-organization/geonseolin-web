"use client";

import Link from "next/link";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function MobileHeader({ title, showBack }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between h-14 px-5 bg-white border-b border-muted">
      {showBack ? (
        <Link href="#" onClick={() => window.history.back()} className="text-xl p-1">
          ←
        </Link>
      ) : (
        <Link href="/dashboard/worker" className="flex items-center gap-1.5">
          <span className="text-xl">🏗️</span>
          <span className="font-heading text-lg font-bold text-sage-dark">건설人</span>
        </Link>
      )}
      {title && <h1 className="text-base font-semibold absolute left-1/2 -translate-x-1/2">{title}</h1>}
      <div className="flex items-center gap-1">
        <Link href="/favorites" className="text-lg p-1">❤️</Link>
        <Link href="/chat" className="text-lg p-1">💬</Link>
      </div>
    </header>
  );
}
