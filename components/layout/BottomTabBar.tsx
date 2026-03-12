"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const workerTabs = [
  { href: "/dashboard/worker", label: "홈", icon: "🏠" },
  { href: "/jobs", label: "일자리", icon: "📋" },
  { href: "/applications", label: "지원", icon: "📬" },
  { href: "/chat", label: "채팅", icon: "💬" },
  { href: "/settings", label: "내정보", icon: "👤" },
];

const companyTabs = [
  { href: "/dashboard/company", label: "홈", icon: "🏠" },
  { href: "/search", label: "검색", icon: "🔍" },
  { href: "/jobs/new", label: "공고", icon: "📝" },
  { href: "/chat", label: "채팅", icon: "💬" },
  { href: "/settings", label: "내정보", icon: "👤" },
];

const adminTabs = [
  { href: "/admin", label: "대시보드", icon: "🛡️" },
  { href: "/admin/users", label: "회원", icon: "👥" },
  { href: "/admin/company-approvals", label: "기업승인", icon: "🏢" },
  { href: "/admin/jobs", label: "공고", icon: "📋" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { profile, loading } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAdminPage = pathname.startsWith("/admin");
  if (isAuthPage || isAdminPage || loading) return null;

  const role = profile?.role ?? "worker";
  const tabs = role === "admin" ? adminTabs : role === "company" ? companyTabs : workerTabs;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-white border-t border-muted">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3",
              active ? "text-sage-dark" : "text-gray-500"
            )}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={cn("text-[10px]", active && "font-bold")}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
