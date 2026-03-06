"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface JobRow {
  id: string;
  company_id: string;
  title: string;
  location: string | null;
  salary: string | null;
  type: string | null;
  description: string | null;
  requirements: string[];
  benefits: string[];
  applicant_count: number;
  status: string;
  posted_at: string;
  deadline: string | null;
  company_profiles: {
    company_name: string | null;
  };
}

export type JobSortBy = "latest" | "salary_high" | "applicants";

interface JobFilters {
  location?: string;
  type?: string;
  search?: string;
  status?: string;
  sortBy?: JobSortBy;
  page?: number;
  limit?: number;
}

export function useJobs(filters: JobFilters = {}) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
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
      .from("jobs")
      .select("*, company_profiles!inner(company_name)", { count: "exact" })
      .eq("status", (filters.status ?? "active") as "active" | "closed" | "draft");

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.type) {
      query = query.ilike("type", `%${filters.type}%`);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const from = (page - 1) * limit;
    const sortBy = filters.sortBy ?? "latest";
    if (sortBy === "salary_high") {
      query = query.range(from, from + limit - 1).order("salary", { ascending: false, nullsFirst: false });
    } else if (sortBy === "applicants") {
      query = query.range(from, from + limit - 1).order("applicant_count", { ascending: false });
    } else {
      query = query.range(from, from + limit - 1).order("posted_at", { ascending: false });
    }

    const { data, count, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setJobs((data as unknown as JobRow[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.location, filters.type, filters.search, filters.status, filters.sortBy, page, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { jobs, total, loading, error, refetch: fetch };
}

export function useJob(id: string) {
  const [job, setJob] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("jobs")
        .select("*, company_profiles!inner(company_name)")
        .eq("id", id)
        .single();
      setJob(data as unknown as JobRow | null);
      setLoading(false);
    }
    load();
  }, [id]);

  return { job, loading };
}
