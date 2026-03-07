"use client";

import { use, Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const WORKER_CATEGORIES = ["기술력", "시간 준수", "의사소통", "현장 정리"];
const COMPANY_CATEGORIES = ["급여 지급", "근무 환경", "의사소통", "재고용 의향"];

const MIN_COMMENT_LENGTH = 20;

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
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();

  const [rating, setRating] = useState(0);
  const [categoryScores, setCategoryScores] = useState<number[]>([0, 0, 0, 0]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [targetName, setTargetName] = useState("");
  const [contractTitle, setContractTitle] = useState("");

  // URL 파라미터
  const reviewType = (searchParams.get("type") ?? "company_to_worker") as "company_to_worker" | "worker_to_company";
  const workerIdParam = searchParams.get("workerId") ?? "";
  const companyIdParam = searchParams.get("companyId") ?? "";
  const contractIdParam = searchParams.get("contractId") ?? "";

  const isWorkerReview = reviewType === "worker_to_company";
  const categories = isWorkerReview ? COMPANY_CATEGORIES : WORKER_CATEGORIES;

  useEffect(() => {
    async function loadContext() {
      // 새 리뷰 작성 모드
      if (id === "new") {
        if (isWorkerReview && companyIdParam) {
          // 기술자→기업: 기업명 로드
          const { data } = await supabase
            .from("company_profiles")
            .select("company_name")
            .eq("id", companyIdParam)
            .single();
          setTargetName(data?.company_name ?? "기업");
        } else if (!isWorkerReview && workerIdParam) {
          // 기업→기술자: 기술자 이름 로드
          const { data } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", workerIdParam)
            .single();
          setTargetName(data?.name ?? "기술자");
        }

        // 계약 제목 로드
        if (contractIdParam) {
          const { data } = await supabase
            .from("contracts")
            .select("jobs(title)")
            .eq("id", contractIdParam)
            .single();
          setContractTitle((data as any)?.jobs?.title ?? "");
        }
        return;
      }

      // 기존 리뷰 수정 모드
      const { data: review } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", id)
        .single();

      if (review) {
        setRating(review.rating);
        if (review.categories) {
          const cats = review.categories as unknown as { label: string; score: number }[];
          const currentCats = (review as any).review_type === "worker_to_company" ? COMPANY_CATEGORIES : WORKER_CATEGORIES;
          setCategoryScores(currentCats.map((c) => cats.find((cat) => cat.label === c)?.score ?? 0));
        }
        setComment(review.comment ?? "");
      }
    }
    loadContext();
  }, [id, supabase, workerIdParam, companyIdParam, contractIdParam, isWorkerReview]);

  const setCatScore = (idx: number, score: number) => {
    const next = [...categoryScores];
    next[idx] = score;
    setCategoryScores(next);
  };

  const isValid = rating > 0 && comment.length >= MIN_COMMENT_LENGTH;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);
    setError("");

    const categoriesData = categories.map((label, i) => ({ label, score: categoryScores[i] }));

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_type: reviewType,
          worker_id: isWorkerReview ? user?.id : workerIdParam,
          company_id: isWorkerReview ? companyIdParam : undefined,
          contract_id: contractIdParam || undefined,
          rating,
          categories: categoriesData,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = typeof data.error === "string" ? data.error : "리뷰 등록에 실패했습니다";
        setError(errMsg);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("리뷰 등록에 실패했습니다");
    } finally {
      setSaving(false);
    }
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
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>

        <h1 className="font-heading text-2xl font-bold text-dark text-center mb-6">
          {isWorkerReview ? "기업 리뷰 작성" : "기술자 리뷰 작성"}
        </h1>

        {/* 리뷰 대상 정보 */}
        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Avatar emoji={isWorkerReview ? "🏢" : "👷"} size="lg" />
            <div>
              <p className="font-semibold text-dark">{targetName || (isWorkerReview ? "기업" : "기술자")}</p>
              {contractTitle && (
                <p className="text-sm text-gray-500">{contractTitle}</p>
              )}
            </div>
          </div>
        </Card>

        {/* 전체 평점 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">전체 평점 <span className="text-terracotta">*</span></h2>
          <div className="flex justify-center mb-2">
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>
          <p className="text-center text-sm text-gray-500">{rating > 0 ? `${rating}점` : "별점을 선택하세요"}</p>
        </Card>

        {/* 세부 평가 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">세부 평가</h2>
          <div className="space-y-4">
            {categories.map((cat, i) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{cat}</span>
                <StarRating rating={categoryScores[i]} size="sm" interactive onChange={(s) => setCatScore(i, s)} />
              </div>
            ))}
          </div>
        </Card>

        {/* 리뷰 작성 */}
        <Card className="mb-6">
          <h2 className="font-heading font-semibold text-dark mb-3">
            리뷰 내용 <span className="text-terracotta">*</span>
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            {isWorkerReview
              ? "해당 기업에서의 근무 경험을 솔직하게 작성해주세요."
              : "기술자의 작업에 대한 솔직한 리뷰를 남겨주세요."
            }
          </p>
          <textarea
            className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-muted bg-white text-dark placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors resize-none h-28"
            placeholder={isWorkerReview
              ? "예: 급여가 제때 지급되었고, 현장 환경도 안전하게 관리되어 좋았습니다..."
              : "예: 기술력이 뛰어나고 시간 약속을 잘 지켜서 만족스러운 작업이었습니다..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${comment.length < MIN_COMMENT_LENGTH ? "text-terracotta" : "text-gray-400"}`}>
              {comment.length < MIN_COMMENT_LENGTH
                ? `최소 ${MIN_COMMENT_LENGTH}자 이상 (현재 ${comment.length}자)`
                : `${comment.length}/500`
              }
            </p>
          </div>
        </Card>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={saving || !isValid}
        >
          {saving ? "등록 중..." : "리뷰 등록"}
        </Button>
      </div>
    </div>
  );
}
