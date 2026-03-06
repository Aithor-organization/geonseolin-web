"use client";

import { useEffect, useState } from "react";
import JobCard from "@/components/features/JobCard";
import WorkerCard from "@/components/features/WorkerCard";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface FavJob {
  id: string;
  title: string;
  location: string | null;
  salary: string | null;
  type: string | null;
  deadline: string | null;
  description: string | null;
  applicant_count: number;
  requirements: string[];
  benefits: string[];
  posted_at: string;
  company_profiles: { company_name: string | null };
}

interface FavWorker {
  id: string;
  specialty: string | null;
  experience: number;
  bio: string | null;
  location: string | null;
  hourly_rate: number;
  available: boolean;
  skills: string[];
  rating: number;
  review_count: number;
  completed_jobs: number;
  profiles: { name: string; avatar_url: string | null };
}

export default function FavoritesPage() {
  const { favorites, isJobFavorite, isWorkerFavorite, toggleJob, toggleWorker } = useFavorites();
  const [tab, setTab] = useState<"jobs" | "workers">("jobs");
  const [favJobs, setFavJobs] = useState<FavJob[]>([]);
  const [favWorkers, setFavWorkers] = useState<FavWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();

      if (favorites.jobs.length > 0) {
        const { data } = await supabase
          .from("jobs")
          .select("*, company_profiles!inner(company_name)")
          .in("id", favorites.jobs);
        setFavJobs((data as unknown as FavJob[]) ?? []);
      } else {
        setFavJobs([]);
      }

      if (favorites.workers.length > 0) {
        const { data } = await supabase
          .from("worker_profiles")
          .select("*, profiles!inner(name, avatar_url)")
          .in("id", favorites.workers);
        setFavWorkers((data as unknown as FavWorker[]) ?? []);
      } else {
        setFavWorkers([]);
      }

      setLoading(false);
    }
    load();
  }, [favorites.jobs, favorites.workers]);

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-4">즐겨찾기</h1>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("jobs")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors ${tab === "jobs" ? "bg-sage text-white" : "bg-white text-gray-500 border border-gray-200"}`}
          >
            공고 ({favorites.jobs.length})
          </button>
          <button
            onClick={() => setTab("workers")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors ${tab === "workers" ? "bg-terracotta text-white" : "bg-white text-gray-500 border border-gray-200"}`}
          >
            인력 ({favorites.workers.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">불러오는 중...</div>
        ) : tab === "jobs" ? (
          <div className="flex flex-col gap-3">
            {favJobs.map((j) => (
              <JobCard
                key={j.id}
                job={{
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
                }}
                isFavorite={isJobFavorite(j.id)}
                onToggleFavorite={toggleJob}
              />
            ))}
            {favJobs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-3">📋</span>
                <p>즐겨찾기한 공고가 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {favWorkers.map((w) => (
              <WorkerCard
                key={w.id}
                worker={{
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
                }}
                isFavorite={isWorkerFavorite(w.id)}
                onToggleFavorite={toggleWorker}
              />
            ))}
            {favWorkers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-3">👷</span>
                <p>즐겨찾기한 인력이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
