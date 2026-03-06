"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface ContractRow {
  id: string;
  job_id: string | null;
  worker_id: string | null;
  company_id: string | null;
  daily_rate: number;
  work_days: number;
  total_amount: number;
  start_date: string | null;
  end_date: string | null;
  status: "pending" | "active" | "completed" | "cancelled";
  created_at: string;
  jobs: { title: string } | null;
  worker_profiles: { id: string; profiles: { name: string } } | null;
  company_profiles: { id: string; profiles: { name: string } } | null;
}

export function useContracts(statusFilter?: string) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await window.fetch("/api/contracts");
    if (res.ok) {
      const data: ContractRow[] = await res.json();
      setContracts(statusFilter ? data.filter((c) => c.status === statusFilter) : data);
    }
    setLoading(false);
  }, [user, statusFilter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { contracts, loading, refetch: fetch };
}
