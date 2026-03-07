"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/supabase/types";

type WorkerRow = Database["public"]["Tables"]["worker_profiles"]["Row"];
type CompanyRow = Database["public"]["Tables"]["company_profiles"]["Row"];
type WorkerUpdate = Database["public"]["Tables"]["worker_profiles"]["Update"];
type CompanyUpdate = Database["public"]["Tables"]["company_profiles"]["Update"];

export function useWorkerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkerRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("id", user.id)
      .single() as { data: WorkerRow | null };
    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const update = async (values: WorkerUpdate) => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("worker_profiles")
      .update(values)
      .eq("id", user.id);
    if (!error) await fetch();
    return error;
  };

  return { profile, loading, update, refetch: fetch };
}

export function useCompanyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", user.id)
      .single() as { data: CompanyRow | null };
    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const update = async (values: CompanyUpdate) => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("company_profiles")
      .update(values)
      .eq("id", user.id);
    if (!error) await fetch();
    return error;
  };

  return { profile, loading, update, refetch: fetch };
}

export function useWorkerStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedJobs: 0,
    averageRating: 0,
    profileViews: 0,
    todayAutoApplied: 0 as number | null,
    thisMonth: { earnings: 0, jobs: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const res = await window.fetch("/api/workers/me/stats");
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({
          ...prev,
          totalEarnings: data.total_earnings ?? data.totalEarnings ?? 0,
          completedJobs: data.completed_jobs ?? data.completedJobs ?? 0,
          averageRating: data.rating ?? data.averageRating ?? 0,
          profileViews: data.profile_views ?? data.profileViews ?? 0,
          todayAutoApplied: data.today_auto_applied ?? 0,
          thisMonth: data.thisMonth ?? prev.thisMonth,
        }));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return { stats, loading };
}

export function useCompanyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activePostings: 0,
    totalApplicants: 0,
    contractsInProgress: 0,
    completedProjects: 0,
    totalSpent: 0,
    thisMonth: { postings: 0, hires: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const res = await window.fetch("/api/companies/me/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return { stats, loading };
}
