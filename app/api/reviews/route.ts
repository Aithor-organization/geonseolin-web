import { requireAuth } from "@/lib/supabase/middleware";
import { reviewSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const workerId = req.nextUrl.searchParams.get("worker_id");
  const companyId = req.nextUrl.searchParams.get("company_id");
  const reviewType = req.nextUrl.searchParams.get("review_type");

  let query = supabase
    .from("reviews")
    .select("*, profiles!reviews_company_id_fkey(name), worker_profile:profiles!reviews_worker_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (workerId) query = query.eq("worker_id", workerId);
  if (companyId) query = query.eq("company_id", companyId);
  if (reviewType) query = query.eq("review_type", reviewType);

  const { data, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  // 프로필 조회로 role 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "프로필을 찾을 수 없습니다" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { review_type: reviewType, contract_id, worker_id, company_id } = parsed.data;

  // role별 권한 검증
  if (reviewType === "company_to_worker" && profile.role !== "company") {
    return NextResponse.json({ error: "기업만 기술자 리뷰를 작성할 수 있습니다" }, { status: 403 });
  }
  if (reviewType === "worker_to_company" && profile.role !== "worker") {
    return NextResponse.json({ error: "기술자만 기업 리뷰를 작성할 수 있습니다" }, { status: 403 });
  }

  // 계약 기반 검증: 완료된 계약이 있는지 확인
  if (contract_id) {
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, status, worker_id, company_id, company_confirmed")
      .eq("id", contract_id)
      .single();

    if (!contract) {
      return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
    }

    // 기술자→기업 리뷰: 기업이 작업 완료 확인(증명)해야 작성 가능
    if (reviewType === "worker_to_company" && !contract.company_confirmed) {
      return NextResponse.json({ error: "기업의 작업 완료 확인 후 리뷰를 작성할 수 있습니다" }, { status: 403 });
    }

    // 계약 당사자인지 확인
    if (reviewType === "company_to_worker" && contract.company_id !== user!.id) {
      return NextResponse.json({ error: "본인 계약의 기술자만 리뷰할 수 있습니다" }, { status: 403 });
    }
    if (reviewType === "worker_to_company" && contract.worker_id !== user!.id) {
      return NextResponse.json({ error: "본인 계약의 기업만 리뷰할 수 있습니다" }, { status: 403 });
    }
  }

  // 중복 리뷰 방지
  const dupQuery = supabase
    .from("reviews")
    .select("id")
    .eq("review_type", reviewType);

  if (contract_id) {
    dupQuery.eq("contract_id", contract_id);
  }

  if (reviewType === "company_to_worker") {
    dupQuery.eq("company_id", user!.id).eq("worker_id", worker_id);
  } else {
    dupQuery.eq("worker_id", user!.id).eq("company_id", company_id ?? "");
  }

  const { data: existing } = await dupQuery.maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "이미 리뷰를 작성했습니다" }, { status: 409 });
  }

  // 리뷰 생성 (review_type은 마이그레이션 후 타입 재생성 전이므로 타입 단언)
  const insertData = {
    rating: parsed.data.rating,
    categories: parsed.data.categories as unknown,
    comment: parsed.data.comment,
    review_type: reviewType,
    contract_id: contract_id ?? null,
    worker_id: reviewType === "company_to_worker" ? worker_id : user!.id,
    company_id: reviewType === "company_to_worker" ? user!.id : (company_id ?? ""),
  } as any;

  const { data, error: insertError } = await supabase
    .from("reviews")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
