"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

interface AnalyticsData {
  totalUsers: number;
  workerCount: number;
  companyCount: number;
  todayMatches: number;
  monthlyRevenue: number;
  weeklySignups: Array<{ date: string; workers: number; companies: number }>;
  topSpecialties: Array<{ specialty: string; count: number }>;
  regionStats: Array<{ region: string; workerCount: number; companyCount: number; jobCount: number }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-sage-dark mb-6">분석</h1>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><div className="h-20 bg-gray-100 rounded animate-pulse" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">데이터를 불러올 수 없습니다.</div>
    );
  }

  const matchRate = data.totalUsers > 0
    ? Math.round((data.todayMatches / Math.max(data.workerCount, 1)) * 100)
    : 0;

  const kpis = [
    { label: "이번 달 매칭", value: data.todayMatches, icon: "🤝" },
    { label: "신규 가입", value: data.totalUsers, icon: "📥" },
    { label: "매칭 성공률", value: `${matchRate}%`, icon: "📊" },
    { label: "총 거래액", value: `${(data.monthlyRevenue / 10000).toLocaleString()}만`, icon: "💰" },
  ];

  // 주간 가입 차트 최대값 계산
  const maxSignup = Math.max(...data.weeklySignups.map((d) => d.workers + d.companies), 1);

  // 직종 차트 최대값 계산
  const maxSpecialty = Math.max(...(data.topSpecialties.map((s) => s.count) || [1]), 1);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-sage-dark mb-6">분석</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{kpi.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-xl font-bold text-dark">
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 주간 가입 추이 */}
        <Card>
          <h3 className="font-heading text-base font-semibold text-dark mb-4">사용자 가입 추이 (최근 7일)</h3>
          <div className="flex items-end gap-2 h-40">
            {data.weeklySignups.map((day) => {
              const total = day.workers + day.companies;
              const height = (total / maxSignup) * 100;
              const workerHeight = total > 0 ? (day.workers / total) * height : 0;
              const companyHeight = total > 0 ? (day.companies / total) * height : 0;
              const dateLabel = day.date.slice(5);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: "120px" }}>
                    {total > 0 && (
                      <span className="text-xs text-gray-400 mb-1">{total}</span>
                    )}
                    <div
                      className="w-full rounded-t bg-blue-400"
                      style={{ height: `${workerHeight}%`, minHeight: workerHeight > 0 ? "4px" : "0" }}
                    />
                    <div
                      className="w-full bg-purple-400"
                      style={{ height: `${companyHeight}%`, minHeight: companyHeight > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{dateLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-400" />
              기술자
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-400" />
              기업
            </div>
          </div>
        </Card>

        {/* 직종별 분포 */}
        <Card>
          <h3 className="font-heading text-base font-semibold text-dark mb-4">직종별 분포 (상위 5)</h3>
          {data.topSpecialties.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">데이터가 없습니다</p>
          ) : (
            <div className="space-y-4">
              {data.topSpecialties.map((item) => (
                <div key={item.specialty}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-dark">{item.specialty}</span>
                    <span className="text-sm text-gray-500">{item.count}명</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-sage rounded-full h-2 transition-all"
                      style={{ width: `${(item.count / maxSpecialty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 지역별 활동 */}
      <Card>
        <h3 className="font-heading text-base font-semibold text-dark mb-4">지역별 활동</h3>
        {data.regionStats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">데이터가 없습니다</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted text-left">
                <th className="py-2 px-4 font-medium text-gray-500">지역</th>
                <th className="py-2 px-4 font-medium text-gray-500 text-right">노동자</th>
                <th className="py-2 px-4 font-medium text-gray-500 text-right">기업</th>
                <th className="py-2 px-4 font-medium text-gray-500 text-right">공고</th>
              </tr>
            </thead>
            <tbody>
              {data.regionStats.slice(0, 10).map((region) => (
                <tr key={region.region} className="border-b border-gray-50">
                  <td className="py-2 px-4 text-dark">{region.region}</td>
                  <td className="py-2 px-4 text-gray-500 text-right">{region.workerCount}</td>
                  <td className="py-2 px-4 text-gray-500 text-right">{region.companyCount}</td>
                  <td className="py-2 px-4 text-gray-500 text-right">{region.jobCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
