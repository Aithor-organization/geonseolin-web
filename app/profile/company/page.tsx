"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyProfile } from "@/lib/hooks/use-profile";

export default function CompanyProfilePage() {
  const { profile: authProfile } = useAuth();
  const { profile, update, loading } = useCompanyProfile();

  const [companyName, setCompanyName] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [ceo, setCeo] = useState("");
  const [industry, setIndustry] = useState("");
  const [employees, setEmployees] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name ?? "");
      setBizNumber(profile.biz_number ?? "");
      setCeo(profile.ceo ?? "");
      setIndustry(profile.industry ?? "");
      setEmployees(profile.employees ?? "");
      setAddress(profile.address ?? "");
      setDescription(profile.description ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await update({
      company_name: companyName,
      biz_number: bizNumber,
      ceo,
      industry,
      employees,
      address,
      description,
    });
    setSaving(false);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-parchment">
        <Card padding="lg" className="max-w-md w-full">
          <div className="text-center py-8">
            <span className="text-6xl block mb-4">🏢</span>
            <h2 className="font-heading text-2xl font-bold text-terracotta-dark mb-2">기업 등록 완료!</h2>
            <p className="text-gray-500 mb-6">인력을 검색하고 공고를 등록해보세요</p>
            <Link href="/dashboard/company">
              <Button variant="secondary" size="lg">대시보드로 이동</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 bg-parchment">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">🏢</span>
          <h1 className="font-heading text-2xl font-bold text-terracotta-dark">기업 정보 등록</h1>
          <p className="text-gray-500 mt-1 text-sm">기업 정보를 등록하고 인력을 찾아보세요</p>
        </div>

        <Card padding="lg">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label="기업명" placeholder="OO건설" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Input label="사업자등록번호" placeholder="000-00-00000" value={bizNumber} onChange={(e) => setBizNumber(e.target.value)} />
            <Input label="대표자명" placeholder="홍길동" value={ceo} onChange={(e) => setCeo(e.target.value)} />
            <Input label="업종" placeholder="종합건설업" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            <Input label="직원 수" type="number" placeholder="예: 50" value={employees} onChange={(e) => setEmployees(e.target.value)} />
            <Input label="회사 주소" placeholder="서울시 강남구 테헤란로 123" value={address} onChange={(e) => setAddress(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-dark block mb-1.5">회사 소개</label>
              <textarea
                className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-muted bg-white text-dark placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-colors resize-none h-24"
                placeholder="회사를 간단히 소개해주세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button variant="secondary" fullWidth size="lg" type="submit" className="mt-2" disabled={saving}>
              {saving ? "저장 중..." : "등록 완료"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
