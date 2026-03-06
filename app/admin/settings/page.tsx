"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const [feeRate, setFeeRate] = useState("5");
  const [minDailyRate, setMinDailyRate] = useState("150000");
  const [autoMatch, setAutoMatch] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.fee_rate !== undefined) setFeeRate(String(data.fee_rate));
        if (data.min_daily_rate !== undefined) setMinDailyRate(String(data.min_daily_rate));
        if (data.auto_match !== undefined) setAutoMatch(data.auto_match);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fee_rate: parseFloat(feeRate),
          min_daily_rate: parseInt(minDailyRate, 10),
          auto_match: autoMatch,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-sage-dark mb-6">설정</h1>

      <div className="space-y-6 max-w-2xl">
        {/* 플랫폼 설정 */}
        <Card padding="lg">
          <h3 className="font-heading text-base font-semibold text-dark mb-4">플랫폼 설정</h3>
          {loading ? (
            <div className="py-8 text-center text-gray-400 animate-pulse">로딩 중...</div>
          ) : (
            <div className="space-y-4">
              <Input
                label="플랫폼 수수료율 (%)"
                type="number"
                value={feeRate}
                onChange={(e) => setFeeRate(e.target.value)}
                placeholder="5"
              />
              <Input
                label="최소 일당 (원)"
                type="number"
                value={minDailyRate}
                onChange={(e) => setMinDailyRate(e.target.value)}
                placeholder="150000"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark">자동 매칭 활성화</p>
                  <p className="text-xs text-gray-400 mt-0.5">AI 기반 자동 매칭 시스템을 활성화합니다</p>
                </div>
                <button
                  onClick={() => setAutoMatch(!autoMatch)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    autoMatch ? "bg-sage" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      autoMatch ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="pt-2">
                <Button onClick={handleSave} size="sm" disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
                {saved && (
                  <span className="ml-3 text-sm text-green-600">설정이 저장되었습니다</span>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 관리자 계정 */}
        <Card padding="lg">
          <h3 className="font-heading text-base font-semibold text-dark mb-4">관리자 계정</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">이름</span>
              <span className="text-sm text-dark font-medium">{profile?.name ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <span className="text-sm text-gray-500">이메일</span>
              <span className="text-sm text-dark">{profile?.email ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <span className="text-sm text-gray-500">역할</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                관리자
              </span>
            </div>
          </div>
        </Card>

        {/* 시스템 정보 */}
        <Card padding="lg">
          <h3 className="font-heading text-base font-semibold text-dark mb-4">시스템 정보</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Supabase 프로젝트</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-600">연결됨</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <span className="text-sm text-gray-500">API 버전</span>
              <span className="text-sm text-dark">v1</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <span className="text-sm text-gray-500">플랫폼</span>
              <span className="text-sm text-dark">Next.js + Supabase</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
