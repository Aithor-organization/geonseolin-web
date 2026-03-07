"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const INDUSTRIES = [
  "종합건설",
  "전문건설",
  "설비/기전",
  "인테리어/마감",
  "토목/조경",
  "철구조물",
  "건축설계",
  "기타",
];

function formatBizNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

type ApplicationStatus = "none" | "pending" | "approved" | "rejected";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<ApplicationStatus>("none");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [bizCertFile, setBizCertFile] = useState<File | null>(null);

  // 기존 신청 상태 확인
  useEffect(() => {
    async function checkStatus() {
      const res = await fetch("/api/company-register");
      const data = await res.json();
      if (data.application) {
        setStatus(data.application.approval_status as ApplicationStatus);
        if (data.application.rejection_reason) {
          setRejectionReason(data.application.rejection_reason);
        }
      }
      setLoading(false);
    }
    checkStatus();
  }, []);

  // 이미 기업 회원이면 대시보드로
  useEffect(() => {
    if (profile?.role === "company") {
      router.push("/dashboard/company");
    }
  }, [profile, router]);

  const handleSubmit = async () => {
    if (!companyName.trim()) { setError("기업명을 입력하세요"); return; }
    if (!bizNumber.trim() || !/^\d{3}-\d{2}-\d{5}$/.test(bizNumber)) {
      setError("사업자등록번호 형식이 올바르지 않습니다 (000-00-00000)");
      return;
    }
    if (!ceoName.trim()) { setError("대표자명을 입력하세요"); return; }

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/company-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: companyName.trim(),
        biz_number: bizNumber,
        ceo: ceoName.trim(),
        industry: industry || undefined,
        address: companyAddress || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "신청에 실패했습니다");
      setSubmitting(false);
      return;
    }

    // 사업자등록증 파일 업로드
    if (bizCertFile && user) {
      try {
        const supabase = getSupabaseBrowserClient();
        const ext = bizCertFile.name.split(".").pop() || "pdf";
        const filePath = `${user.id}/biz-certificate.${ext}`;
        await supabase.storage
          .from("documents")
          .upload(filePath, bizCertFile, { upsert: true });
        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);
        await (supabase.from("company_profiles") as ReturnType<typeof supabase.from>)
          .update({ biz_certificate_url: data.publicUrl })
          .eq("id", user.id);
      } catch {
        // 파일 업로드 실패 시에도 신청 진행
      }
    }

    setStatus("pending");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  // 승인 대기 중
  if (status === "pending") {
    return (
      <div className="max-w-lg mx-auto py-10 px-5">
        <Card padding="lg">
          <div className="text-center">
            <span className="text-5xl block mb-4">⏳</span>
            <h1 className="font-heading text-2xl font-bold text-sage-dark mb-2">
              기업 등록 심사 중
            </h1>
            <p className="text-gray-500 mb-6">
              관리자가 제출하신 서류를 검토하고 있습니다.
              <br />승인이 완료되면 기업 서비스를 이용하실 수 있습니다.
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard/worker")}>
              대시보드로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 이미 승인됨
  if (status === "approved") {
    return (
      <div className="max-w-lg mx-auto py-10 px-5">
        <Card padding="lg">
          <div className="text-center">
            <span className="text-5xl block mb-4">✅</span>
            <h1 className="font-heading text-2xl font-bold text-sage-dark mb-2">
              기업 등록 승인 완료
            </h1>
            <p className="text-gray-500 mb-6">
              기업 회원으로 전환되었습니다.
            </p>
            <Button variant="primary" onClick={() => router.push("/dashboard/company")}>
              기업 대시보드로 이동
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-5">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-sage-dark">기업 등록 신청</h1>
        <p className="text-sm text-gray-500 mt-1">
          기업 회원으로 전환하려면 아래 정보를 입력하세요. 관리자 승인 후 이용 가능합니다.
        </p>
      </div>

      {status === "rejected" && (
        <div className="mb-4 p-4 bg-red-50 rounded-xl">
          <p className="text-sm font-medium text-red-700 mb-1">이전 신청이 반려되었습니다</p>
          {rejectionReason && (
            <p className="text-xs text-red-600">사유: {rejectionReason}</p>
          )}
          <p className="text-xs text-red-500 mt-2">정보를 수정하여 다시 신청할 수 있습니다.</p>
        </div>
      )}

      <Card padding="lg">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        <div className="flex flex-col gap-4">
          <Input
            label="기업명 *"
            placeholder="OO건설"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />

          <Input
            label="사업자등록번호 *"
            placeholder="000-00-00000"
            value={bizNumber}
            onChange={(e) => setBizNumber(formatBizNumber(e.target.value))}
          />

          <Input
            label="대표자명 *"
            placeholder="홍길동"
            value={ceoName}
            onChange={(e) => setCeoName(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dark">업종</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-muted bg-white text-dark focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors"
            >
              <option value="">선택하세요</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="회사 주소"
            placeholder="서울시 강남구..."
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-dark">사업자등록증</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setBizCertFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage/10 file:text-sage-dark hover:file:bg-sage/20 file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-gray-400">
              PDF, JPG, PNG (최대 10MB) · 국세청 발급 사업자등록증 원본
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/dashboard/worker")}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "신청 중..." : "기업 등록 신청"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
