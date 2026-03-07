"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import Badge from "@/components/ui/Badge";
import { useCompanyBotSettings } from "@/lib/hooks/use-company-bot";

export default function CompanyBotSettingsPage() {
  const router = useRouter();
  const { settings, loading, save } = useCompanyBotSettings();
  const [saving, setSaving] = useState(false);
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

  const addKeyword = () => {
    if (!kwInput.trim()) return;
    handleSave({
      escalation_keywords: [...(settings.escalation_keywords ?? []), kwInput.trim()],
    });
    setKwInput("");
  };

  const removeKeyword = (kw: string) => {
    handleSave({
      escalation_keywords: (settings.escalation_keywords ?? []).filter((k) => k !== kw),
    });
  };

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>
        <h1 className="font-heading text-xl font-bold text-dark mb-6">AI 챗봇 관리</h1>

        <Card className="mb-4">
          <Toggle
            checked={settings.enabled}
            onChange={(v) => handleSave({ enabled: v })}
            label="챗봇 활성화"
            description="기술자 질문에 AI가 자동으로 응답합니다"
          />
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">응대 시간</h2>
          <div className="space-y-2">
            {["always", "off_hours", "custom"].map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={settings.schedule_mode === mode}
                  onChange={() => handleSave({ schedule_mode: mode })}
                />
                {mode === "always" ? "항상 (24시간)" : mode === "off_hours" ? "업무 외 시간만" : "사용자 지정"}
              </label>
            ))}
          </div>
          {settings.schedule_mode === "custom" && (
            <div className="flex gap-2 mt-3">
              <input type="time" value={settings.custom_start_time ?? "18:00"} onChange={(e) => handleSave({ custom_start_time: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <span className="text-sm text-gray-500 self-center">~</span>
              <input type="time" value={settings.custom_end_time ?? "09:00"} onChange={(e) => handleSave({ custom_end_time: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
          )}
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">답변 톤</h2>
          <div className="flex gap-2">
            {(["formal", "polite", "concise"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleSave({ tone: t })}
                className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${settings.tone === t ? "bg-sage text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {t === "formal" ? "격식체" : t === "polite" ? "친근한" : "간결한"}
              </button>
            ))}
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">에스컬레이션 키워드</h2>
          <div className="flex flex-wrap gap-1 mb-3">
            {(settings.escalation_keywords ?? []).map((kw) => (
              <Badge key={kw} variant="warning">
                {kw}
                <button onClick={() => removeKeyword(kw)} className="ml-1 cursor-pointer">×</button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="키워드 추가"
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            />
            <Button size="sm" onClick={addKeyword}>추가</Button>
          </div>
        </Card>

        <Card className="mb-4">
          <Toggle
            checked={settings.notify_on_escalation ?? true}
            onChange={(v) => handleSave({ notify_on_escalation: v })}
            label="에스컬레이션 알림"
            description="AI가 담당자 연결이 필요하다고 판단 시 알림을 보냅니다"
          />
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">인사말</h2>
          <textarea
            className="w-full px-3 py-2 border rounded-lg text-sm"
            rows={2}
            placeholder="안녕하세요! 무엇을 도와드릴까요?"
            value={settings.greeting_message ?? ""}
            onChange={(e) => handleSave({ greeting_message: e.target.value })}
          />
        </Card>

        <Button fullWidth onClick={() => router.push("/settings/company-bot/faq")} variant="outline">
          FAQ 관리 →
        </Button>

        {saving && <p className="text-center text-xs text-gray-400 mt-2">저장 중...</p>}
      </div>
    </div>
  );
}
