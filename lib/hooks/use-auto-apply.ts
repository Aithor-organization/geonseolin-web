"use client";

import { useState, useEffect, useCallback } from "react";

interface AutoApplySettings {
  enabled: boolean;
  max_daily_applications: number;
  apply_time: string;
  preferred_locations: string[];
  min_daily_rate: number;
  job_types: string[];
  exclude_keywords: string[];
  templates: { id: string; name: string; content: string }[];
  active_template_id: string | null;
}

interface LogEntry {
  id: string;
  job_id: string;
  match_score: number;
  match_reasons: string[];
  generated_message: string;
  status: string;
  executed_at: string;
  jobs?: { title: string; location: string | null; salary: string | null };
}

export function useAutoApplySettings() {
  const [settings, setSettings] = useState<AutoApplySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/auto-apply/settings");
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (data: Partial<AutoApplySettings>) => {
    const merged = { ...settings, ...data };
    const res = await fetch("/api/auto-apply/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    if (res.ok) setSettings(merged as AutoApplySettings);
    return res.ok;
  };

  return { settings, loading, save, refetch: load };
}

export function useAutoApplyLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ today_applied: 0, today_skipped: 0, total_applied: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/auto-apply/logs");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? { today_applied: 0, today_skipped: 0, total_applied: 0 });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { logs, stats, loading, refetch: load };
}
