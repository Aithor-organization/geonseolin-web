"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Application {
  id: string;
  company_name: string;
  biz_number: string;
  ceo: string;
  industry: string | null;
  address: string | null;
  biz_certificate_url: string | null;
  approval_status: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  profiles: {
    name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

const statusFilter = ["pending", "approved", "rejected"] as const;
const statusLabels: Record<string, string> = {
  pending: "대기 중",
  approved: "승인됨",
  rejected: "반려됨",
};
const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function CompanyApprovalsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<typeof statusFilter[number]>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeStatus,
        page: String(page),
        limit: "15",
      });
      const res = await fetch(`/api/admin/company-approvals?${params}`);
      const data = await res.json();
      setApplications(data.applications ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [page, activeStatus]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    await fetch("/api/admin/company-approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "approve" }),
    });
    setActionLoading(null);
    fetchApplications();
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    await fetch("/api/admin/company-approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "reject", reason: rejectReason }),
    });
    setActionLoading(null);
    setRejectTarget(null);
    setRejectReason("");
    fetchApplications();
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("ko-KR");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sage-dark">기업 등록 승인</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}건</p>
        </div>
      </div>

      {/* 상태 필터 */}
      <Card className="mb-6">
        <div className="flex gap-1">
          {statusFilter.map((filter) => (
            <button
              key={filter}
              onClick={() => { setActiveStatus(filter); setPage(1); }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeStatus === filter
                  ? "bg-sage text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {statusLabels[filter]}
            </button>
          ))}
        </div>
      </Card>

      {/* 목록 */}
      {loading ? (
        <Card><div className="py-12 text-center text-gray-400">로딩 중...</div></Card>
      ) : applications.length === 0 ? (
        <Card><div className="py-12 text-center text-gray-400">
          {activeStatus === "pending" ? "대기 중인 신청이 없습니다" : "해당 상태의 신청이 없습니다"}
        </div></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app) => (
            <Card key={app.id} padding="lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg text-dark">{app.company_name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[app.approval_status] ?? ""}`}>
                      {statusLabels[app.approval_status] ?? app.approval_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">신청자:</span>{" "}
                      <span className="text-dark">{app.profiles?.name ?? "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">이메일:</span>{" "}
                      <span className="text-dark">{app.profiles?.email ?? "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">사업자번호:</span>{" "}
                      <span className="text-dark font-mono">{app.biz_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">대표자:</span>{" "}
                      <span className="text-dark">{app.ceo}</span>
                    </div>
                    {app.industry && (
                      <div>
                        <span className="text-gray-400">업종:</span>{" "}
                        <span className="text-dark">{app.industry}</span>
                      </div>
                    )}
                    {app.address && (
                      <div>
                        <span className="text-gray-400">주소:</span>{" "}
                        <span className="text-dark">{app.address}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">가입일:</span>{" "}
                      <span className="text-dark">{app.profiles?.created_at ? formatDate(app.profiles.created_at) : "-"}</span>
                    </div>
                  </div>

                  {app.biz_certificate_url && (
                    <a
                      href={app.biz_certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-sm text-sage hover:underline"
                    >
                      📄 사업자등록증 보기
                    </a>
                  )}

                  {app.rejection_reason && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600">반려 사유: {app.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* 승인/반려 버튼 */}
                {app.approval_status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(app.id)}
                      disabled={actionLoading === app.id}
                    >
                      {actionLoading === app.id ? "처리 중..." : "승인"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectTarget(rejectTarget === app.id ? null : app.id)}
                      disabled={actionLoading === app.id}
                    >
                      반려
                    </Button>

                    {rejectTarget === app.id && (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="반려 사유 (선택)"
                          className="w-48 px-3 py-2 text-xs border border-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-sage"
                          rows={2}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(app.id)}
                          disabled={actionLoading === app.id}
                        >
                          반려 확인
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            이전
          </Button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
