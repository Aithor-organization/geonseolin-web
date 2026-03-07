"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Template {
  id: string;
  name: string;
  content: string;
}

interface TemplateManagerProps {
  templates: Template[];
  activeTemplateId: string | null;
  onSave: (updates: { templates?: Template[]; active_template_id?: string | null }) => void;
}

export default function TemplateManager({ templates, activeTemplateId, onSave }: TemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const useTemplate = activeTemplateId !== null;

  const handleAdd = () => {
    if (!name.trim() || !content.trim()) return;
    const t: Template = { id: crypto.randomUUID(), name: name.trim(), content: content.trim() };
    onSave({ templates: [...templates, t], active_template_id: t.id });
    setName(""); setContent(""); setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const next = templates.filter((t) => t.id !== id);
    onSave({ templates: next, active_template_id: activeTemplateId === id ? (next[0]?.id ?? null) : activeTemplateId });
  };

  return (
    <Card className="mb-4">
      <h2 className="font-heading font-semibold text-dark mb-3">지원서 설정</h2>
      <div className="space-y-2 mb-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="radio" name="tplMode" checked={!useTemplate} onChange={() => onSave({ active_template_id: null })} />
          AI 자동 생성 (추천)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="radio" name="tplMode" checked={useTemplate} onChange={() => onSave({ active_template_id: templates[0]?.id ?? null })} />
          템플릿 사용
        </label>
      </div>
      {useTemplate && (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className={`p-2 rounded-lg border text-sm ${activeTemplateId === t.id ? "border-sage bg-sage/5" : "border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input type="radio" name="tpl" checked={activeTemplateId === t.id} onChange={() => onSave({ active_template_id: t.id })} />
                  <span className="font-medium">{t.name}</span>
                </label>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-terracotta cursor-pointer">삭제</button>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 pl-6">{t.content}</p>
            </div>
          ))}
          {showForm ? (
            <div className="p-2 border rounded-lg space-y-2 bg-gray-50">
              <input className="w-full px-2 py-1 border rounded text-sm" placeholder="템플릿 이름" value={name} onChange={(e) => setName(e.target.value)} />
              <textarea className="w-full px-2 py-1 border rounded text-sm" rows={3} placeholder="템플릿 내용 (20~1000자)" value={content} onChange={(e) => setContent(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd}>추가</Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>취소</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full text-sm text-sage py-2 border border-dashed border-sage/30 rounded-lg cursor-pointer hover:bg-sage/5">
              + 새 템플릿 추가
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
