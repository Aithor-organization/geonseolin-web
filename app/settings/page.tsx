"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Toggle from "@/components/ui/Toggle";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/lib/hooks/use-settings";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { settings, updateSettings: update, loading } = useSettings();
  const profileHref = profile?.role === "company" ? "/profile/company" : "/profile/worker";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 bg-parchment min-h-screen">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-2xl font-bold text-dark mb-6">설정</h1>

        <Card className="mb-4">
          <div className="flex items-center gap-4">
            <Avatar emoji={profile?.role === "company" ? "🏢" : "👷"} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-dark">{profile?.name ?? "사용자"}</p>
              <p className="text-sm text-gray-500">{profile?.email ?? ""}</p>
            </div>
            <Link href={profileHref} className="text-sm text-sage font-medium hover:underline">편집</Link>
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">알림 설정</h2>
          <div className="space-y-1">
            <Toggle checked={settings.push_enabled} onChange={(v) => update({ push_enabled: v })} label="푸시 알림" description="새 메시지, 지원 현황 등" />
            <Toggle checked={settings.email_enabled} onChange={(v) => update({ email_enabled: v })} label="이메일 알림" description="주간 리포트, 추천 공고" />
            <Toggle checked={settings.chat_enabled} onChange={(v) => update({ chat_enabled: v })} label="채팅 알림" description="새 메시지 수신 시" />
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">개인정보</h2>
          <div className="space-y-1">
            <Toggle checked={settings.profile_public} onChange={(v) => update({ profile_public: v })} label="프로필 공개" description="기업에게 프로필이 노출됩니다" />
            <Toggle checked={settings.location_enabled} onChange={(v) => update({ location_enabled: v })} label="위치 정보 사용" description="주변 일자리 추천에 사용됩니다" />
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-4">계정</h2>
          <div className="space-y-3">
            <button onClick={() => router.push("/reset-password")} className="w-full text-left text-sm text-dark hover:text-sage transition-colors py-2 cursor-pointer">비밀번호 변경</button>
            <button onClick={() => router.push(profileHref)} className="w-full text-left text-sm text-dark hover:text-sage transition-colors py-2 cursor-pointer">연동 계정 관리</button>
            <Link href="/terms" className="block text-sm text-dark hover:text-sage transition-colors py-2">이용약관</Link>
            <Link href="/privacy" className="block text-sm text-dark hover:text-sage transition-colors py-2">개인정보처리방침</Link>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button variant="outline" fullWidth onClick={() => signOut()}>로그아웃</Button>
          <Button variant="danger" fullWidth>회원 탈퇴</Button>
        </div>
      </div>
    </div>
  );
}
