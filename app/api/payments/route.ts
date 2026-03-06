import { requireAuth, requireRole } from "@/lib/supabase/middleware";
import { paymentSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  // Relationships: [] 이슈로 조인 불가 — 별도 쿼리 사용
  const { data: payments, error: fetchError } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // 내 계약에 해당하는 결제만 필터링
  const contractIds = [...new Set((payments ?? []).map((p) => p.contract_id).filter((id): id is string => id !== null))];
  if (contractIds.length === 0) return NextResponse.json([]);

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, job_id, worker_id, company_id")
    .in("id", contractIds);

  const myContracts = (contracts ?? []).filter(
    (c) => c.worker_id === user!.id || c.company_id === user!.id
  );
  const myContractIds = new Set(myContracts.map((c) => c.id));

  // 공고 제목 가져오기
  const jobIds = [...new Set(myContracts.map((c) => c.job_id).filter((id): id is string => id !== null))];
  const { data: jobs } = jobIds.length > 0
    ? await supabase.from("jobs").select("id, title").in("id", jobIds)
    : { data: [] };

  const contractMap = Object.fromEntries(myContracts.map((c) => [c.id, c]));
  const jobMap = Object.fromEntries((jobs ?? []).map((j) => [j.id, j]));

  const result = (payments ?? [])
    .filter((p) => p.contract_id && myContractIds.has(p.contract_id))
    .map((p) => {
      const contract = contractMap[p.contract_id!];
      return {
        ...p,
        contracts: contract
          ? { ...contract, jobs: contract.job_id ? jobMap[contract.job_id] ?? null : null }
          : null,
      };
    });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // 계약 소유권 확인
  const { data: contract } = await supabase
    .from("contracts")
    .select("id")
    .eq("id", parsed.data.contract_id)
    .eq("company_id", user!.id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "해당 계약을 찾을 수 없습니다" }, { status: 404 });
  }

  const { data, error: insertError } = await supabase
    .from("payments")
    .insert(parsed.data)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
