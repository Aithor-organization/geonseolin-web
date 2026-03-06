"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Report {
  id: string;
  type: string;
  targetName: string;
  targetRole: string;
  reporterName: string;
  content: string;
  date: string;
  status: "pending" | "resolved" | "dismissed";
}

// 데모 신고 데이터
const initialReports: Report[] = [
  {
    id: "r1",
    type: "허위 프로필",
    targetName: "테스트유저A",
    targetRole: "worker",
    reporterName: "한양건설",
    content: "자격증 정보가 허위로 보입니다. 실제 해당 자격증을 보유하고 있지 않은 것으로 확인되었습니다.",
    date: "2026-03-04",
    status: "pending",
  },
  {
    id: "r2",
    type: "부적절한 공고",
    targetName: "서울공사",
    targetRole: "company",
    reporterName: "김철수",
    content: "최저임금 이하의 급여를 제시하는 공고입니다.",
    date: "2026-03-03",
    status: "pending",
  },
  {
    id: "r3",
    type: "직거래 유도",
    targetName: "이영수",
    targetRole: "worker",
    reporterName: "테크파크건설",
    content: "채팅에서 플랫폼 외부 직거래를 유도하는 메시지를 보냈습니다.",
    date: "2026-03-01",
    status: "resolved",
  },
  {
    id: "r4",
    type: "허위 리뷰",
    targetName: "박지성",
    targetRole: "worker",
    reporterName: "삼성건설",
    content: "실제 작업을 하지 않은 사람이 리뷰를 남겼습니다.",
    date: "2026-02-28",
    status: "dismissed",
  },
];

const filterTabs = ["대기중", "처리완료", "전체"] as const;

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [activeFilter, setActiveFilter] = useState<typeof filterTabs[number]>("대기중");

  const filteredReports = reports.filter((r) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "대기중") return r.status === "pending";
    return r.status === "resolved" || r.status === "dismissed";
  });

  const handleAction = (id: string, action: "resolved" | "dismissed") => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
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
        {filteredReports.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl mb-3 block">🎉</span>
            <p className="text-gray-400">접수된 신고가 없습니다</p>
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
                  <td className="py-3 px-4 font-medium text-dark">{report.targetName}</td>
                  <td className="py-3 px-4 text-gray-500">{report.reporterName}</td>
                  <td className="py-3 px-4 text-gray-400 max-w-[200px] truncate">{report.content}</td>
                  <td className="py-3 px-4 text-gray-400">{report.date}</td>
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
