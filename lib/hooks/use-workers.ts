"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface WorkerRow {
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
    avatar_url: string | null;
  };
}

export type WorkerSortBy = "rating" | "experience" | "hourly_low" | "hourly_high";

interface WorkerFilters {
  specialty?: string;
  location?: string;
  search?: string;
  available?: boolean;
  minExp?: number;
  maxExp?: number;
  sortBy?: WorkerSortBy;
  page?: number;
  limit?: number;
}

export function useWorkers(filters: WorkerFilters = {}) {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();

    let query = supabase
      .from("worker_profiles")
      .select("*, profiles!inner(name, avatar_url)", { count: "exact" });

    if (filters.specialty && filters.specialty !== "전체") {
      query = query.eq("specialty", filters.specialty);
    }
    if (filters.location && filters.location !== "전체") {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.search) {
      query = query.or(
        `specialty.ilike.%${filters.search}%,bio.ilike.%${filters.search}%,skills.cs.{${filters.search}}`
      );
    }
    if (filters.available !== undefined) {
      query = query.eq("available", filters.available);
    }
    if (filters.minExp !== undefined) {
      query = query.gte("experience", filters.minExp);
    }
    if (filters.maxExp !== undefined) {
      query = query.lte("experience", filters.maxExp);
    }

    const from = (page - 1) * limit;
    const sortBy = filters.sortBy ?? "rating";
    if (sortBy === "experience") {
      query = query.range(from, from + limit - 1).order("experience", { ascending: false });
    } else if (sortBy === "hourly_low") {
      query = query.range(from, from + limit - 1).order("hourly_rate", { ascending: true });
    } else if (sortBy === "hourly_high") {
      query = query.range(from, from + limit - 1).order("hourly_rate", { ascending: false });
    } else {
      query = query.range(from, from + limit - 1).order("rating", { ascending: false });
    }

    const { data, count, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setWorkers((data as unknown as WorkerRow[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.specialty, filters.location, filters.search, filters.available, filters.minExp, filters.maxExp, filters.sortBy, page, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { workers, total, loading, error, refetch: fetch };
}
