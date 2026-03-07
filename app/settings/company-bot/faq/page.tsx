"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useCompanyBotFaq } from "@/lib/hooks/use-company-bot";

export default function FaqManagePage() {
  const router = useRouter();
  const { faqs, loading, addFaq, updateFaq, deleteFaq } = useCompanyBotFaq();
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [cat, setCat] = useState("");
  const [pri, setPri] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    await addFaq({ question: q, answer: a, category: cat || undefined, priority: pri });
    setQ(""); setA(""); setCat(""); setPri(0);
    setSaving(false);
  };

  const handleEdit = async (id: string) => {
    setSaving(true);
    await updateFaq(id, { question: q, answer: a, category: cat || undefined, priority: pri });
    setEditId(null); setQ(""); setA(""); setCat(""); setPri(0);
    setSaving(false);
  };

  const startEdit = (faq: { id: string; question: string; answer: string; category?: string; priority?: number }) => {
    setEditId(faq.id);
    setQ(faq.question);
    setA(faq.answer);
    setCat(faq.category ?? "");
    setPri(faq.priority ?? 0);
  };

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
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>
        <h1 className="font-heading text-xl font-bold text-dark mb-6">FAQ 관리</h1>

        <Card className="mb-4">
          <h2 className="font-heading font-semibold text-dark mb-3">
            {editId ? "FAQ 수정" : "새 FAQ 추가"}
          </h2>
          <div className="space-y-2">
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="질문" value={q} onChange={(e) => setQ(e.target.value)} />
            <textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="답변" value={a} onChange={(e) => setA(e.target.value)} />
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="카테고리 (선택)" value={cat} onChange={(e) => setCat(e.target.value)} />
            <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="우선순위 (0=기본)" value={pri} onChange={(e) => setPri(Number(e.target.value))} min={0} max={10} />
            <div className="flex gap-2">
              {editId && (
                <Button variant="outline" size="sm" onClick={() => { setEditId(null); setQ(""); setA(""); setCat(""); setPri(0); }}>
                  취소
                </Button>
              )}
              <Button size="sm" onClick={() => editId ? handleEdit(editId) : handleAdd()} disabled={saving}>
                {saving ? "저장 중..." : editId ? "수정" : "추가"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {[...faqs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).map((faq) => (
            <Card key={faq.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark">Q: {faq.question}</p>
                  <p className="text-xs text-gray-600 mt-1">A: {faq.answer}</p>
                  <div className="flex gap-1 mt-1">
                    {faq.category && (
                      <span className="inline-block text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{faq.category}</span>
                    )}
                    {(faq.priority ?? 0) > 0 && (
                      <span className="inline-block text-[10px] bg-sage/10 text-sage px-1.5 py-0.5 rounded">우선 {faq.priority}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => startEdit(faq)} className="text-xs text-sage cursor-pointer">수정</button>
                  <button onClick={() => deleteFaq(faq.id)} className="text-xs text-terracotta cursor-pointer">삭제</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
