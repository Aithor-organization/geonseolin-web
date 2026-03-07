"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithOAuth, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signUp(email, password, name, phone || undefined);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // signIn 후 프로필이 아직 로드되지 않았을 수 있으므로 명시적으로 새로고침
    await refreshProfile();
    router.push("/verify-email");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🏗️</span>
          <h1 className="font-heading text-3xl font-bold text-sage-dark">건설人</h1>
          <p className="text-gray-500 mt-2">새로운 기회를 만나보세요</p>
        </div>

        <Card padding="lg">
          <h2 className="font-heading text-xl font-semibold text-center mb-6">회원가입</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          <div className="mb-5 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700 leading-relaxed">
              모든 신규 회원은 <strong>기술자</strong>로 가입됩니다.
              기업 회원으로 전환하려면 가입 후 <strong>기업 등록 신청</strong>을 진행하세요.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="이름"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              placeholder="8자 이상 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="전화번호"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="flex items-start gap-2 cursor-pointer mt-1">
              <input type="checkbox" className="accent-sage w-4 h-4 mt-0.5" />
              <span className="text-xs text-gray-500 leading-relaxed">
                <span className="text-sage underline">이용약관</span> 및{" "}
                <span className="text-sage underline">개인정보처리방침</span>에 동의합니다
              </span>
            </label>

            <Button
              fullWidth
              size="lg"
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "가입 중..." : "가입하기"}
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
                Google로 시작하기
              </span>
            </Button>
            <Button variant="outline" fullWidth disabled className="opacity-50">
              <span className="flex items-center justify-center gap-2">
                💬 카카오로 시작하기 (준비 중)
              </span>
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-sage font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
