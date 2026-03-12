"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toggle from "@/components/ui/Toggle";
import Button from "@/components/ui/Button";
import { useSettings } from "@/lib/hooks/use-settings";

const LOCATION_OPTIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const TYPE_OPTIONS = [
  "철근", "콘크리트", "형틀", "도장", "방수", "전기", "설비",
  "용접", "배관", "타일", "미장", "조적", "목공", "인테리어", "토목",
];

export default function AiMatchingSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, loading } = useSettings();
  const [saving, setSaving] = useState(false);

  // 로컬 상태 (즉시 반영 후 저장)
  const [minScore, setMinScore] = useState<number | null>(null);
  const [maxResults, setMaxResults] = useState<number | null>(null);
  const [locations, setLocations] = useState<string[] | null>(null);
  const [types, setTypes] = useState<string[] | null>(null);

  const currentMinScore = minScore ?? settings.matching_min_score;
  const currentMaxResults = maxResults ?? settings.matching_max_results;
  const currentLocations = locations ?? settings.matching_preferred_locations;
  const currentTypes = types ?? settings.matching_preferred_types;

  const toggleChip = (
    list: string[],
    item: string,
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      matching_min_score: currentMinScore,
      matching_max_results: currentMaxResults,
      matching_preferred_locations: currentLocations,
      matching_preferred_types: currentTypes,
    });
    setSaving(false);
    router.push("/settings");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-sm text-sage mb-4 hover:underline cursor-pointer">
          ← 설정으로 돌아가기
        </button>
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">AI 매칭 세부 설정</h1>

        {/* 활성화 토글 */}
        <Card className="mb-4">
          <Toggle
            checked={settings.ai_matching_enabled}
            onChange={(v) => updateSettings({ ai_matching_enabled: v })}
            label="AI 매칭 활성화"
            description="비활성화 시 AI 추천 기능이 중지됩니다"
          />
        </Card>

        {/* 최소 매칭 점수 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-2">최소 매칭 점수</h2>
          <p className="text-xs text-gray-500 mb-3">
            이 점수 이상인 결과만 표시됩니다 (0~100)
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={currentMinScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="flex-1 accent-sage"
            />
            <span className="text-sm font-semibold text-dark w-12 text-right">
              {currentMinScore}점
            </span>
          </div>
        </Card>

        {/* 최대 결과 수 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-2">최대 결과 수</h2>
          <p className="text-xs text-gray-500 mb-3">
            한 번에 표시할 최대 추천 수 (1~20)
          </p>
          <div className="flex items-center gap-3">
            {[3, 5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setMaxResults(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentMaxResults === n
                    ? "bg-sage text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {n}개
              </button>
            ))}
          </div>
        </Card>

        {/* 선호 지역 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-2">선호 지역</h2>
          <p className="text-xs text-gray-500 mb-3">
            선택한 지역의 공고/인력을 우선 추천합니다 (미선택 시 전체)
          </p>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => toggleChip(currentLocations, loc, setLocations)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  currentLocations.includes(loc)
                    ? "bg-sage text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </Card>

        {/* 선호 공종 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-2">선호 공종</h2>
          <p className="text-xs text-gray-500 mb-3">
            선택한 공종의 공고/인력을 우선 추천합니다 (미선택 시 전체)
          </p>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => toggleChip(currentTypes, t, setTypes)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  currentTypes.includes(t)
                    ? "bg-sage text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        <Button fullWidth onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  );
}
