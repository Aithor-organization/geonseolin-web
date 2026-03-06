"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";

const faqData = [
  {
    category: "서비스 이용",
    items: [
      {
        q: "건설人은 어떤 서비스인가요?",
        a: "건설人은 건설 전문 인력(기술자)과 기업을 연결하는 매칭 플랫폼입니다. 기업은 필요한 인력을 검색하고 공고를 등록할 수 있으며, 기술자는 적합한 일자리를 찾아 지원할 수 있습니다.",
      },
      {
        q: "회원가입은 어떻게 하나요?",
        a: "홈페이지에서 '회원가입' 버튼을 클릭하여 이메일과 기본 정보를 입력하면 됩니다. 기술자와 기업 중 역할을 선택하여 가입할 수 있습니다.",
      },
      {
        q: "서비스 이용 요금이 있나요?",
        a: "기본 회원가입과 인력 검색은 무료입니다. 계약 체결 시 에스크로 수수료가 발생하며, 자세한 내용은 요금 안내 페이지를 참고해 주세요.",
      },
    ],
  },
  {
    category: "기술자",
    items: [
      {
        q: "기술자 프로필은 어떻게 작성하나요?",
        a: "로그인 후 '내 프로필' 페이지에서 전문 분야, 경력, 보유 기술, 희망 단가 등을 입력할 수 있습니다. 상세한 프로필 작성이 매칭 성공률을 높입니다.",
      },
      {
        q: "공고에 지원하면 어떻게 되나요?",
        a: "지원서를 제출하면 기업에서 검토 후 수락/거절 여부를 알려줍니다. 수락되면 채팅을 통해 세부 사항을 조율하고 계약을 진행합니다.",
      },
      {
        q: "급여는 어떻게 받나요?",
        a: "에스크로 결제 시스템을 통해 안전하게 급여를 받을 수 있습니다. 작업 완료 후 기업이 확인하면 에스크로에서 급여가 지급됩니다.",
      },
    ],
  },
  {
    category: "기업",
    items: [
      {
        q: "공고는 어떻게 등록하나요?",
        a: "로그인 후 '공고 등록' 메뉴에서 필요한 인력 조건, 근무지, 급여, 기간 등을 입력하여 등록할 수 있습니다.",
      },
      {
        q: "인력 검색은 어떻게 하나요?",
        a: "'인력 검색' 메뉴에서 전문 분야, 지역, 경력 등의 조건으로 기술자를 검색할 수 있습니다. AI 매칭 시스템이 적합한 인력을 추천해 드립니다.",
      },
      {
        q: "에스크로 결제란 무엇인가요?",
        a: "에스크로는 안전 결제 시스템으로, 기업이 대금을 먼저 예치하고 작업 완료 후 기술자에게 지급하는 방식입니다. 양측 모두 안전하게 거래할 수 있습니다.",
      },
    ],
  },
  {
    category: "계정 및 보안",
    items: [
      {
        q: "비밀번호를 잊었어요.",
        a: "로그인 페이지에서 '비밀번호 찾기'를 클릭하면 가입한 이메일로 재설정 링크를 받을 수 있습니다.",
      },
      {
        q: "회원 탈퇴는 어떻게 하나요?",
        a: "설정 > 계정 관리에서 회원 탈퇴를 신청할 수 있습니다. 진행 중인 계약이 있는 경우 완료 후 탈퇴가 가능합니다.",
      },
    ],
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenIndex((prev) => (prev === key ? null : key));
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <h1 className="font-heading text-2xl font-bold text-sage-dark mb-2">자주 묻는 질문</h1>
      <p className="text-gray-500 text-sm mb-8">궁금한 점을 찾아보세요.</p>

      <div className="flex flex-col gap-8">
        {faqData.map((section) => (
          <div key={section.category}>
            <h2 className="font-heading text-lg font-semibold text-dark mb-3">{section.category}</h2>
            <Card padding="sm">
              <div className="divide-y divide-muted">
                {section.items.map((item, i) => {
                  const key = `${section.category}-${i}`;
                  const isOpen = openIndex === key;
                  return (
                    <button
                      key={key}
                      className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors"
                      onClick={() => toggle(key)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-dark">{item.q}</span>
                        <span className="text-gray-400 shrink-0">{isOpen ? "−" : "+"}</span>
                      </div>
                      {isOpen && (
                        <p className="mt-3 text-sm text-gray-500 leading-relaxed">{item.a}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
