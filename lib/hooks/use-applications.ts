"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ApplicationRow {
  id: string;
  job_id: string;
  worker_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  is_auto_applied?: boolean;
  created_at: string;
  jobs?: { title: string; location: string | null; company_id: string | null } | null;
  worker_profiles?: { id: string; specialty: string | null; profiles: { name: string } | null } | null;
}

export function useMyApplications() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    const apps = data ?? [];
    // 공고 정보 별도 조회
    const jobIds = [...new Set(apps.map((a) => a.job_id))];
    const { data: jobs } = jobIds.length > 0
      ? await supabase.from("jobs").select("id, title, location, company_id").in("id", jobIds)
      : { data: [] as any[] };

    const jobMap = Object.fromEntries((jobs ?? []).map((j: any) => [j.id, j]));
    const result: ApplicationRow[] = apps.map((a) => ({
      ...a,
      jobs: jobMap[a.job_id] ?? null,
    }));

    setApplications(result);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { applications, loading, refresh: load };
}

export function useJobApplications(jobId: string) {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    const apps = data ?? [];
    // 기술자 프로필 별도 조회
    const workerIds = [...new Set(apps.map((a) => a.worker_id))];
    const { data: workers } = workerIds.length > 0
      ? await supabase.from("worker_profiles").select("id, specialty").in("id", workerIds)
      : { data: [] as any[] };
    const { data: profiles } = workerIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", workerIds)
      : { data: [] as any[] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    const workerMap = Object.fromEntries((workers ?? []).map((w: any) => [w.id, {
      ...w,
      profiles: profileMap[w.id] ?? null,
    }]));

    const result: ApplicationRow[] = apps.map((a) => ({
      ...a,
      worker_profiles: workerMap[a.worker_id] ?? null,
    }));

    setApplications(result);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (applicationId: string, status: "accepted" | "rejected") => {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);
    load();
  };

  return { applications, loading, updateStatus, refresh: load };
}
