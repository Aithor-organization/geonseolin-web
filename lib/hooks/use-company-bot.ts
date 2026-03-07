"use client";

import { useState, useEffect, useCallback } from "react";

interface BotSettings {
  enabled: boolean;
  schedule_mode: string;
  custom_start_time?: string;
  custom_end_time?: string;
  tone: string;
  escalation_keywords: string[];
  notify_on_escalation: boolean;
  greeting_message?: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  priority: number;
  use_count: number;
}

export function useCompanyBotSettings() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/company-bot/settings");
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (data: Partial<BotSettings>) => {
    const merged = { ...settings, ...data };
    const res = await fetch("/api/company-bot/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    if (res.ok) setSettings(merged as BotSettings);
    return res.ok;
  };

  return { settings, loading, save, refetch: load };
}

export function useCompanyBotFaq() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/company-bot/faq");
    if (res.ok) setFaqs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFaq = async (data: { question: string; answer: string; category?: string; priority?: number }) => {
    const res = await fetch("/api/company-bot/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await load();
    return res.ok;
  };

  const updateFaq = async (id: string, data: { question: string; answer: string; category?: string; priority?: number }) => {
    const res = await fetch(`/api/company-bot/faq/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await load();
    return res.ok;
  };

  const deleteFaq = async (id: string) => {
    const res = await fetch(`/api/company-bot/faq/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    return res.ok;
  };

  return { faqs, loading, addFaq, updateFaq, deleteFaq, refetch: load };
}
