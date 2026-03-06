"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Report {
  id: string;
  type: string;
  target_name: string;
  target_role: string | null;
  reporter_name: string;
  content: string;
  created_at: string;
  status: "pending" | "resolved" | "dismissed";
}

const filterTabs = ["대기중", "처리완료", "전체"] as const;
const statusParam: Record<string, string | undefined> = {
  "대기중": "pending",
  "처리완료": undefined, // resolved + dismissed 둘 다 포함 → 클라이언트 필터
  "전체": undefined,
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<typeof filterTabs[number]>("대기중");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter === "대기중") params.set("status", "pending");
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filteredReports = reports.filter((r) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "대기중") return r.status === "pending";
    return r.status === "resolved" || r.status === "dismissed";
  });

  const handleAction = async (id: string, action: "resolved" | "dismissed") => {
    try {
      await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, status: action }),
      });
      // 낙관적 업데이트
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action } : r))
      );
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      resolved: "bg-green-100 text-green-700",
      dismissed: "bg-gray-100 text-gray-500",
    };
    const labels: Record<string, string> = { pending: "대기중", resolved: "처리완료", dismissed: "기각" };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("ko-KR");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sage-dark">신고/모더레이션</h1>
          <p className="text-sm text-gray-500 mt-1">
            대기 중인 신고 {pendingCount}건
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeFilter === tab ? "bg-sage text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab}
              {tab === "대기중" && pendingCount > 0 && (
                <span className="ml-1.5 inline-block w-5 h-5 text-xs leading-5 text-center rounded-full bg-red-500 text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="sm">
        {loading ? (
          <div className="py-12 text-center text-gray-400 animate-pulse">로딩 중...</div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl mb-3 block">
              {activeFilter === "대기중" ? "🎉" : "📋"}
            </span>
            <p className="text-gray-400">
              {activeFilter === "대기중" ? "대기 중인 신고가 없습니다" : "접수된 신고가 없습니다"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted text-left">
                <th className="py-3 px-4 font-medium text-gray-500">유형</th>
                <th className="py-3 px-4 font-medium text-gray-500">대상</th>
                <th className="py-3 px-4 font-medium text-gray-500">신고자</th>
                <th className="py-3 px-4 font-medium text-gray-500">내용</th>
                <th className="py-3 px-4 font-medium text-gray-500">날짜</th>
                <th className="py-3 px-4 font-medium text-gray-500">상태</th>
                <th className="py-3 px-4 font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-dark">{report.target_name}</td>
                  <td className="py-3 px-4 text-gray-500">{report.reporter_name}</td>
                  <td className="py-3 px-4 text-gray-400 max-w-[200px] truncate">{report.content}</td>
                  <td className="py-3 px-4 text-gray-400">{formatDate(report.created_at)}</td>
                  <td className="py-3 px-4">{statusBadge(report.status)}</td>
                  <td className="py-3 px-4">
                    {report.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAction(report.id, "resolved")}
                        >
                          확인
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(report.id, "dismissed")}
                        >
                          기각
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
