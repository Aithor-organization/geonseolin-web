"use client";

import { useState, useCallback } from "react";

interface JobMatch {
  job_id: string;
  score: number;
  reason: string;
}

interface WorkerMatch {
  worker_id: string;
  worker_name: string;
  score: number;
  reasons: string[];
}

// 기술자용: AI 추천 공고
export function useJobMatching() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/matching?type=jobs");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "매칭 실패");
        return;
      }
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  return { matches, loading, error, fetchMatches };
}

// 기업용: AI 추천 인력
export function useWorkerMatching(jobId: string | null) {
  const [matches, setMatches] = useState<WorkerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matching?type=workers&job_id=${jobId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "매칭 실패");
        return;
      }
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  return { matches, loading, error, fetchMatches };
}
