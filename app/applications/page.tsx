"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMyApplications } from "@/lib/hooks/use-applications";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "terracotta" | "sage" }> = {
  pending: { label: "검토 중", variant: "warning" },
  accepted: { label: "수락됨", variant: "success" },
  rejected: { label: "거절됨", variant: "terracotta" },
};

export default function ApplicationsPage() {
  const { profile, loading: authLoading } = useAuth();
  const { applications, loading } = useMyApplications();

  if (authLoading || loading) {
    return (
      <div className="px-5 py-6 bg-parchment min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-2xl font-bold text-dark mb-6">
            {profile?.role === "company" ? "지원자 관리" : "내 지원 내역"}
          </h1>
          <ListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">
          {profile?.role === "company" ? "지원자 관리" : "내 지원 내역"}
        </h1>

        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3">📋</span>
            <p>지원 내역이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applications.map((app) => {
              const s = statusMap[app.status] ?? statusMap.pending;
              return (
                <Card key={app.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/jobs/${app.job_id}`} className="text-sm font-semibold text-dark hover:underline">
                        {app.jobs?.title ?? "공고"}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {app.jobs?.location ?? ""} · {new Date(app.created_at).toLocaleDateString("ko-KR")}
                      </p>
                      {app.message && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{app.message}</p>
                      )}
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
