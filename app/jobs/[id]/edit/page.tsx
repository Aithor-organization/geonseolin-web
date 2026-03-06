"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const JOB_TYPES = ["정규직", "계약직", "일용직", "파견"];

export default function EditJobPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) { setError("공고를 찾을 수 없습니다"); setFetching(false); return; }
      const data = await res.json();
      setForm({
        title: data.title ?? "",
        location: data.location ?? "",
        salary: data.salary ?? "",
        type: data.type ?? "일용직",
        description: data.description ?? "",
        requirements: (data.requirements ?? []).join("\n"),
        benefits: (data.benefits ?? []).join("\n"),
        deadline: data.deadline ? data.deadline.split("T")[0] : "",
      });
      setFetching(false);
    }
    load();
  }, [id]);

  if (profile?.role !== "company") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-parchment">
        <p className="text-gray-500">권한이 없습니다</p>
      </div>
    );
  }

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        location: form.location || null,
        salary: form.salary || null,
        type: form.type,
        description: form.description || null,
        requirements: form.requirements ? form.requirements.split("\n").filter(Boolean) : [],
        benefits: form.benefits ? form.benefits.split("\n").filter(Boolean) : [],
        deadline: form.deadline || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "수정에 실패했습니다");
      setLoading(false);
      return;
    }

    router.push("/dashboard/company");
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 공고를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/company");
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-parchment">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-bold text-dark">공고 수정</h1>
          <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">삭제</button>
        </div>

        <Card>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input label="공고 제목 *" value={form.title} onChange={handleChange("title")} />
            <Input label="근무지" value={form.location} onChange={handleChange("location")} />

            <div className="grid grid-cols-2 gap-3">
              <Input label="급여" value={form.salary} onChange={handleChange("salary")} />
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
                value={form.description}
                onChange={handleChange("description")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">자격 요건 (줄바꿈으로 구분)</label>
              <textarea
                className="w-full border border-muted rounded-xl px-4 py-2.5 text-sm bg-white min-h-[80px] resize-y"
                value={form.requirements}
                onChange={handleChange("requirements")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">복리후생 (줄바꿈으로 구분)</label>
              <textarea
                className="w-full border border-muted rounded-xl px-4 py-2.5 text-sm bg-white min-h-[80px] resize-y"
                value={form.benefits}
                onChange={handleChange("benefits")}
              />
            </div>

            <Input label="마감일" type="date" value={form.deadline} onChange={handleChange("deadline")} />

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" fullWidth onClick={() => router.back()}>취소</Button>
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "수정 중..." : "공고 수정"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
