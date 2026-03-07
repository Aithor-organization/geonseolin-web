"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Applicant {
  application_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  applied_at: string;
  worker: {
    id: string;
    name?: string;
    phone?: string;
    specialty?: string;
    experience?: number;
    bio?: string;
    location?: string;
    hourly_rate?: number;
    skills?: string[];
    rating?: number;
    review_count?: number;
    completed_jobs?: number;
    experiences?: { company_name: string; work_period: string; responsibility: string }[];
    certificates?: { cert_name: string; acquired_date: string; issuing_agency: string }[];
  };
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "terracotta" }> = {
  pending: { label: "검토 중", variant: "warning" },
  accepted: { label: "수락", variant: "success" },
  rejected: { label: "거절", variant: "terracotta" },
};

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [chattingWith, setChattingWith] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/jobs/${id}/applicants`);
    if (res.ok) {
      const data = await res.json();
      setJobTitle(data.job?.title ?? "");
      setApplicants(data.applicants ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleChat = async (workerId: string) => {
    setChattingWith(workerId);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: workerId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat?room=${data.room_id}`);
      }
    } finally {
      setChattingWith(null);
    }
  };

  const handleStatus = async (appId: string, status: "accepted" | "rejected") => {
    setUpdating(appId);
    await fetch(`/api/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setUpdating(null);
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
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-dark mb-4 flex items-center gap-1 cursor-pointer">
          <span>←</span> 뒤로
        </button>

        <h1 className="font-heading text-xl font-bold text-dark mb-1">지원자 관리</h1>
        <p className="text-sm text-gray-500 mb-6">{jobTitle} · 총 {applicants.length}명 지원</p>

        {applicants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3">📋</span>
            <p>아직 지원자가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {applicants.map((a) => {
              const s = statusMap[a.status] ?? statusMap.pending;
              const w = a.worker;
              const isExpanded = expandedId === a.application_id;

              return (
                <Card key={a.application_id}>
                  {/* 요약 헤더 */}
                  <button
                    className="w-full text-left cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : a.application_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center text-lg">
                          👷
                        </div>
                        <div>
                          <p className="font-semibold text-dark text-sm">{w.name ?? "기술자"}</p>
                          <p className="text-xs text-gray-500">
                            {w.specialty ?? "미등록"} · 경력 {w.experience ?? 0}년
                            {w.rating ? ` · ⭐ ${w.rating}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.variant}>{s.label}</Badge>
                        <span className="text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>
                  </button>

                  {/* 상세 정보 (확장) */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {/* 자기소개/각오 */}
                      {a.message && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">지원 각오</p>
                          <p className="text-sm text-gray-700 bg-sage/5 p-3 rounded-xl">{a.message}</p>
                        </div>
                      )}

                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="연락처" value={w.phone ?? "비공개"} />
                        <InfoItem label="희망 근무지" value={w.location ?? "-"} />
                        <InfoItem label="희망 일당" value={w.hourly_rate ? `${w.hourly_rate.toLocaleString()}원` : "-"} />
                        <InfoItem label="완료 작업" value={`${w.completed_jobs ?? 0}건`} />
                      </div>

                      {/* 보유 기술 */}
                      {w.skills && w.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">보유 기술</p>
                          <div className="flex flex-wrap gap-1">
                            {w.skills.map((skill, i) => (
                              <Badge key={i} variant="sage">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 자기소개 */}
                      {w.bio && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">자기소개</p>
                          <p className="text-sm text-gray-600">{w.bio}</p>
                        </div>
                      )}

                      {/* 경력 */}
                      {w.experiences && w.experiences.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">경력 ({w.experiences.length}건)</p>
                          <div className="space-y-2">
                            {w.experiences.map((exp, i) => (
                              <div key={i} className="text-sm bg-gray-50 p-2 rounded-lg">
                                <p className="font-medium text-dark">{exp.company_name}</p>
                                <p className="text-xs text-gray-500">{exp.work_period} · {exp.responsibility}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 자격증 */}
                      {w.certificates && w.certificates.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">자격증 ({w.certificates.length}건)</p>
                          <div className="space-y-2">
                            {w.certificates.map((cert, i) => (
                              <div key={i} className="text-sm bg-gray-50 p-2 rounded-lg">
                                <p className="font-medium text-dark">{cert.cert_name}</p>
                                <p className="text-xs text-gray-500">{cert.issuing_agency} · {cert.acquired_date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 지원일시 */}
                      <p className="text-xs text-gray-400">
                        지원일: {new Date(a.applied_at).toLocaleDateString("ko-KR")}
                      </p>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChat(w.id)}
                          disabled={chattingWith === w.id}
                        >
                          {chattingWith === w.id ? "연결 중..." : "💬 채팅하기"}
                        </Button>
                        {a.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatus(a.application_id, "rejected")}
                              disabled={updating === a.application_id}
                            >
                              거절
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatus(a.application_id, "accepted")}
                              disabled={updating === a.application_id}
                            >
                              수락
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-dark">{value}</p>
    </div>
  );
}
