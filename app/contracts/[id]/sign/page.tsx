"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

export default function ContractSignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contracts/${id}`);
      if (res.ok) setContract(await res.json());
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSign = async () => {
    setSigning(true);
    const res = await fetch(`/api/contracts/${id}/sign`, { method: "POST" });
    if (res.ok) {
      router.push(`/contracts/${id}`);
    }
    setSigning(false);
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
  const alreadySigned = isWorker ? contract.signed_by_worker : contract.signed_by_company;

  if (alreadySigned) {
    return (
      <div className="px-5 py-6 bg-parchment min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Card padding="lg">
            <div className="text-center">
              <span className="text-5xl block mb-4">✅</span>
              <h2 className="font-heading text-xl font-semibold mb-3">이미 서명 완료</h2>
              <p className="text-gray-500 text-sm mb-4">상대방의 서명을 기다리고 있습니다</p>
              <Button onClick={() => router.push(`/contracts/${id}`)}>계약 상세로 돌아가기</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">계약서 서명</h1>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">계약 조건</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">작업</span>
              <span className="text-dark font-medium">{contract.jobs?.title ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">일당</span>
              <span className="text-dark">{formatCurrency(contract.daily_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">근무일</span>
              <span className="text-dark">{contract.work_days}일</span>
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

        <Card>
          <div className="bg-muted/50 rounded-xl p-4 text-xs text-gray-500 mb-4 leading-relaxed">
            위 계약 조건을 확인하였으며, 양 당사자 간 합의된 내용에 따라 성실히 이행할 것을 동의합니다.
            에스크로 결제를 통해 작업 완료 확인 후 대금이 지급됩니다.
          </div>

          <label className="flex items-start gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              className="accent-sage w-4 h-4 mt-0.5"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-sm text-gray-600">
              계약 조건을 확인하였으며, 디지털 서명에 동의합니다
            </span>
          </label>

          <Button fullWidth disabled={!agreed || signing} onClick={handleSign}>
            {signing ? "서명 중..." : "계약서 서명"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
