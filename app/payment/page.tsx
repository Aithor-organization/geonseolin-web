"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StepBar from "@/components/ui/StepBar";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const STEPS = ["계약 확인", "결제", "완료"];

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 animate-pulse">로딩 중...</p></div>}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [contractId, setContractId] = useState<string | null>(null);

  // URL 파라미터에서 계약 정보 읽기 (없으면 기본값)
  const [contractInfo, setContractInfo] = useState({
    jobTitle: "",
    workerName: "",
    workerId: "",
    dailyRate: 0,
    workDays: 0,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    setContractInfo({
      jobTitle: searchParams.get("jobTitle") ?? "공고 미지정",
      workerName: searchParams.get("workerName") ?? "기술자 미지정",
      workerId: searchParams.get("workerId") ?? "",
      dailyRate: Number(searchParams.get("dailyRate")) || 0,
      workDays: Number(searchParams.get("workDays")) || 0,
      startDate: searchParams.get("startDate") ?? "",
      endDate: searchParams.get("endDate") ?? "",
    });
  }, [searchParams]);

  const totalAmount = contractInfo.dailyRate * contractInfo.workDays;

  const handlePayment = async () => {
    setProcessing(true);

    const { data: contract } = await supabase
      .from("contracts")
      .insert({
        company_id: user?.id ?? null,
        worker_id: contractInfo.workerId || null,
        job_id: searchParams.get("jobId") || null,
        daily_rate: contractInfo.dailyRate,
        work_days: contractInfo.workDays,
        total_amount: totalAmount,
        start_date: contractInfo.startDate || null,
        end_date: contractInfo.endDate || null,
        status: "active" as const,
      })
      .select("id")
      .single();

    if (contract) {
      setContractId(contract.id);

      const methodMap: Record<string, "card" | "bank_transfer" | "escrow"> = {
        card: "card",
        bank: "bank_transfer",
        virtual: "escrow",
      };

      await supabase.from("payments").insert({
        contract_id: contract.id,
        amount: totalAmount,
        method: methodMap[paymentMethod] ?? "card",
        status: "completed" as const,
        escrow_released: false,
      });
    }

    setProcessing(false);
    setStep(2);
  };

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark text-center mb-6">계약 및 결제</h1>

        <div className="mb-8">
          <StepBar steps={STEPS} current={step} />
        </div>

        {step === 0 && (
          <>
            <Card className="mb-4">
              <h2 className="font-heading font-semibold text-dark mb-4">계약 내용</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">공고</span>
                  <span className="text-dark font-medium">{contractInfo.jobTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">기술자</span>
                  <span className="text-dark font-medium">{contractInfo.workerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">작업 기간</span>
                  <span className="text-dark font-medium">
                    {contractInfo.startDate && contractInfo.endDate
                      ? `${contractInfo.startDate} ~ ${contractInfo.endDate}`
                      : "미정"}
                  </span>
                </div>
                <hr className="border-muted" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">일당</span>
                  <span className="text-dark">{formatCurrency(contractInfo.dailyRate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">작업일수</span>
                  <span className="text-dark">{contractInfo.workDays}일</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-dark">총 계약 금액</span>
                  <span className="text-sage-dark text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </Card>

            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔒</span>
                <h3 className="font-semibold text-dark text-sm">에스크로 결제 안내</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                결제 금액은 에스크로 계좌에 안전하게 보관됩니다. 작업 완료 후 양측 확인 시 기술자에게 지급됩니다.
              </p>
            </Card>

            <Button fullWidth size="lg" onClick={() => setStep(1)}>결제 진행</Button>
          </>
        )}

        {step === 1 && (
          <>
            <Card className="mb-4">
              <h2 className="font-heading font-semibold text-dark mb-4">결제 수단</h2>
              <div className="space-y-2">
                {[
                  { key: "card", label: "신용/체크카드" },
                  { key: "bank", label: "계좌이체" },
                  { key: "virtual", label: "가상계좌" },
                ].map((method) => (
                  <label key={method.key} className="flex items-center gap-3 p-3 rounded-xl border border-muted hover:border-sage cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.key}
                      onChange={() => setPaymentMethod(method.key)}
                      className="accent-sage w-4 h-4"
                    />
                    <span className="text-sm font-medium text-dark">{method.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">결제 금액</span>
                <span className="text-xl font-bold text-sage-dark">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success">에스크로 보호</Badge>
                <span className="text-xs text-gray-500">안전하게 보관됩니다</span>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep(0)}>이전</Button>
              <Button fullWidth size="lg" onClick={handlePayment} disabled={processing}>
                {processing ? "처리 중..." : "결제하기"}
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <Card padding="lg">
            <div className="text-center py-8">
              <span className="text-6xl block mb-4">✅</span>
              <h2 className="font-heading text-2xl font-bold text-sage-dark mb-2">결제 완료!</h2>
              <p className="text-gray-500 mb-2">계약이 성공적으로 체결되었습니다</p>
              <p className="text-sm text-gray-500 mb-6">
                {formatCurrency(totalAmount)}이 에스크로 계좌에 보관됩니다
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/chat">
                  <Button variant="outline" fullWidth>기술자에게 메시지</Button>
                </Link>
                <Link href="/dashboard/company">
                  <Button fullWidth>대시보드로 이동</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
