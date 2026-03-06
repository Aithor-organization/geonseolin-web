"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url: string | null;
  specialty?: string;
  company_name?: string;
}

const roleFilter = ["전체", "기술자", "기업"] as const;
const roleMap: Record<string, string> = { "기술자": "worker", "기업": "company" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<typeof roleFilter[number]>("전체");

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (activeFilter !== "전체") params.set("role", roleMap[activeFilter] ?? "");
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      worker: "bg-blue-100 text-blue-700",
      company: "bg-purple-100 text-purple-700",
      admin: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = { worker: "기술자", company: "기업", admin: "관리자" };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] ?? "bg-gray-100"}`}>
        {labels[role] ?? role}
      </span>
    );
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("ko-KR");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-sage-dark">사용자 관리</h1>
          <p className="text-sm text-gray-500 mt-1">전체 {total}명</p>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="이름 또는 이메일로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" size="sm">검색</Button>
          </form>
          <div className="flex gap-1">
            {roleFilter.map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setPage(1); }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeFilter === filter
                    ? "bg-sage text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 테이블 */}
      <Card padding="sm">
        {loading ? (
          <div className="py-12 text-center text-gray-400">로딩 중...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-400">사용자가 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted text-left">
                <th className="py-3 px-4 font-medium text-gray-500">이름</th>
                <th className="py-3 px-4 font-medium text-gray-500">이메일</th>
                <th className="py-3 px-4 font-medium text-gray-500">역할</th>
                <th className="py-3 px-4 font-medium text-gray-500">상세</th>
                <th className="py-3 px-4 font-medium text-gray-500">가입일</th>
                <th className="py-3 px-4 font-medium text-gray-500">상태</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-gray-600">
                        {user.name[0]}
                      </div>
                      <span className="font-medium text-dark">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{user.email}</td>
                  <td className="py-3 px-4">{roleBadge(user.role)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {user.specialty ?? user.company_name ?? "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{formatDate(user.created_at)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      활성
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
