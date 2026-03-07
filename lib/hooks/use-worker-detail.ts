"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface WorkerDetail {
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
  profiles: {
    name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

export interface WorkerReview {
  id: string;
  rating: number;
  categories: { label: string; score: number }[];
  comment: string | null;
  created_at: string;
  company_profiles: {
    company_name: string | null;
    profiles: { name: string; avatar_url: string | null };
  };
}

export function useWorkerDetail(workerId: string) {
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerId) return;

    const supabase = getSupabaseBrowserClient();

    async function load() {
      setLoading(true);
      setError(null);

      const { data: w, error: wErr } = await supabase
        .from("worker_profiles")
        .select("*, profiles!inner(name, email, avatar_url, phone)")
        .eq("id", workerId)
        .single();

      if (wErr) {
        setError("기술자를 찾을 수 없습니다");
        setLoading(false);
        return;
      }

      setWorker(w as unknown as WorkerDetail);

      const { data: r } = await supabase
        .from("reviews")
        .select("id, rating, categories, comment, created_at, review_type, company_profiles(company_name, profiles(name, avatar_url))")
        .eq("worker_id", workerId)
        .eq("review_type", "company_to_worker")
        .order("created_at", { ascending: false })
        .limit(10);

      setReviews((r as unknown as WorkerReview[]) ?? []);
      setLoading(false);
    }

    load();
  }, [workerId]);

  return { worker, reviews, loading, error };
}
