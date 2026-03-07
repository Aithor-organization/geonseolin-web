"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkerCard from "@/components/features/WorkerCard";
import FilterChips from "@/components/features/FilterChips";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useWorkers, type WorkerRow, type WorkerSortBy } from "@/lib/hooks/use-workers";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useWorkerMatching } from "@/lib/hooks/use-matching";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useAuth } from "@/contexts/AuthContext";

const SPECIALTIES = ["전체", "배관공", "전기기사", "인테리어", "철근공", "도장공", "목수"];
const REGIONS = ["전체", "서울", "경기", "인천"];
const PER_PAGE = 4;

// WorkerRow를 WorkerCard가 기대하는 형태로 변환
function toWorkerCardData(w: WorkerRow) {
  return {
    id: w.id,
    name: w.profiles?.name ?? "이름없음",
    avatar: w.profiles?.avatar_url ?? "👷",
    specialty: w.specialty ?? "",
    experience: w.experience,
    rating: w.rating,
    reviews: w.review_count,
    location: w.location ?? "",
    hourlyRate: w.hourly_rate,
    available: w.available,
    skills: w.skills,
    completedJobs: w.completed_jobs,
    bio: w.bio ?? "",
  };
}

export default function SearchPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["전체"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["전체"]);
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<WorkerSortBy>("rating");
  const [expRange, setExpRange] = useState<string>("all");
  const { jobs: myJobs, loading: jobsLoading } = useJobs({ limit: 10 });
  const { matches: workerMatches, loading: matchLoading, error: matchError, fetchMatches } = useWorkerMatching(selectedJobId);
  const { isWorkerFavorite, toggleWorker } = useFavorites();

  // 인력 검색은 기업 전용 기능
  if (profile && profile.role !== "company" && profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-parchment">
        <div className="text-center">
          <span className="text-5xl block mb-3">🔒</span>
          <p className="text-gray-500 mb-2">인력 검색은 기업 회원 전용 기능입니다</p>
          <button onClick={() => router.push("/jobs")} className="text-sage hover:underline text-sm cursor-pointer">일자리 찾기로 이동</button>
        </div>
      </div>
    );
  }

  const specialty = selectedSpecialties.includes("전체") ? undefined : selectedSpecialties[0];
  const location = selectedRegions.includes("전체") ? undefined : selectedRegions[0];

  const expFilters = expRange === "0-3" ? { minExp: 0, maxExp: 3 }
    : expRange === "3-10" ? { minExp: 3, maxExp: 10 }
    : expRange === "10+" ? { minExp: 10 } : {};

  const { workers, total, loading } = useWorkers({
    specialty,
    location,
    search: query || undefined,
    sortBy,
    ...expFilters,
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
        <h1 className="font-heading text-2xl font-bold text-dark mb-4">인력 검색</h1>

        <div className="mb-4">
          <Input
            placeholder="이름, 기술, 분야로 검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">전문 분야</p>
          <FilterChips options={SPECIALTIES} selected={selectedSpecialties} onChange={handleFilterChange(setSelectedSpecialties)} />
        </div>
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">지역</p>
          <FilterChips options={REGIONS} selected={selectedRegions} onChange={handleFilterChange(setSelectedRegions)} />
        </div>
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-1.5">경력</p>
          <div className="flex gap-2">
            {[
              { value: "all", label: "전체" },
              { value: "0-3", label: "3년 이하" },
              { value: "3-10", label: "3~10년" },
              { value: "10+", label: "10년 이상" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setExpRange(opt.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors ${expRange === opt.value ? "bg-sage text-white border-sage" : "bg-white text-gray-600 border-gray-200 hover:border-sage"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark flex items-center gap-2">
              <span>🤖</span> AI 인력 추천
            </h2>
          </div>
          <div className="mb-3">
            <select
              className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white"
              value={selectedJobId ?? ""}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
            >
              <option value="">공고를 선택하세요</option>
              {myJobs.map((job) => (
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
          {workerMatches.length === 0 && !matchLoading && !matchError && !selectedJobId && (
            <p className="text-center py-3 text-gray-400 text-sm">
              공고를 선택하면 AI가 최적의 인력을 추천합니다
            </p>
          )}
          {matchLoading && (
            <p className="text-center py-3 text-gray-400 animate-pulse text-sm">AI가 최적 인력을 분석 중...</p>
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
                    <Badge variant="success" className="ml-2 shrink-0">{m.score}점</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">검색 결과 {total}명</p>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as WorkerSortBy); setPage(1); }}
            className="text-sm border border-muted rounded-lg px-3 py-1.5 bg-white text-dark focus:outline-none focus:ring-2 focus:ring-sage/30"
          >
            <option value="rating">평점순</option>
            <option value="experience">경력순</option>
            <option value="hourly_low">단가 낮은순</option>
            <option value="hourly_high">단가 높은순</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3 animate-pulse">🔍</span>
            <p>검색 중...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workers.map((w) => (
              <WorkerCard key={w.id} worker={toWorkerCardData(w)} isFavorite={isWorkerFavorite(w.id)} onToggleFavorite={toggleWorker} />
            ))}
            {workers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-3">🔍</span>
                <p>검색 결과가 없습니다</p>
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
