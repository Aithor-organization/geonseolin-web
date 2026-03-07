"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useJob } from "@/lib/hooks/use-jobs";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";

export default function JobApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { job, loading: jobLoading } = useJob(id);
  const { completion, loading: completionLoading } = useProfileCompletion();

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isProfileComplete = completion?.percentage === 100;
  const loading = jobLoading || completionLoading;

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("자기소개/각오를 작성해주세요");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "지원에 실패했습니다");
      } else {
        router.push(`/jobs/${id}?applied=true`);
      }
    } catch {
      setError("지원에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="text-5xl block mb-3">📋</span>
          <p className="text-gray-500">공고를 찾을 수 없습니다</p>
          <Link href="/jobs" className="text-sage hover:underline text-sm mt-2 inline-block">목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>

        <h1 className="font-heading text-xl font-bold text-dark mb-4">공고 지원</h1>

        {/* 공고 정보 요약 */}
        <Card className="mb-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🏗️</span>
            <div>
              <p className="font-semibold text-dark">{job.title}</p>
              <p className="text-sm text-gray-500">{job.company_profiles?.company_name ?? ""}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.location && <Badge variant="sage">{job.location}</Badge>}
                {job.salary && <Badge variant="terracotta">{job.salary}</Badge>}
              </div>
            </div>
          </div>
        </Card>

        {/* 프로필 완성도 체크 */}
        {!isProfileComplete && completion && (
          <Card className="mb-4 border-2 border-terracotta/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-terracotta text-sm">프로필을 100% 완성해야 지원할 수 있습니다</p>
                <p className="text-xs text-gray-500 mt-1">현재 완성도: {completion.percentage}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-terracotta h-2 rounded-full transition-all"
                    style={{ width: `${completion.percentage}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {completion.fields
                    .filter((f: { filled: boolean }) => !f.filled)
                    .map((f: { key: string; label: string }) => (
                      <span key={f.key} className="text-xs bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full">
                        {f.label}
                      </span>
                    ))}
                </div>
                <Link href="/profile/worker" className="inline-block mt-3 text-sm text-sage font-medium hover:underline">
                  프로필 완성하러 가기 →
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* 지원서 작성 폼 */}
        {isProfileComplete && (
          <>
            <Card className="mb-4">
              <label className="block font-semibold text-dark text-sm mb-2">
                자기소개 / 각오 <span className="text-terracotta">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                이 공고에 지원하는 이유, 본인의 강점, 작업에 대한 각오 등을 작성해주세요.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="예: 저는 철근 시공 경력 10년의 기술자입니다. 꼼꼼한 작업과 안전관리에 자신 있으며, 팀워크를 중시합니다..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm min-h-[160px] resize-y focus:ring-2 focus:ring-sage/50 focus:border-sage outline-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
            </Card>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
            >
              {submitting ? "지원 중..." : "지원하기"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
