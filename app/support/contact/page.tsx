"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "general", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setError("전송에 실패했습니다. 다시 시도해주세요.");
      setSending(false);
      return;
    }

    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-heading text-2xl font-bold text-sage-dark mb-2">문의가 접수되었습니다</h1>
        <p className="text-gray-500 text-sm mb-6">
          영업일 기준 1~2일 내 등록하신 이메일로 답변 드리겠습니다.
        </p>
        <Button onClick={() => setSubmitted(false)}>추가 문의하기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <h1 className="font-heading text-2xl font-bold text-sage-dark mb-2">1:1 문의</h1>
      <p className="text-gray-500 text-sm mb-8">문의 내용을 남겨주시면 빠르게 답변 드리겠습니다.</p>

      <Card padding="lg">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <Input
            label="이름"
            placeholder="이름을 입력하세요"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="이메일"
            type="email"
            placeholder="답변 받을 이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">문의 유형</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-muted text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage/30"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">일반 문의</option>
              <option value="payment">결제 관련</option>
              <option value="account">계정 관련</option>
              <option value="bug">오류 신고</option>
              <option value="suggestion">건의사항</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">문의 내용</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-muted text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 min-h-[120px] resize-y"
              placeholder="문의 내용을 상세히 입력해 주세요"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}
          <Button type="submit" fullWidth size="lg" disabled={sending}>
            {sending ? "전송 중..." : "문의 보내기"}
          </Button>
        </form>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-1">전화 문의</p>
        <p className="text-lg font-semibold text-dark">1588-0000</p>
        <p className="text-xs text-gray-400 mt-1">평일 09:00 - 18:00 (공휴일 제외)</p>
      </div>
    </div>
  );
}
