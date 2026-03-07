"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ConfirmDialogProps {
  workerName: string;
  action: "accept" | "reject";
  onConfirm: (data: {
    action: string;
    auto_reject_others: boolean;
    create_contract_draft: boolean;
    contract_data?: {
      daily_rate: number;
      work_days: number;
      start_date: string;
      end_date: string;
    };
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  workerName,
  action,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const [autoReject, setAutoReject] = useState(true);
  const [createContract, setCreateContract] = useState(false);
  const [dailyRate, setDailyRate] = useState("");
  const [workDays, setWorkDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleConfirm = () => {
    const data: Parameters<typeof onConfirm>[0] = {
      action,
      auto_reject_others: action === "accept" ? autoReject : false,
      create_contract_draft: action === "accept" ? createContract : false,
    };
    if (createContract && dailyRate && workDays) {
      data.contract_data = {
        daily_rate: Number(dailyRate),
        work_days: Number(workDays),
        start_date: startDate,
        end_date: endDate,
      };
    }
    onConfirm(data);
  };

  const isAccept = action === "accept";
  const title = isAccept
    ? `${workerName}님을 확정할까요?`
    : `${workerName}님을 거절할까요?`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-5">
      <Card className="w-full max-w-sm">
        <h3 className="font-heading font-semibold text-dark text-center mb-4">
          {title}
        </h3>

        {isAccept && (
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoReject}
                onChange={(e) => setAutoReject(e.target.checked)}
                className="rounded"
              />
              나머지 지원자 자동 거절
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={createContract}
                onChange={(e) => setCreateContract(e.target.checked)}
                className="rounded"
              />
              계약서 초안 자동 생성
            </label>

            {createContract && (
              <div className="space-y-2 pl-6">
                <input
                  type="number"
                  placeholder="일당 (원)"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="근무일수"
                  value={workDays}
                  onChange={(e) => setWorkDays(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onCancel} disabled={loading}>
            취소
          </Button>
          <Button
            variant={isAccept ? "primary" : "danger"}
            fullWidth
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "처리 중..." : isAccept ? "확정하기" : "거절하기"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
