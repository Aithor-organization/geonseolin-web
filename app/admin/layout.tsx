"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

const navItems = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/users", label: "사용자 관리", icon: "👥" },
  { href: "/admin/jobs", label: "공고 관리", icon: "📋" },
  { href: "/admin/analytics", label: "분석", icon: "📈" },
  { href: "/admin/reports", label: "신고/모더레이션", icon: "🚨" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // profiles.role 또는 user_metadata.role로 admin 판별
  const isAdmin =
    profile?.role === "admin" || user?.user_metadata?.role === "admin";
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !isAdmin && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [loading, isAdmin, isLoginPage, router]);

  // 관리자 로그인 페이지는 레이아웃 없이 렌더링
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r border-muted flex flex-col fixed h-full">
        <div className="p-6 border-b border-muted">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <div>
              <h1 className="font-heading text-lg font-bold text-sage-dark">건설人</h1>
              <p className="text-xs text-gray-400">관리자 패널</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-sage/10 text-sage-dark font-medium border-r-2 border-sage"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-muted">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sm font-medium text-sage-dark">
              {profile?.name?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark truncate">{profile?.name}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-xs text-gray-400 hover:text-danger transition-colors text-left"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
