"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Footer() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const role = profile?.role;

  // admin 페이지에서는 Footer 숨김
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="hidden lg:block bg-white border-t border-muted mt-auto">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏗️</span>
              <span className="font-heading text-lg font-bold text-sage-dark">건설人</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              믿을 수 있는 건설 전문 인력과 기업을 연결하는 매칭 플랫폼
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-dark mb-3">서비스</h4>
            <div className="flex flex-col gap-2">
              {role === "company" ? (
                <>
                  <Link href="/search" className="text-xs text-gray-500 hover:text-sage transition-colors">인력 검색</Link>
                  <Link href="/jobs/new" className="text-xs text-gray-500 hover:text-sage transition-colors">공고 등록</Link>
                </>
              ) : (
                <>
                  <Link href="/jobs" className="text-xs text-gray-500 hover:text-sage transition-colors">일자리 찾기</Link>
                  <Link href="/applications" className="text-xs text-gray-500 hover:text-sage transition-colors">지원 내역</Link>
                </>
              )}
              <Link href="/chat" className="text-xs text-gray-500 hover:text-sage transition-colors">채팅 상담</Link>
              <Link href="/contracts" className="text-xs text-gray-500 hover:text-sage transition-colors">계약 관리</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-dark mb-3">회사</h4>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500">회사 소개</span>
              <span className="text-xs text-gray-500">채용 안내</span>
              <span className="text-xs text-gray-500">공지사항</span>
              <span className="text-xs text-gray-500">블로그</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-dark mb-3">고객 지원</h4>
            <div className="flex flex-col gap-2">
              <Link href="/support/faq" className="text-xs text-gray-500 hover:text-sage transition-colors">자주 묻는 질문</Link>
              <Link href="/support/contact" className="text-xs text-gray-500 hover:text-sage transition-colors">1:1 문의</Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-sage transition-colors">이용약관</Link>
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-sage transition-colors">개인정보처리방침</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-muted pt-6 flex items-center justify-between">
          <p className="text-xs text-gray-500">&copy; 2026 건설人. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>고객센터: 1588-0000</span>
            <span>평일 09:00 - 18:00</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
