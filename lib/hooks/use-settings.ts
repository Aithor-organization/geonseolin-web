"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Settings {
  push_enabled: boolean;
  email_enabled: boolean;
  chat_enabled: boolean;
  profile_public: boolean;
  location_enabled: boolean;
  ai_matching_enabled: boolean;
  matching_min_score: number;
  matching_max_results: number;
  matching_preferred_locations: string[];
  matching_preferred_types: string[];
}

const defaultSettings: Settings = {
  push_enabled: true,
  email_enabled: true,
  chat_enabled: true,
  profile_public: true,
  location_enabled: false,
  ai_matching_enabled: true,
  matching_min_score: 50,
  matching_max_results: 5,
  matching_preferred_locations: [],
  matching_preferred_types: [],
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings); // optimistic

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      // 실패 시 롤백
      setSettings(settings);
    }
  };

  return { settings, loading, updateSettings };
}
