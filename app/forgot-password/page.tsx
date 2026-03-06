"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
        <div className="w-full max-w-md">
          <Card padding="lg">
            <div className="text-center">
              <span className="text-5xl block mb-4">📧</span>
              <h2 className="font-heading text-xl font-semibold mb-3">이메일을 확인하세요</h2>
              <p className="text-gray-500 text-sm mb-6">
                <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다.
                이메일을 확인해주세요.
              </p>
              <Link href="/login">
                <Button fullWidth variant="outline">로그인으로 돌아가기</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🔑</span>
          <h1 className="font-heading text-2xl font-bold text-sage-dark">비밀번호 찾기</h1>
          <p className="text-gray-500 mt-2">가입한 이메일로 재설정 링크를 보내드립니다</p>
        </div>

        <Card padding="lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="이메일"
              type="email"
              placeholder="가입한 이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button fullWidth size="lg" type="submit" disabled={loading}>
              {loading ? "전송 중..." : "재설정 링크 보내기"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/login" className="text-sage font-semibold hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
