"use client";

import { useState } from "react";
import Link from "next/link";
import JobCard from "@/components/features/JobCard";
import FilterChips from "@/components/features/FilterChips";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useJobs, type JobRow, type JobSortBy } from "@/lib/hooks/use-jobs";
import { useJobMatching } from "@/lib/hooks/use-matching";
import { useFavorites } from "@/lib/hooks/use-favorites";

const JOB_TYPES = ["전체", "정규직", "계약직", "일용직", "파견"];
const REGIONS = ["전체", "서울", "경기", "인천", "부산", "대구", "광주"];
const PER_PAGE = 6;

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

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["전체"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["전체"]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<JobSortBy>("latest");
  const { matches: aiMatches, loading: matchLoading, error: matchError, fetchMatches } = useJobMatching();
  const [favOnly, setFavOnly] = useState(false);
  const { isJobFavorite, toggleJob } = useFavorites();

  const type = selectedTypes.includes("전체") ? undefined : selectedTypes[0];
  const location = selectedRegions.includes("전체") ? undefined : selectedRegions[0];

  const { jobs, total, loading } = useJobs({
    type,
    location,
    search: query || undefined,
    sortBy,
    page,
    limit: PER_PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const handleFilterChange = (setter: (v: string[]) => void) => (v: string[]) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-4">일자리 찾기</h1>

        <div className="mb-4">
          <Input
            placeholder="공고명, 지역, 직종으로 검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">고용 형태</p>
          <FilterChips options={JOB_TYPES} selected={selectedTypes} onChange={handleFilterChange(setSelectedTypes)} />
        </div>
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-1.5">지역</p>
          <FilterChips options={REGIONS} selected={selectedRegions} onChange={handleFilterChange(setSelectedRegions)} />
        </div>

        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark flex items-center gap-2">
              <span>🤖</span> AI 추천 일자리
            </h2>
            <button
              onClick={fetchMatches}
              disabled={matchLoading}
              className="text-sm text-sage font-medium hover:underline disabled:opacity-50 cursor-pointer"
            >
              {matchLoading ? "분석 중..." : "AI 매칭 시작"}
            </button>
          </div>
          {matchError && (
            <p className="text-xs text-terracotta mb-2">{matchError}</p>
          )}
          {aiMatches.length === 0 && !matchLoading && !matchError && (
            <p className="text-center py-3 text-gray-400 text-sm">
              AI가 내 프로필에 맞는 공고를 추천합니다
            </p>
          )}
          {matchLoading && (
            <p className="text-center py-3 text-gray-400 animate-pulse text-sm">AI가 최적의 공고를 분석 중...</p>
          )}
          {aiMatches.length > 0 && (
            <div className="space-y-2">
              {aiMatches.map((m) => (
                <Link key={m.job_id} href={`/jobs/${m.job_id}`} className="block">
                  <div className="flex items-center justify-between p-3 bg-sage/5 rounded-xl hover:bg-sage/10 transition-colors">
                    <p className="text-xs text-gray-500 truncate flex-1 min-w-0">{m.reason}</p>
                    <Badge variant="success" className="ml-2 shrink-0">{m.score}점</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">검색 결과 {total}건</p>
            <button
              onClick={() => setFavOnly(!favOnly)}
              className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${favOnly ? "bg-red-50 text-red-500 border-red-200" : "bg-white text-gray-400 border-gray-200"}`}
            >
              ❤️ 즐겨찾기
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as JobSortBy); setPage(1); }}
            className="text-sm border border-muted rounded-lg px-3 py-1.5 bg-white text-dark focus:outline-none focus:ring-2 focus:ring-sage/30"
          >
            <option value="latest">최신순</option>
            <option value="salary_high">급여순</option>
            <option value="applicants">인기순</option>
          </select>
        </div>

        {loading ? (
          <ListSkeleton count={3} />
        ) : (
          <div className="flex flex-col gap-3">
            {(favOnly ? jobs.filter((j) => isJobFavorite(j.id)) : jobs).map((job) => (
              <JobCard key={job.id} job={toJobCardData(job)} isFavorite={isJobFavorite(job.id)} onToggleFavorite={toggleJob} />
            ))}
            {(favOnly ? jobs.filter((j) => isJobFavorite(j.id)) : jobs).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-3">📋</span>
                <p>등록된 공고가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
