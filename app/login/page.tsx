"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // 성공 시 AuthContext의 onAuthStateChange가 프로필을 로드하고
    // middleware가 적절한 대시보드로 리다이렉트
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
              <path d="M3 21h18" stroke="#4B6350" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 21v-6h8v6" stroke="#4B6350" strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 15V5" stroke="#4B6350" strokeWidth="2" />
              <path d="M12 5L4 11" stroke="#4B6350" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 5H21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 5v6" stroke="#F59E0B" strokeWidth="2" />
              <path d="M17 11h2l-1 2h-1l-1-2h2z" fill="#F59E0B" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-bold text-sage-dark">건설人</h1>
          <p className="text-gray-500 mt-2">믿을 수 있는 건설 인력 매칭</p>
        </div>

        <Card padding="lg">
          <h2 className="font-heading text-xl font-semibold text-center mb-6">로그인</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <Input
              label="이메일"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-sage w-4 h-4" />
                <span className="text-gray-500">로그인 유지</span>
              </label>
              <Link href="/forgot-password" className="text-sage hover:underline">
                비밀번호 찾기
              </Link>
            </div>

            <Button fullWidth size="lg" type="submit" disabled={loading}>
              {loading ? "로그인 중..." : "이메일로 로그인"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">또는</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={async () => {
                setLoading(true);
                const result = await signInWithOAuth("google");
                if (result.error) {
                  setError(result.error);
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 로그인
              </span>
            </Button>
            <Button variant="outline" fullWidth disabled className="opacity-50">
              <span className="flex items-center justify-center gap-2">
                💬 카카오로 로그인 (준비 중)
              </span>
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-sage font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
