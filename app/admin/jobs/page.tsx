"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  salary: string;
  applicant_count: number;
  status: string;
  created_at: string;
}

const statusFilter = ["전체", "모집중", "마감", "임시저장"] as const;
const statusMap: Record<string, string> = { "모집중": "active", "마감": "closed", "임시저장": "draft" };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<typeof statusFilter[number]>("전체");

  const fetchJobs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (activeFilter !== "전체") params.set("status", statusMap[activeFilter] ?? "");
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [page, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleCloseJob = async (jobId: string) => {
    if (!confirm("이 공고를 마감 처리하시겠습니까?")) return;
    try {
      await fetch("/api/admin/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: "closed" }),
      });
      fetchJobs();
    } catch {
      alert("공고 마감 처리 중 오류가 발생했습니다.");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-500",
      draft: "bg-yellow-100 text-yellow-700",
    };
    const labels: Record<string, string> = { active: "모집중", closed: "마감", draft: "임시" };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100"}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("ko-KR");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sage-dark">공고 관리</h1>
          <p className="text-sm text-gray-500 mt-1">전체 {total}건</p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input placeholder="공고명으로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" size="sm">검색</Button>
          </form>
          <div className="flex gap-1">
            {statusFilter.map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setPage(1); }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeFilter === filter ? "bg-sage text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="sm">
        {loading ? (
          <div className="py-12 text-center text-gray-400">로딩 중...</div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">공고가 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted text-left">
                <th className="py-3 px-4 font-medium text-gray-500">공고명</th>
                <th className="py-3 px-4 font-medium text-gray-500">기업명</th>
                <th className="py-3 px-4 font-medium text-gray-500">위치</th>
                <th className="py-3 px-4 font-medium text-gray-500">급여</th>
                <th className="py-3 px-4 font-medium text-gray-500">지원자</th>
                <th className="py-3 px-4 font-medium text-gray-500">상태</th>
                <th className="py-3 px-4 font-medium text-gray-500">등록일</th>
                <th className="py-3 px-4 font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium text-dark max-w-[200px] truncate">{job.title}</td>
                  <td className="py-3 px-4 text-gray-500">{job.company_name}</td>
                  <td className="py-3 px-4 text-gray-400">{job.location ?? "-"}</td>
                  <td className="py-3 px-4 text-gray-500">{job.salary ?? "-"}</td>
                  <td className="py-3 px-4 text-gray-500">{job.applicant_count}명</td>
                  <td className="py-3 px-4">{statusBadge(job.status)}</td>
                  <td className="py-3 px-4 text-gray-400">{formatDate(job.created_at)}</td>
                  <td className="py-3 px-4">
                    {job.status === "active" && (
                      <Button variant="ghost" size="sm" onClick={() => handleCloseJob(job.id)}>
                        마감
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
        </div>
      )}
    </div>
  );
}
