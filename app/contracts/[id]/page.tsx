"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contracts/${id}`);
      if (res.ok) setContract(await res.json());
      setLoading(false);
    }
    load();
  }, [id]);

  const handleConfirm = async () => {
    setConfirming(true);
    const res = await fetch(`/api/contracts/${id}/confirm`, { method: "POST" });
    if (res.ok) {
      const updated = await fetch(`/api/contracts/${id}`);
      if (updated.ok) setContract(await updated.json());
    }
    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">계약을 찾을 수 없습니다</p>
      </div>
    );
  }

  const isWorker = contract.worker_id === profile?.id;
  const myConfirmed = isWorker ? contract.worker_confirmed : contract.company_confirmed;
  const otherConfirmed = isWorker ? contract.company_confirmed : contract.worker_confirmed;
  const workerName = contract.worker_profiles?.profiles?.name ?? "기술자";
  const companyName = contract.company_profiles?.profiles?.name ?? "기업";

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">계약 상세</h1>

        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-dark">{contract.jobs?.title ?? "계약"}</h2>
            <Badge variant={contract.status === "active" ? "sage" : contract.status === "completed" ? "success" : "warning"}>
              {contract.status === "active" ? "진행중" : contract.status === "completed" ? "완료" : contract.status === "cancelled" ? "취소" : "대기"}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">기업</span>
              <span className="text-dark font-medium">{companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">기술자</span>
              <span className="text-dark font-medium">{workerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">일당</span>
              <span className="text-dark font-medium">{formatCurrency(contract.daily_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">근무일</span>
              <span className="text-dark font-medium">{contract.work_days}일</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">총 금액</span>
              <span className="text-dark font-bold">{formatCurrency(contract.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">기간</span>
              <span className="text-dark">{contract.start_date ?? "-"} ~ {contract.end_date ?? "-"}</span>
            </div>
          </div>
        </Card>

        {contract.status === "pending" && (
          <Card className="mb-4">
            <h3 className="font-semibold text-dark mb-3">계약 서명</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>기업 서명</span>
                <span>{contract.signed_by_company ? "✅ 완료" : "⏳ 대기"}</span>
              </div>
              <div className="flex justify-between">
                <span>기술자 서명</span>
                <span>{contract.signed_by_worker ? "✅ 완료" : "⏳ 대기"}</span>
              </div>
            </div>
            {!contract.signed_at && (
              <Link href={`/contracts/${id}/sign`}>
                <Button fullWidth>계약서 서명하기</Button>
              </Link>
            )}
          </Card>
        )}

        {contract.status === "active" && (
          <Card className="mb-4">
            <h3 className="font-semibold text-dark mb-3">작업 완료 확인</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>기업 확인</span>
                <span>{contract.company_confirmed ? "✅ 완료" : "⏳ 대기"}</span>
              </div>
              <div className="flex justify-between">
                <span>기술자 확인</span>
                <span>{contract.worker_confirmed ? "✅ 완료" : "⏳ 대기"}</span>
              </div>
            </div>
            {!myConfirmed && (
              <Button fullWidth onClick={handleConfirm} disabled={confirming}>
                {confirming ? "확인 중..." : "작업 완료 확인"}
              </Button>
            )}
            {myConfirmed && !otherConfirmed && (
              <p className="text-sm text-gray-500 text-center">상대방의 확인을 기다리고 있습니다</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
