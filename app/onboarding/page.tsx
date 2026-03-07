"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState(
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("이름을 입력하세요");
      return;
    }

    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "프로필 생성에 실패했습니다");
      setLoading(false);
      return;
    }

    // 프로필 생성 후 AuthContext에 반영
    await refreshProfile();
    router.push("/dashboard/worker");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🎉</span>
          <h1 className="font-heading text-3xl font-bold text-sage-dark">환영합니다!</h1>
          <p className="text-gray-500 mt-2">건설人을 시작하기 위해 이름을 알려주세요</p>
        </div>

        <Card padding="lg">
          <h2 className="font-heading text-xl font-semibold text-center mb-6">
            이름을 알려주세요
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="mb-5 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700 leading-relaxed">
              기술자 계정으로 시작합니다.
              기업 회원이 필요하시면 가입 후 <strong>기업 등록 신청</strong>을 진행하세요.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="이름"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {user?.email && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">이메일:</span> {user.email}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "시작 중..." : "시작하기"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
