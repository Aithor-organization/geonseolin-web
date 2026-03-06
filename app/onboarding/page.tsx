"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type UserType = "worker" | "company";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<"role" | "name">("role");
  const [role, setRole] = useState<UserType>("worker");
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
      body: JSON.stringify({ name: name.trim(), role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "프로필 생성에 실패했습니다");
      setLoading(false);
      return;
    }

    // 프로필 상세 설정 페이지로 이동
    router.push(
      role === "company" ? "/profile/company" : "/profile/worker"
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🎉</span>
          <h1 className="font-heading text-3xl font-bold text-sage-dark">환영합니다!</h1>
          <p className="text-gray-500 mt-2">건설人을 시작하기 위해 기본 정보를 알려주세요</p>
        </div>

        <Card padding="lg">
          {step === "role" ? (
            <>
              <h2 className="font-heading text-xl font-semibold text-center mb-6">
                어떤 서비스를 이용하시겠어요?
              </h2>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setRole("worker")}
                  className={cn(
                    "p-6 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    role === "worker"
                      ? "border-sage bg-sage/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">👷</span>
                    <div>
                      <p className="font-semibold text-lg">기술자</p>
                      <p className="text-sm text-gray-500 mt-1">
                        일자리를 찾고 계약을 관리해요
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setRole("company")}
                  className={cn(
                    "p-6 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    role === "company"
                      ? "border-terracotta bg-terracotta/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🏢</span>
                    <div>
                      <p className="font-semibold text-lg">기업</p>
                      <p className="text-sm text-gray-500 mt-1">
                        인력을 찾고 프로젝트를 관리해요
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <Button
                fullWidth
                size="lg"
                variant={role === "worker" ? "primary" : "secondary"}
                className="mt-6"
                onClick={() => setStep("name")}
              >
                다음
              </Button>
            </>
          ) : (
            <>
              <h2 className="font-heading text-xl font-semibold text-center mb-6">
                {role === "worker" ? "이름을 알려주세요" : "기업명을 알려주세요"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Input
                  label={role === "worker" ? "이름" : "기업명"}
                  placeholder={role === "worker" ? "홍길동" : "OO건설"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                {user?.email && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">이메일:</span> {user.email}
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("role")}
                    disabled={loading}
                  >
                    이전
                  </Button>
                  <Button
                    fullWidth
                    size="lg"
                    variant={role === "worker" ? "primary" : "secondary"}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "시작 중..." : "시작하기"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
