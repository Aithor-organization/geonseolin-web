"use client";

import { use, Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

const CATEGORIES = ["기술력", "시간 준수", "의사소통", "현장 정리"];

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 animate-pulse">로딩 중...</p></div>}>
      <ReviewContent params={params} />
    </Suspense>
  );
}

function ReviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();

  const [rating, setRating] = useState(0);
  const [categoryScores, setCategoryScores] = useState<number[]>([0, 0, 0, 0]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // URL 파라미터에서 worker_id, company_id 읽기
  const workerIdParam = searchParams.get("workerId") ?? "";
  const companyIdParam = searchParams.get("companyId") ?? "";
  const contractIdParam = searchParams.get("contractId") ?? "";

  useEffect(() => {
    async function loadContext() {
      // 기존 리뷰 수정 모드
      if (id !== "new") {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .eq("id", id)
          .single() as { data: ReviewRow | null };
        if (data) {
          setRating(data.rating);
          if (data.categories) {
            const cats = data.categories as unknown as { name: string; score: number }[];
            setCategoryScores(CATEGORIES.map((c) => cats.find((cat) => cat.name === c)?.score ?? 0));
          }
          setComment(data.comment ?? "");

          // 리뷰 대상자 이름 로드
          const { data: worker } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", data.worker_id)
            .single() as { data: { name: string } | null };
          if (worker) setWorkerName(worker.name);

          const { data: company } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", data.company_id)
            .single() as { data: { name: string } | null };
          if (company) setCompanyName(company.name);
        }
        return;
      }

      // 새 리뷰 작성 모드 - URL 파라미터에서 이름 로드
      if (workerIdParam) {
        const { data: worker } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", workerIdParam)
          .single() as { data: { name: string } | null };
        if (worker) setWorkerName(worker.name);
      }
      if (companyIdParam) {
        const { data: company } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", companyIdParam)
          .single() as { data: { name: string } | null };
        if (company) setCompanyName(company.name);
      }
    }
    loadContext();
  }, [id, supabase, workerIdParam, companyIdParam]);

  const setCatScore = (idx: number, score: number) => {
    const next = [...categoryScores];
    next[idx] = score;
    setCategoryScores(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const categories = CATEGORIES.map((name, i) => ({ name, score: categoryScores[i] }));

    // worker_id와 company_id 결정: URL 파라미터 > 현재 유저 role 기반
    const resolvedWorkerId = workerIdParam || (profile?.role === "worker" ? user?.id ?? "" : "");
    const resolvedCompanyId = companyIdParam || (profile?.role === "company" ? user?.id ?? "" : "");

    if (id === "new") {
      await supabase.from("reviews").insert({
        rating,
        categories: categories as unknown as Json,
        comment,
        worker_id: resolvedWorkerId,
        company_id: resolvedCompanyId,
        contract_id: contractIdParam || null,
      });
    } else {
      await supabase.from("reviews").update({ rating, categories: categories as unknown as Json, comment }).eq("id", id);
    }
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-parchment">
        <Card padding="lg" className="max-w-md w-full">
          <div className="text-center py-8">
            <span className="text-6xl block mb-4">🌟</span>
            <h2 className="font-heading text-2xl font-bold text-sage-dark mb-2">리뷰 등록 완료!</h2>
            <p className="text-gray-500 mb-6">소중한 리뷰 감사합니다</p>
            <Link href={profile?.role === "company" ? "/dashboard/company" : "/dashboard/worker"}>
              <Button size="lg">대시보드로 이동</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark text-center mb-6">리뷰 작성</h1>

        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar emoji="👷" size="lg" />
            <div>
              <p className="font-semibold text-dark">{workerName || "기술자"}</p>
              <p className="text-sm text-gray-500">{companyName || "기업"} 프로젝트</p>
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">전체 평점</h2>
          <div className="flex justify-center mb-2">
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>
          <p className="text-center text-sm text-gray-500">{rating > 0 ? `${rating}점` : "별점을 선택하세요"}</p>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">세부 평가</h2>
          <div className="space-y-4">
            {CATEGORIES.map((cat, i) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{cat}</span>
                <StarRating rating={categoryScores[i]} size="sm" interactive onChange={(s) => setCatScore(i, s)} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="font-heading font-semibold text-dark mb-3">한줄 리뷰</h2>
          <textarea
            className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-muted bg-white text-dark placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors resize-none h-28"
            placeholder="작업에 대한 솔직한 리뷰를 남겨주세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Card>

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={saving}>
          {saving ? "등록 중..." : "리뷰 등록"}
        </Button>
      </div>
    </div>
  );
}
