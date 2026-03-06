"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-parchment">
      <div className="w-full max-w-md">
        <Card padding="lg">
          <div className="text-center">
            <span className="text-5xl block mb-4">📬</span>
            <h2 className="font-heading text-xl font-semibold mb-3">이메일 인증이 필요합니다</h2>
            <p className="text-gray-500 text-sm mb-2">
              가입하신 이메일로 인증 링크를 보냈습니다.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              이메일을 확인하고 인증 링크를 클릭해주세요.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button fullWidth>로그인하기</Button>
              </Link>
              <p className="text-xs text-gray-400">
                이메일을 받지 못했다면 스팸 폴더를 확인해주세요
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
