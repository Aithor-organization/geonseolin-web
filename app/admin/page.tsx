"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

interface DashboardStats {
  totalUsers: number;
  workerCount: number;
  companyCount: number;
  activeJobs: number;
  totalJobs: number;
  todayMatches: number;
  monthlyRevenue: number;
  recentUsers: Array<{ id: string; name: string; email: string; role: string; created_at: string }>;
  recentJobs: Array<{ id: string; title: string; company_name: string; status: string; applicant_count: number; created_at: string }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-sage-dark mb-6">대시보드</h1>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><div className="h-20 bg-gray-100 rounded animate-pulse" /></Card>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}><div className="h-60 bg-gray-100 rounded animate-pulse" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">통계 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const kpiCards = [
    { label: "전체 사용자", value: stats.totalUsers, sub: `기술자 ${stats.workerCount} · 기업 ${stats.companyCount}`, color: "bg-blue-50 text-blue-600" },
    { label: "활성 공고", value: stats.activeJobs, sub: `전체 ${stats.totalJobs}건`, color: "bg-green-50 text-green-600" },
    { label: "오늘 매칭", value: stats.todayMatches, sub: "건", color: "bg-amber-50 text-amber-600" },
    { label: "월간 매출", value: `${(stats.monthlyRevenue / 10000).toLocaleString()}만원`, sub: "이번 달", color: "bg-purple-50 text-purple-600" },
  ];

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      worker: "bg-blue-100 text-blue-700",
      company: "bg-purple-100 text-purple-700",
      admin: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = { worker: "기술자", company: "기업", admin: "관리자" };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] ?? "bg-gray-100 text-gray-700"}`}>
        {labels[role] ?? role}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-500",
      draft: "bg-yellow-100 text-yellow-700",
    };
    const labels: Record<string, string> = { active: "모집중", closed: "마감", draft: "임시" };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-sage-dark mb-6">대시보드</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-dark">{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${kpi.color}`}>
                {kpi.label === "전체 사용자" ? "👥" : kpi.label === "활성 공고" ? "📋" : kpi.label === "오늘 매칭" ? "🤝" : "💰"}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h3 className="font-heading text-base font-semibold text-dark mb-4">최근 가입 사용자</h3>
          <div className="space-y-3">
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">가입된 사용자가 없습니다</p>
            ) : (
              stats.recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-gray-600">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {roleBadge(user.role)}
                    <span className="text-xs text-gray-400">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-base font-semibold text-dark mb-4">최근 공고</h3>
          <div className="space-y-3">
            {stats.recentJobs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">등록된 공고가 없습니다</p>
            ) : (
              stats.recentJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-dark">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.company_name} · 지원 {job.applicant_count}명</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(job.status)}
                    <span className="text-xs text-gray-400">{formatDate(job.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
