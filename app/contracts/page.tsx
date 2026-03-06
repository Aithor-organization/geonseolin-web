"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useContracts, ContractRow } from "@/lib/hooks/use-contracts";
import { formatCurrency } from "@/lib/utils";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "terracotta" | "sage" }> = {
  pending: { label: "대기", variant: "warning" },
  active: { label: "진행중", variant: "sage" },
  completed: { label: "완료", variant: "success" },
  cancelled: { label: "취소", variant: "terracotta" },
};

export default function ContractsPage() {
  const { profile, loading: authLoading } = useAuth();
  const { contracts, loading } = useContracts();

  if (authLoading || loading) {
    return (
      <div className="px-5 py-6 bg-parchment min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-2xl font-bold text-dark mb-6">계약 관리</h1>
          <ListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">계약 관리</h1>

        {contracts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3">📝</span>
            <p>계약 내역이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {contracts.map((c: ContractRow) => {
              const s = statusMap[c.status] ?? statusMap.pending;
              const other = profile?.role === "worker"
                ? c.company_profiles?.profiles?.name ?? "기업"
                : c.worker_profiles?.profiles?.name ?? "기술자";
              return (
                <Link key={c.id} href={`/contracts/${c.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-dark">{c.jobs?.title ?? "계약"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {other} · {formatCurrency(c.total_amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.start_date ?? ""} ~ {c.end_date ?? ""}
                        </p>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
