"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

interface PaymentRow {
  id: string;
  contract_id: string;
  amount: number;
  method: string;
  status: string;
  escrow_released: boolean;
  payment_key: string | null;
  created_at: string;
  contracts?: { jobs?: { title: string } };
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "terracotta" | "sage" }> = {
  pending: { label: "대기", variant: "warning" },
  processing: { label: "에스크로 보관", variant: "sage" },
  completed: { label: "완료", variant: "success" },
  failed: { label: "실패", variant: "terracotta" },
  refunded: { label: "환불", variant: "terracotta" },
};

export default function PaymentHistoryPage() {
  const { loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/payments");
      if (res.ok) {
        setPayments(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="px-5 py-6 bg-parchment min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-2xl font-bold text-dark mb-6">결제 내역</h1>
          <ListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">결제 내역</h1>

        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3">💳</span>
            <p>결제 내역이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => {
              const s = statusMap[p.status] ?? statusMap.pending;
              return (
                <Card key={p.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-dark">
                        {p.contracts?.jobs?.title ?? "결제"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(p.amount)} · {p.method === "escrow" ? "에스크로" : p.method}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
