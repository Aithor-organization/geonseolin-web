"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const workerNav = [
  { href: "/dashboard/worker", label: "대시보드", icon: "📊" },
  { href: "/jobs", label: "일자리 찾기", icon: "📋" },
  { href: "/applications", label: "지원 내역", icon: "📬" },
  { href: "/favorites", label: "즐겨찾기", icon: "❤️" },
  { href: "/chat", label: "메시지", icon: "💬" },
  { href: "/profile/worker", label: "내 프로필", icon: "👷" },
];

const companyNav = [
  { href: "/dashboard/company", label: "대시보드", icon: "📊" },
  { href: "/search", label: "인력 검색", icon: "🔍" },
  { href: "/jobs/new", label: "공고 관리", icon: "📝" },
  { href: "/favorites", label: "즐겨찾기", icon: "❤️" },
  { href: "/chat", label: "메시지", icon: "💬" },
  { href: "/profile/company", label: "기업 프로필", icon: "🏢" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, loading, signOut } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage || loading) return null;

  const role = profile?.role ?? "worker";
  const navItems = role === "company" ? companyNav : workerNav;
  const profileLabel = profile?.name ?? (role === "company" ? "기업" : "기술자");
  const profileIcon = role === "company" ? "🏢" : "👷";

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-white border-r border-muted shrink-0 overflow-y-auto">
      <Link href={role === "company" ? "/dashboard/company" : "/dashboard/worker"} className="flex items-center gap-2 px-5 py-5 border-b border-muted">
        <span className="text-2xl">🏗️</span>
        <span className="font-heading text-xl font-bold text-sage-dark">건설人</span>
      </Link>

      <nav className="flex-1 flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
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

      <div className="border-t border-muted p-4">
        <div className="flex items-center gap-2 px-2 mb-2">
          <span className="text-xl">{profileIcon}</span>
          <span className="text-sm font-medium text-dark">{profileLabel}</span>
        </div>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 px-2 py-1 text-xs transition-colors rounded-lg",
            pathname === "/settings"
              ? "text-sage-dark font-medium"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          <span>⚙️</span>
          <span>설정</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-2 py-1 mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors rounded-lg cursor-pointer w-full"
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
