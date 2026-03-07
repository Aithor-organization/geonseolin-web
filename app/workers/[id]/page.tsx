"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StarRating from "@/components/ui/StarRating";
import { formatCurrency } from "@/lib/utils";
import { useWorkerDetail } from "@/lib/hooks/use-worker-detail";
import { useAuth } from "@/contexts/AuthContext";

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { worker, reviews, loading, error } = useWorkerDetail(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="text-5xl">😕</span>
        <p className="text-gray-500">{error ?? "기술자를 찾을 수 없습니다"}</p>
        <Button variant="outline" onClick={() => router.back()}>뒤로가기</Button>
      </div>
    );
  }

  const name = worker.profiles.name;
  const isCompany = profile?.role === "company";

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-dark mb-4 cursor-pointer"
        >
          ← 뒤로
        </button>

        {/* 프로필 헤더 */}
        <Card className="mb-4">
          <div className="flex items-start gap-4">
            <Avatar emoji={worker.profiles.avatar_url ?? "👷"} size="lg" online={worker.available} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-2xl font-bold text-dark">{name}</h1>
                {worker.available ? (
                  <Badge variant="success">채용 가능</Badge>
                ) : (
                  <Badge variant="muted">작업 중</Badge>
                )}
              </div>
              <p className="text-gray-500">{worker.specialty} · 경력 {worker.experience}년</p>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={Math.round(worker.rating)} size="sm" />
                <span className="text-sm text-gray-500">
                  {worker.rating.toFixed(1)}/5 ({worker.review_count}명)
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>📍 {worker.location ?? "미설정"}</span>
                <span>✅ 완료 {worker.completed_jobs}건</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-muted">
            <span className="text-lg font-bold text-sage-dark">
              {formatCurrency(worker.hourly_rate)}/시간
            </span>
            {isCompany && (
              <div className="flex gap-2">
                <Link href={`/chat?to=${worker.id}`}>
                  <Button variant="outline" size="sm">💬 메시지</Button>
                </Link>
                <Link href={`/contracts/new?workerId=${worker.id}`}>
                  <Button size="sm">제안하기</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* 소개 */}
        {worker.bio && (
          <Card className="mb-4">
            <h2 className="font-heading font-semibold text-dark mb-2">자기소개</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{worker.bio}</p>
          </Card>
        )}

        {/* 보유 기술 */}
        {worker.skills.length > 0 && (
          <Card className="mb-4">
            <h2 className="font-heading font-semibold text-dark mb-3">보유 기술</h2>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill) => (
                <Badge key={skill} variant="sage">{skill}</Badge>
              ))}
            </div>
          </Card>
        )}

        {/* 통계 */}
        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">활동 요약</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-sage-dark">{worker.completed_jobs}</p>
              <p className="text-xs text-gray-500">완료 작업</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-dark">{worker.rating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">평균 평점</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-dark">{worker.experience}년</p>
              <p className="text-xs text-gray-500">경력</p>
            </div>
          </div>
        </Card>

        {/* 리뷰 */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-dark">리뷰</h2>
            <span className="text-sm text-gray-500">{worker.rating.toFixed(1)}/5 ({worker.review_count}명)</span>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">아직 리뷰가 없습니다</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-muted pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-dark">
                      {review.company_profiles?.company_name ?? review.company_profiles?.profiles?.name ?? "기업"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.categories && review.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {review.categories.map((cat) => (
                        <span key={cat.label} className="text-xs text-gray-500">
                          {cat.label} {cat.score}/5
                        </span>
                      ))}
                    </div>
                  )}
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
