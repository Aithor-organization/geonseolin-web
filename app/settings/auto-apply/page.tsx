"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import Badge from "@/components/ui/Badge";
import AutoApplyLogCard from "@/components/features/AutoApplyLogCard";
import AutoApplyStats from "@/components/features/AutoApplyStats";
import TemplateManager from "@/components/features/TemplateManager";
import { useAutoApplySettings, useAutoApplyLogs } from "@/lib/hooks/use-auto-apply";

export default function AutoApplySettingsPage() {
  const router = useRouter();
  const { settings, loading, save } = useAutoApplySettings();
  const { logs, stats, loading: logsLoading } = useAutoApplyLogs();
  const [saving, setSaving] = useState(false);
  const [locInput, setLocInput] = useState("");
  const [kwInput, setKwInput] = useState("");

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  const handleSave = async (updates: Record<string, unknown>) => {
    setSaving(true);
    await save(updates as Partial<typeof settings>);
    setSaving(false);
  };

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>
        <h1 className="font-heading text-xl font-bold text-dark mb-6">AI 자동 지원 설정</h1>

        <Card className="mb-4">
          <Toggle checked={settings.enabled} onChange={(v) => handleSave({ enabled: v })} label="자동 지원 활성화" description="AI가 매칭되는 공고에 자동으로 지원합니다" />
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">기본 설정</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">일일 최대 지원 수</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleSave({ max_daily_applications: n })}
                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${settings.max_daily_applications === n ? "bg-sage text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">자동 지원 시간</label>
              <input
                type="time"
                value={settings.apply_time}
                onChange={(e) => handleSave({ apply_time: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">선호 조건</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">선호 지역</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(settings.preferred_locations ?? []).map((loc) => (
                  <Badge key={loc} variant="sage">
                    {loc}
                    <button onClick={() => handleSave({ preferred_locations: settings.preferred_locations.filter((l) => l !== loc) })} className="ml-1 cursor-pointer">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="지역 추가" value={locInput} onChange={(e) => setLocInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && locInput.trim()) { handleSave({ preferred_locations: [...(settings.preferred_locations ?? []), locInput.trim()] }); setLocInput(""); } }} />
                <Button size="sm" onClick={() => { if (locInput.trim()) { handleSave({ preferred_locations: [...(settings.preferred_locations ?? []), locInput.trim()] }); setLocInput(""); } }}>추가</Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">최소 일당</label>
              <input type="number" value={settings.min_daily_rate} onChange={(e) => handleSave({ min_daily_rate: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">공고 유형</label>
              <div className="flex gap-3">
                {["일용직", "단기", "장기"].map((type) => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={(settings.job_types ?? []).includes(type)}
                      onChange={() => {
                        const cur = settings.job_types ?? [];
                        handleSave({ job_types: cur.includes(type) ? cur.filter((t) => t !== type) : [...cur, type] });
                      }}
                      className="accent-sage w-4 h-4"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">제외 키워드</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(settings.exclude_keywords ?? []).map((kw) => (
                  <Badge key={kw} variant="terracotta">
                    {kw}
                    <button onClick={() => handleSave({ exclude_keywords: settings.exclude_keywords.filter((k) => k !== kw) })} className="ml-1 cursor-pointer">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="키워드 추가" value={kwInput} onChange={(e) => setKwInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && kwInput.trim()) { handleSave({ exclude_keywords: [...(settings.exclude_keywords ?? []), kwInput.trim()] }); setKwInput(""); } }} />
                <Button size="sm" onClick={() => { if (kwInput.trim()) { handleSave({ exclude_keywords: [...(settings.exclude_keywords ?? []), kwInput.trim()] }); setKwInput(""); } }}>추가</Button>
              </div>
            </div>
          </div>
        </Card>

        <TemplateManager
          templates={settings.templates ?? []}
          activeTemplateId={settings.active_template_id ?? null}
          onSave={(u) => handleSave(u)}
        />

        {!logsLoading && (
          <>
            <Card className="mb-4">
              <h2 className="font-heading font-semibold text-dark mb-3">통계</h2>
              <AutoApplyStats stats={stats} />
            </Card>

            {logs.length > 0 && (
              <Card>
                <h2 className="font-heading font-semibold text-dark mb-3">최근 자동 지원 내역</h2>
                <div className="space-y-2">
                  {logs.slice(0, 5).map((log) => (
                    <AutoApplyLogCard key={log.id} log={log} />
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {saving && <p className="text-center text-xs text-gray-400 mt-2">저장 중...</p>}
      </div>
    </div>
  );
}
