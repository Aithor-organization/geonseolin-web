"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const JOB_TYPES = ["정규직", "계약직", "일용직", "파견"];

export default function NewJobPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    location: "",
    salary: "",
    type: "일용직",
    description: "",
    requirements: "",
    benefits: "",
    deadline: "",
  });

  if (profile?.role !== "company") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-parchment">
        <p className="text-gray-500">기업 회원만 공고를 등록할 수 있습니다</p>
      </div>
    );
  }

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.title.length < 5) {
      setError("제목은 5자 이상이어야 합니다");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("jobs")
      .insert({
        company_id: user!.id,
        title: form.title,
        location: form.location || null,
        salary: form.salary || null,
        type: form.type,
        description: form.description || null,
        requirements: form.requirements ? form.requirements.split("\n").filter(Boolean) : [],
        benefits: form.benefits ? form.benefits.split("\n").filter(Boolean) : [],
        deadline: form.deadline || null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/company");
  };

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">공고 등록</h1>

        <Card>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label="공고 제목 *" placeholder="예: 서울 강남 아파트 신축 현장 목공 모집" value={form.title} onChange={handleChange("title")} />
            <Input label="근무지" placeholder="서울 강남구" value={form.location} onChange={handleChange("location")} />

            <div className="grid grid-cols-2 gap-3">
              <Input label="급여" placeholder="일당 250,000원" value={form.salary} onChange={handleChange("salary")} />
              <div>
                <label className="block text-sm font-medium text-dark mb-1">고용 형태</label>
                <select
                  className="w-full border border-muted rounded-xl px-4 py-2.5 text-sm bg-white"
                  value={form.type}
                  onChange={handleChange("type")}
                >
                  {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">상세 설명</label>
              <textarea
                className="w-full border border-muted rounded-xl px-4 py-2.5 text-sm bg-white min-h-[100px] resize-y"
                placeholder="공고 상세 내용을 입력하세요"
                value={form.description}
                onChange={handleChange("description")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">자격 요건 (줄바꿈으로 구분)</label>
              <textarea
                className="w-full border border-muted rounded-xl px-4 py-2.5 text-sm bg-white min-h-[80px] resize-y"
                placeholder="건축기사 자격증 보유&#10;경력 3년 이상"
                value={form.requirements}
                onChange={handleChange("requirements")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">복리후생 (줄바꿈으로 구분)</label>
              <textarea
                className="w-full border border-muted rounded-xl px-4 py-2.5 text-sm bg-white min-h-[80px] resize-y"
                placeholder="중식 제공&#10;교통비 지원"
                value={form.benefits}
                onChange={handleChange("benefits")}
              />
            </div>

            <Input label="마감일" type="date" value={form.deadline} onChange={handleChange("deadline")} />

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" fullWidth onClick={() => router.back()}>취소</Button>
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "등록 중..." : "공고 등록"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
