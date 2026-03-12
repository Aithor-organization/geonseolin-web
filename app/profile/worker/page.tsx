"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import FilterChips from "@/components/features/FilterChips";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const SKILLS = [
  "배관", "전기", "인테리어", "철근", "도장", "목공",
  "타일", "방수", "용접", "조적", "미장", "지붕",
];
const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주",
  "대전", "울산", "세종", "강원", "충북", "충남",
];

interface CompletionData {
  percentage: number;
  message: string;
}

export default function WorkerProfilePage() {
  const { profile: authProfile, user, loading: authLoading } = useAuth();

  // 개인정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");

  // 기본정보
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");

  // 경력
  const [careerCompany, setCareerCompany] = useState("");
  const [careerPeriod, setCareerPeriod] = useState("");
  const [careerDuty, setCareerDuty] = useState("");

  // 자격증
  const [certs, setCerts] = useState<{ name: string; date: string; issuer: string }[]>([
    { name: "", date: "", issuer: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [completion, setCompletion] = useState<CompletionData | null>(null);

  // 모든 데이터를 병렬로 한번에 로드
  useEffect(() => {
    if (authLoading || !user) return;

    async function loadAllData() {
      const supabase = getSupabaseBrowserClient();

      // 3개 요청을 병렬로 실행
      const [workerRes, personalRes, completionRes] = await Promise.all([
        supabase.from("worker_profiles").select("*").eq("id", user!.id).single(),
        fetch("/api/workers/me/personal"),
        fetch("/api/workers/me/completion"),
      ]);

      // worker_profiles 데이터 적용
      if (workerRes.data) {
        const wp = workerRes.data;
        setSpecialty(wp.specialty ?? "");
        setExperience(wp.experience?.toString() ?? "");
        setBio(wp.bio ?? "");
        setSelectedSkills(wp.skills ?? []);
        setHourlyRate(wp.hourly_rate?.toString() ?? "");
        if (wp.location) setSelectedRegions([wp.location]);
      }

      // personal 데이터 적용
      if (personalRes.ok) {
        const pd = await personalRes.json();
        if (pd.birth_date) setBirthDate(pd.birth_date);
        if (pd.address) setAddress(pd.address);
        if (pd.phone) setPhone(pd.phone);
      }

      // completion 데이터 적용
      if (completionRes.ok) {
        const cd = await completionRes.json();
        setCompletion(cd);
      }

      setDataLoading(false);
    }

    // authProfile에서 이름 로드
    if (authProfile) {
      setName(authProfile.name ?? "");
    }
    if (user) {
      setPhone(user.user_metadata?.phone ?? user.phone ?? "");
    }

    loadAllData();
  }, [authLoading, user, authProfile]);

  const addCert = () => setCerts([...certs, { name: "", date: "", issuer: "" }]);
  const updateCert = (i: number, field: string, value: string) => {
    const next = [...certs];
    next[i] = { ...next[i], [field]: value };
    setCerts(next);
  };
  const removeCert = (i: number) => setCerts(certs.filter((_, idx) => idx !== i));

  const refreshCompletion = useCallback(async () => {
    const res = await fetch("/api/workers/me/completion");
    if (res.ok) setCompletion(await res.json());
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const supabase = getSupabaseBrowserClient();

    // 모든 저장을 병렬로 실행
    const savePromises: Promise<unknown>[] = [
      // 1. 개인정보 저장
      fetch("/api/workers/me/personal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          address: address.trim() || null,
        }),
      }),
      // 2. 기술 프로필 저장
      Promise.resolve(
        supabase.from("worker_profiles").update({
          specialty,
          experience: parseInt(experience) || 0,
          bio,
          skills: selectedSkills,
          hourly_rate: parseInt(hourlyRate) || 0,
          location: selectedRegions[0] ?? "",
          available: true,
        }).eq("id", user!.id)
      ),
    ];

    // 3. 경력 저장 (값이 있을 때만)
    if (careerCompany.trim()) {
      savePromises.push(
        fetch("/api/workers/me/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: careerCompany.trim(),
            work_period: careerPeriod.trim() || null,
            responsibility: careerDuty.trim() || null,
          }),
        })
      );
    }

    // 4. 자격증 저장 (값이 있을 때만)
    const validCerts = certs.filter((c) => c.name.trim());
    for (const cert of validCerts) {
      savePromises.push(
        fetch("/api/workers/me/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cert.name.trim(),
            acquired_date: cert.date || null,
            issuer: cert.issuer.trim() || null,
          }),
        })
      );
    }

    await Promise.all(savePromises);
    await refreshCompletion();
    setSaving(false);
    setSaved(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 bg-parchment">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-dark">내 프로필</h1>
          <p className="text-sm text-gray-500 mt-1">프로필을 완성하면 더 많은 기회를 얻을 수 있어요</p>
        </div>

        {/* 프로필 완성도 배너 */}
        {completion && (
          <div className="mb-6">
            <div className="p-4 bg-white rounded-2xl border border-sage/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-dark">프로필 완성도</span>
                <span className="text-sm font-bold text-sage">{completion.percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completion.percentage}%`,
                    backgroundColor:
                      completion.percentage >= 70 ? "#6B8F71" : completion.percentage >= 40 ? "#E8A87C" : "#E07A5F",
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">{completion.message}</p>
            </div>
          </div>
        )}

        {/* 저장 완료 알림 */}
        {saved && (
          <div className="mb-6 p-4 bg-sage/10 border border-sage/30 rounded-2xl text-center">
            <p className="text-sm font-semibold text-sage-dark">프로필이 저장되었습니다!</p>
            <Link href="/dashboard/worker" className="text-xs text-sage hover:underline mt-1 inline-block">
              대시보드로 이동
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* 개인정보 */}
          <Card padding="lg">
            <h2 className="font-heading text-lg font-semibold mb-4">개인정보</h2>
            <div className="flex flex-col gap-4">
              <Input label="이름 *" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="연락처" type="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="생년월일" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              <Input label="주소" placeholder="예: 서울시 강남구" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </Card>

          {/* 기본정보 */}
          <Card padding="lg">
            <h2 className="font-heading text-lg font-semibold mb-4">기본 정보</h2>
            <div className="flex flex-col gap-4">
              <Input label="전문 분야 *" placeholder="예: 배관공" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              <Input label="경력 (년)" type="number" placeholder="예: 10" value={experience} onChange={(e) => setExperience(e.target.value)} />
              <Input label="희망 일당 (원)" type="number" placeholder="예: 350000" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              <div>
                <p className="text-sm font-medium text-dark mb-2">보유 기술</p>
                <FilterChips options={SKILLS} selected={selectedSkills} onChange={setSelectedSkills} />
              </div>
              <div>
                <label className="text-sm font-medium text-dark block mb-1.5">자기소개</label>
                <textarea
                  className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-muted bg-white text-dark placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors resize-none h-24"
                  placeholder="간단한 자기소개를 작성해주세요"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* 경력 */}
          <Card padding="lg">
            <h2 className="font-heading text-lg font-semibold mb-4">경력 사항</h2>
            <div className="flex flex-col gap-4">
              <Input label="최근 회사/현장명" placeholder="예: 한양건설 강남 현장" value={careerCompany} onChange={(e) => setCareerCompany(e.target.value)} />
              <Input label="근무 기간" placeholder="예: 2023.01 - 2024.06" value={careerPeriod} onChange={(e) => setCareerPeriod(e.target.value)} />
              <Input label="담당 업무" placeholder="예: 배관 설치 및 유지보수" value={careerDuty} onChange={(e) => setCareerDuty(e.target.value)} />
              <div>
                <p className="text-sm font-medium text-dark mb-2">선호 근무 지역</p>
                <FilterChips options={REGIONS} selected={selectedRegions} onChange={setSelectedRegions} />
              </div>
            </div>
          </Card>

          {/* 자격증 */}
          <Card padding="lg">
            <h2 className="font-heading text-lg font-semibold mb-4">자격증</h2>
            <div className="flex flex-col gap-5">
              {certs.map((cert, i) => (
                <div key={i} className="flex flex-col gap-3 p-3 bg-muted/30 rounded-xl relative">
                  {certs.length > 1 && (
                    <button
                      onClick={() => removeCert(i)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs cursor-pointer"
                    >
                      삭제
                    </button>
                  )}
                  <Input label="자격증명" placeholder="예: 배관기능사" value={cert.name} onChange={(e) => updateCert(i, "name", e.target.value)} />
                  <Input label="취득일" type="date" value={cert.date} onChange={(e) => updateCert(i, "date", e.target.value)} />
                  <Input label="발급기관" placeholder="예: 한국산업인력공단" value={cert.issuer} onChange={(e) => updateCert(i, "issuer", e.target.value)} />
                </div>
              ))}
              <button onClick={addCert} className="text-sm text-sage font-medium hover:underline text-left cursor-pointer">
                + 자격증 추가
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">자격증이 없으면 비워두셔도 됩니다</p>
          </Card>

          {/* 저장 버튼 */}
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? "저장 중..." : "프로필 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
