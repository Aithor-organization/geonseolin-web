"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLoginPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 이미 admin이면 대시보드로
  const isAdmin =
    profile?.role === "admin" || user?.user_metadata?.role === "admin";

  if (!loading && isAdmin) {
    router.push("/admin");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // API 라우트를 통해 로그인 (brute force 보호 + 서버 검증)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // API가 반환하는 에러 메시지 표시
        const errMsg = typeof data.error === "string"
          ? data.error
          : "로그인에 실패했습니다.";
        setError(errMsg);
        setSubmitting(false);
        return;
      }

      // 로그인 성공 → 전체 페이지 리로드로 AuthContext 재초기화
      window.location.href = "/admin";
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-5">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sage/20 mb-4">
            <span className="text-3xl">🏗️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">건설人 관리자</h1>
          <p className="text-gray-400 text-sm mt-1">관리자 전용 로그인</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                관리자 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-2.5 bg-sage text-white font-medium rounded-xl hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer mt-2"
            >
              {submitting ? "로그인 중..." : "관리자 로그인"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          관리자 권한이 필요합니다. 일반 사용자는{" "}
          <a href="/login" className="text-sage hover:underline">
            일반 로그인
          </a>
          을 이용해주세요.
        </p>
      </div>
    </div>
  );
}
