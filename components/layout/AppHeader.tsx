"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/worker", label: "대시보드", icon: "🏠" },
  { href: "/search", label: "인력 검색", icon: "🔍" },
  { href: "/chat", label: "채팅", icon: "💬" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-muted sticky top-0 z-40">
      <Link href="/dashboard/worker" className="flex items-center gap-2">
        <span className="text-2xl">🏗️</span>
        <span className="font-heading text-xl font-bold text-sage-dark">건설人</span>
      </Link>
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-sage/10 text-sage-dark"
                : "text-gray-500 hover:text-dark hover:bg-muted"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/profile/worker"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <span className="text-xl">👷</span>
        <span className="text-sm font-medium">김철수</span>
      </Link>
    </header>
  );
}
