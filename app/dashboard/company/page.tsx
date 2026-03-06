"use client";

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/components/features/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyStats } from "@/lib/hooks/use-profile";
import { useJobs, type JobRow } from "@/lib/hooks/use-jobs";
import { useContracts } from "@/lib/hooks/use-contracts";
import { useWorkerMatching } from "@/lib/hooks/use-matching";
import { formatCurrency } from "@/lib/utils";

export default function CompanyDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useCompanyStats();
  const { jobs, loading: jobsLoading } = useJobs({ limit: 2 });
  const { contracts, loading: contractsLoading } = useContracts();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { matches: workerMatches, loading: matchLoading, error: matchError, fetchMatches } = useWorkerMatching(selectedJobId);

  if (authLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏗️</span>
            <div>
              <h1 className="font-heading text-xl font-bold text-dark">{profile?.name ?? "기업"}</h1>
              <p className="text-sm text-gray-500">기업 대시보드</p>
            </div>
          </div>
          <Link href="/search">
            <Button variant="secondary" size="sm">인력 검색</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon="📋" label="활성 공고" value={`${stats.activePostings}건`} sub={`이번 달 ${stats.thisMonth.postings}건`} />
          <StatCard icon="👥" label="총 지원자" value={`${stats.totalApplicants}명`} sub={`이번 달 채용 ${stats.thisMonth.hires}명`} />
          <StatCard icon="📝" label="진행중 계약" value={`${stats.contractsInProgress}건`} />
          <StatCard icon="💳" label="총 지출" value={formatCurrency(stats.totalSpent)} sub={`프로젝트 ${stats.completedProjects}건`} />
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">내 공고 현황</h2>
            <Link href="/jobs/new" className="text-sm text-terracotta font-medium hover:underline cursor-pointer">공고 등록</Link>
          </div>
          <div className="space-y-3">
            {jobsLoading ? (
              <p className="text-center py-4 text-gray-400 animate-pulse">로딩 중...</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-terracotta/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-dark">{job.title}</p>
                    <p className="text-xs text-gray-500">지원자 {job.applicant_count}명 · 마감 {job.deadline}</p>
                  </div>
                  <Badge variant="terracotta">모집중</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">AI 인력 추천</h2>
          </div>
          <div className="mb-3">
            <select
              className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white"
              value={selectedJobId ?? ""}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
            >
              <option value="">공고를 선택하세요</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
          {selectedJobId && (
            <button
              onClick={fetchMatches}
              disabled={matchLoading}
              className="w-full mb-3 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta/90 disabled:opacity-50 cursor-pointer"
            >
              {matchLoading ? "AI 분석 중..." : "AI 인력 매칭 시작"}
            </button>
          )}
          {matchError && (
            <p className="text-xs text-terracotta mb-2">{matchError}</p>
          )}
          {workerMatches.length === 0 && !matchLoading && !matchError && selectedJobId && (
            <p className="text-center py-2 text-gray-400 text-sm">버튼을 눌러 추천 인력을 확인하세요</p>
          )}
          {matchLoading && (
            <p className="text-center py-4 text-gray-400 animate-pulse text-sm">AI가 최적 인력을 분석 중...</p>
          )}
          {workerMatches.length > 0 && (
            <div className="space-y-2">
              {workerMatches.map((m) => (
                <Link key={m.worker_id} href={`/workers/${m.worker_id}`} className="block">
                  <div className="flex items-center justify-between p-3 bg-terracotta/5 rounded-xl hover:bg-terracotta/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark">{m.worker_name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.reasons.join(" · ")}</p>
                    </div>
                    <Badge variant="success">{m.score}점</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">최근 계약</h2>
            <Link href="/payment" className="text-sm text-terracotta font-medium hover:underline">전체보기</Link>
          </div>
          <div className="space-y-3">
            {contractsLoading ? (
              <p className="text-center py-4 text-gray-400 animate-pulse">로딩 중...</p>
            ) : contracts.length === 0 ? (
              <p className="text-center py-4 text-gray-400">계약 내역이 없습니다</p>
            ) : (
              contracts.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👷</span>
                    <div>
                      <p className="text-sm font-medium text-dark">{c.worker_profiles?.profiles?.name ?? "기술자"}</p>
                      <p className="text-xs text-gray-500">{c.jobs?.title ?? "작업"} · {formatCurrency(c.total_amount)}</p>
                    </div>
                  </div>
                  <Badge variant={c.status === "active" ? "success" : c.status === "completed" ? "sage" : "warning"}>
                    {c.status === "active" ? "진행중" : c.status === "completed" ? "완료" : c.status === "pending" ? "대기" : "취소"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
