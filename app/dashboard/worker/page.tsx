"use client";

import Link from "next/link";
import StatCard from "@/components/features/StatCard";
import JobCard from "@/components/features/JobCard";
import ProfileCompletionBanner from "@/components/features/ProfileCompletionBanner";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStats } from "@/lib/hooks/use-profile";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
import { useJobs, type JobRow } from "@/lib/hooks/use-jobs";
import { useContracts } from "@/lib/hooks/use-contracts";
import { useJobMatching } from "@/lib/hooks/use-matching";
import { formatCurrency } from "@/lib/utils";

function toJobCardData(j: JobRow) {
  return {
    id: j.id,
    title: j.title,
    company: j.company_profiles?.company_name ?? "",
    companyLogo: "🏗️",
    location: j.location ?? "",
    salary: j.salary ?? "",
    type: j.type ?? "",
    posted: j.posted_at,
    deadline: j.deadline ?? "",
    description: j.description ?? "",
    requirements: j.requirements,
    benefits: j.benefits,
    applicants: j.applicant_count,
  };
}

export default function WorkerDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useWorkerStats();
  const { completion } = useProfileCompletion();
  const { jobs, loading: jobsLoading } = useJobs({ limit: 3 });
  const { contracts: activeContracts, loading: contractsLoading } = useContracts("active");
  const { matches: aiMatches, loading: matchLoading, error: matchError, disabled: matchDisabled, fetchMatches } = useJobMatching();

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
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">👷</span>
          <div>
            <h1 className="font-heading text-xl font-bold text-dark">
              안녕하세요, {profile?.name ?? "기술자"}님!
            </h1>
            <p className="text-sm text-gray-500">오늘도 좋은 하루 되세요</p>
          </div>
        </div>

        {/* 프로필 완성도 배너 */}
        {completion && <ProfileCompletionBanner completion={completion} />}

        {/* AI 자동 지원 배너 */}
        {stats.todayAutoApplied != null && stats.todayAutoApplied > 0 && (
          <Link href="/settings/auto-apply" className="block mb-4">
            <div className="flex items-center gap-3 p-3 bg-sage/10 rounded-xl">
              <span className="text-xl">🤖</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark">
                  오늘 AI 자동 지원 {stats.todayAutoApplied}건
                </p>
                <p className="text-xs text-gray-500">자동 지원 설정에서 확인하세요</p>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon="💰" label="이번 달 수입" value={formatCurrency(stats.thisMonth.earnings)} sub={`총 ${formatCurrency(stats.totalEarnings)}`} />
          <StatCard icon="🔨" label="완료한 작업" value={stats.completedJobs} sub={`이번 달 ${stats.thisMonth.jobs}건`} />
          <StatCard icon="⭐" label="평균 평점" value={stats.averageRating} sub={`리뷰 ${stats.completedJobs}개`} />
          <StatCard icon="👁️" label="프로필 조회" value={stats.profileViews} sub="최근 30일" />
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">진행 중인 작업</h2>
            <Badge variant="success">{activeContracts.length}건</Badge>
          </div>
          <div className="space-y-3">
            {contractsLoading ? (
              <p className="text-center py-4 text-gray-400 animate-pulse">로딩 중...</p>
            ) : activeContracts.length === 0 ? (
              <p className="text-center py-4 text-gray-400">진행 중인 작업이 없습니다</p>
            ) : (
              activeContracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-sage/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-dark">{c.jobs?.title ?? "작업"}</p>
                    <p className="text-xs text-gray-500">
                      {c.company_profiles?.profiles?.name ?? "기업"} · {c.start_date ?? ""} ~ {c.end_date ?? ""}
                    </p>
                  </div>
                  <Badge variant="sage">진행중</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">AI 추천 일자리</h2>
            <button
              onClick={fetchMatches}
              disabled={matchLoading}
              className="text-sm text-sage font-medium hover:underline disabled:opacity-50 cursor-pointer"
            >
              {matchLoading ? "분석 중..." : "AI 매칭 시작"}
            </button>
          </div>
          {matchDisabled && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">AI 매칭이 비활성화되어 있습니다</p>
              <Link href="/settings/ai-matching" className="text-sm text-sage font-medium hover:underline">
                설정에서 활성화하기 →
              </Link>
            </div>
          )}
          {matchError && !matchDisabled && (
            <p className="text-xs text-terracotta mb-2">{matchError}</p>
          )}
          {aiMatches.length === 0 && !matchLoading && !matchError && !matchDisabled && (
            <p className="text-center py-4 text-gray-400 text-sm">
              &quot;AI 매칭 시작&quot; 버튼을 눌러 맞춤 공고를 추천받으세요
            </p>
          )}
          {matchLoading && (
            <p className="text-center py-4 text-gray-400 animate-pulse text-sm">AI가 최적의 공고를 분석 중...</p>
          )}
          {aiMatches.length > 0 && (
            <div className="space-y-2">
              {aiMatches.map((m) => (
                <Link key={m.job_id} href={`/jobs/${m.job_id}`} className="block">
                  <div className="flex items-center justify-between p-3 bg-sage/5 rounded-xl hover:bg-sage/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">{m.reason}</p>
                    </div>
                    <Badge variant="success">{m.score}점</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">최근 공고</h2>
            <Link href="/jobs" className="text-sm text-sage font-medium hover:underline">전체보기</Link>
          </div>
          <div className="flex flex-col gap-3">
            {jobsLoading ? (
              <p className="text-center py-8 text-gray-400 animate-pulse">로딩 중...</p>
            ) : (
              jobs.map((job) => (
                <JobCard key={job.id} job={toJobCardData(job)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
