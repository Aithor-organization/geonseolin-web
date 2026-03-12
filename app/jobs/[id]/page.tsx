"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useJob } from "@/lib/hooks/use-jobs";
import { useAuth } from "@/contexts/AuthContext";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { job, loading } = useJob(id);
  const { profile } = useAuth();
  const applied = searchParams.get("applied") === "true";

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

  const isCompany = profile?.role === "company";
  const isClosed = job.status === "closed" || (job.deadline && new Date(job.deadline) < new Date());

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>

        <div className={`${isClosed ? "bg-gray-100" : "bg-sage/10"} rounded-2xl p-6 mb-6`}>
          <div className="flex items-start gap-4">
            <span className="text-5xl">🏗️</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-dark">{job.title}</h1>
                {isClosed && <Badge variant="muted">마감</Badge>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{job.company_profiles?.company_name ?? ""}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {job.location && <Badge variant="sage">{job.location}</Badge>}
                {job.salary && <Badge variant="terracotta">{job.salary}</Badge>}
                {job.type && <Badge variant="muted">{job.type}</Badge>}
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">공고 상세</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span>등록일: {job.posted_at ? new Date(job.posted_at).toLocaleDateString("ko-KR") : "-"}</span>
            <span>마감일: {job.deadline ?? "-"}</span>
            <span>지원자: {job.applicant_count}명</span>
          </div>
        </Card>

        {job.requirements && job.requirements.length > 0 && (
          <Card className="mb-4">
            <h2 className="font-heading font-semibold text-dark mb-3">자격 요건</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-sage mt-0.5">✓</span>
                  {req}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {job.benefits && job.benefits.length > 0 && (
          <Card className="mb-6">
            <h2 className="font-heading font-semibold text-dark mb-3">복리후생</h2>
            <div className="flex flex-wrap gap-2">
              {job.benefits.map((b, i) => (
                <Badge key={i} variant="sage">{b}</Badge>
              ))}
            </div>
          </Card>
        )}

        {applied && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl">
            지원이 완료되었습니다! <Link href="/applications" className="underline font-medium">지원 내역 확인</Link>
          </div>
        )}

        {isClosed && !isCompany && (
          <div className="mb-4 p-3 bg-gray-100 text-gray-500 text-sm rounded-xl text-center">
            이 공고는 마감되었습니다. 내용만 확인할 수 있습니다.
          </div>
        )}

        {isCompany ? (
          <div className="flex gap-3">
            <Link href={`/jobs/${id}/applicants`} className="flex-1">
              <Button variant="outline" fullWidth size="lg">지원자 보기</Button>
            </Link>
            <Link href={`/jobs/${id}/edit`} className="flex-1">
              <Button fullWidth size="lg">공고 수정</Button>
            </Link>
          </div>
        ) : isClosed ? (
          <Link href="/jobs" className="block">
            <Button variant="outline" fullWidth size="lg">다른 공고 보기</Button>
          </Link>
        ) : (
          <div className="flex gap-3">
            <Link href="/chat" className="flex-1">
              <Button variant="outline" fullWidth size="lg">채팅 문의</Button>
            </Link>
            <Link href={`/jobs/${id}/apply`} className="flex-1">
              <Button fullWidth size="lg" disabled={applied}>
                {applied ? "지원 완료" : "지원하기"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
