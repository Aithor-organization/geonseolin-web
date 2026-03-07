"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import StepBar from "@/components/ui/StepBar";
import FilterChips from "@/components/features/FilterChips";
import ProfileCompletionBanner from "@/components/features/ProfileCompletionBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerProfile } from "@/lib/hooks/use-profile";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";

const STEPS = ["개인정보", "기본정보", "경력", "자격증", "완료"];
const SKILLS = [
  "배관", "전기", "인테리어", "철근", "도장", "목공",
  "타일", "방수", "용접", "조적", "미장", "지붕",
];
const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주",
  "대전", "울산", "세종", "강원", "충북", "충남",
];

export default function WorkerProfilePage() {
  const { profile: authProfile, user } = useAuth();
  const { profile, update, loading } = useWorkerProfile();
  const { completion, refetch: refetchCompletion } = useProfileCompletion();

  const [step, setStep] = useState(0);

  // Step 0: 개인정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");

  // Step 1: 기본정보
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");

  // Step 2: 경력
  const [careerCompany, setCareerCompany] = useState("");
  const [careerPeriod, setCareerPeriod] = useState("");
  const [careerDuty, setCareerDuty] = useState("");

  // Step 3: 자격증
  const [certs, setCerts] = useState<{ name: string; date: string; issuer: string }[]>([
    { name: "", date: "", issuer: "" },
  ]);

  const [saving, setSaving] = useState(false);

  // 개인정보 로드 (profiles 테이블)
  useEffect(() => {
    if (authProfile) {
      setName(authProfile.name ?? "");
    }
    if (user) {
      setPhone(user.user_metadata?.phone ?? user.phone ?? "");
    }
  }, [authProfile, user]);

  // 개인정보 추가 필드 로드 (birth_date, address)
  useEffect(() => {
    async function loadPersonalInfo() {
      if (!user) return;
      const res = await fetch("/api/workers/me/personal");
      if (res.ok) {
        const data = await res.json();
        if (data.birth_date) setBirthDate(data.birth_date);
        if (data.address) setAddress(data.address);
        if (data.phone) setPhone(data.phone);
      }
    }
    loadPersonalInfo();
  }, [user]);

  // worker_profiles 로드
  useEffect(() => {
    if (profile) {
      setSpecialty(profile.specialty ?? "");
      setExperience(profile.experience?.toString() ?? "");
      setBio(profile.bio ?? "");
      setSelectedSkills(profile.skills ?? []);
      setHourlyRate(profile.hourly_rate?.toString() ?? "");
      if (profile.location) setSelectedRegions([profile.location]);
    }
  }, [profile]);

  const addCert = () => setCerts([...certs, { name: "", date: "", issuer: "" }]);
  const updateCert = (i: number, field: string, value: string) => {
    const next = [...certs];
    next[i] = { ...next[i], [field]: value };
    setCerts(next);
  };
  const removeCert = (i: number) => setCerts(certs.filter((_, idx) => idx !== i));

  const savePersonalInfo = async () => {
    const res = await fetch("/api/workers/me/personal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim() || null,
        birth_date: birthDate || null,
        address: address.trim() || null,
      }),
    });
    return res.ok;
  };

  const handleComplete = async () => {
    setSaving(true);

    // 1. 개인정보 저장 (profiles 테이블)
    await savePersonalInfo();

    // 2. 기술 프로필 저장 (worker_profiles 테이블)
    await update({
      specialty,
      experience: parseInt(experience) || 0,
      bio,
      skills: selectedSkills,
      hourly_rate: parseInt(hourlyRate) || 0,
      location: selectedRegions[0] ?? "",
      available: true,
    });

    // 3. 경력 저장
    if (careerCompany.trim()) {
      await fetch("/api/workers/me/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: careerCompany.trim(),
          work_period: careerPeriod.trim() || null,
          responsibility: careerDuty.trim() || null,
        }),
      });
    }

    // 4. 자격증 저장
    const validCerts = certs.filter((c) => c.name.trim());
    for (const cert of validCerts) {
      await fetch("/api/workers/me/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cert.name.trim(),
          acquired_date: cert.date || null,
          issuer: cert.issuer.trim() || null,
        }),
      });
    }

    await refetchCompletion();
    setSaving(false);
    setStep(4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 bg-parchment">
      <div className="max-w-lg mx-auto">
        {/* 프로필 완성도 배너 */}
        {completion && step < 4 && (
          <div className="mb-4">
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

        <div className="mb-8">
          <StepBar steps={STEPS} current={step} />
        </div>

        {/* Step 0: 개인정보 (필수) */}
        {step === 0 && (
          <Card padding="lg">
            <h2 className="font-heading text-xl font-semibold mb-2">개인정보</h2>
            <p className="text-xs text-gray-500 mb-6">아래 정보는 프로필 완성에 필수입니다</p>
            <div className="flex flex-col gap-4">
              <Input
                label="이름 *"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="연락처 *"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="생년월일 *"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <Input
                label="주소 (선택)"
                placeholder="예: 서울시 강남구"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button
              fullWidth
              size="lg"
              className="mt-6"
              onClick={() => setStep(1)}
              disabled={!name.trim()}
            >
              다음
            </Button>
          </Card>
        )}

        {/* Step 1: 기본정보 */}
        {step === 1 && (
          <Card padding="lg">
            <h2 className="font-heading text-xl font-semibold mb-6">기본 정보</h2>
            <div className="flex flex-col gap-4">
              <Input label="전문 분야 *" placeholder="예: 배관공" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              <Input label="경력 (년) *" type="number" placeholder="예: 10" value={experience} onChange={(e) => setExperience(e.target.value)} />
              <Input label="희망 일당 (원) *" type="number" placeholder="예: 350000" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              <div>
                <p className="text-sm font-medium text-dark mb-2">보유 기술 *</p>
                <FilterChips options={SKILLS} selected={selectedSkills} onChange={setSelectedSkills} />
              </div>
              <div>
                <label className="text-sm font-medium text-dark block mb-1.5">자기소개 *</label>
                <textarea
                  className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-muted bg-white text-dark placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors resize-none h-24"
                  placeholder="간단한 자기소개를 작성해주세요"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" fullWidth onClick={() => setStep(0)}>이전</Button>
              <Button fullWidth onClick={() => setStep(2)}>다음</Button>
            </div>
          </Card>
        )}

        {/* Step 2: 경력 */}
        {step === 2 && (
          <Card padding="lg">
            <h2 className="font-heading text-xl font-semibold mb-6">경력 사항</h2>
            <div className="flex flex-col gap-4">
              <Input label="최근 회사/현장명" placeholder="예: 한양건설 강남 현장" value={careerCompany} onChange={(e) => setCareerCompany(e.target.value)} />
              <Input label="근무 기간" placeholder="예: 2023.01 - 2024.06" value={careerPeriod} onChange={(e) => setCareerPeriod(e.target.value)} />
              <Input label="담당 업무" placeholder="예: 배관 설치 및 유지보수" value={careerDuty} onChange={(e) => setCareerDuty(e.target.value)} />
              <div>
                <p className="text-sm font-medium text-dark mb-2">선호 근무 지역</p>
                <FilterChips options={REGIONS} selected={selectedRegions} onChange={setSelectedRegions} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" fullWidth onClick={() => setStep(1)}>이전</Button>
              <Button fullWidth onClick={() => setStep(3)}>다음</Button>
            </div>
          </Card>
        )}

        {/* Step 3: 자격증 */}
        {step === 3 && (
          <Card padding="lg">
            <h2 className="font-heading text-xl font-semibold mb-6">자격증</h2>
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
            <p className="text-xs text-gray-400 mt-2">자격증이 없으면 비워두고 완료해도 됩니다</p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" fullWidth onClick={() => setStep(2)}>이전</Button>
              <Button fullWidth onClick={handleComplete} disabled={saving}>
                {saving ? "저장 중..." : "완료"}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: 완료 */}
        {step === 4 && (
          <Card padding="lg">
            <div className="text-center py-8">
              <span className="text-6xl block mb-4">🎉</span>
              <h2 className="font-heading text-2xl font-bold text-sage-dark mb-2">프로필 저장 완료!</h2>
              {completion && (
                <p className="text-lg font-semibold text-sage mb-2">
                  프로필 완성도: {completion.percentage}%
                </p>
              )}
              <p className="text-gray-500 mb-6">
                {completion && completion.percentage < 100
                  ? "부족한 항목을 채우면 더 많은 기회를 얻을 수 있어요"
                  : "이제 일자리를 찾아볼 수 있습니다"}
              </p>
              <Link href="/dashboard/worker">
                <Button size="lg">대시보드로 이동</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
