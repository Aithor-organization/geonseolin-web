"use client";

import { useState, useCallback } from "react";

export interface AnalysisData {
  application_id: string;
  match_score: number;
  match_grade: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  score_breakdown: Record<string, { score: number; max: number; detail: string }>;
}

export function useApplicantAnalysis(jobId: string) {
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants/analyze`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("분석 실패");
      const data = await res.json();
      setAnalyses(data.analyses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const confirmApplicant = useCallback(
    async (appId: string, body: Record<string, unknown>) => {
      const res = await fetch(`/api/jobs/${jobId}/applicants/${appId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    },
    [jobId]
  );

  return { analyses, loading, error, triggerAnalysis, confirmApplicant };
}
