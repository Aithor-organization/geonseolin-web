"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { CompletionResult } from "@/lib/profile-completeness";

export function useProfileCompletion() {
  const { user } = useAuth();
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await window.fetch("/api/workers/me/completion");
    if (res.ok) {
      const data = await res.json();
      setCompletion(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { completion, loading, refetch: fetch };
}
