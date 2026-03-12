import { z } from "zod";

// 인증
export const signupSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  phone: z.string().optional(),
  terms_agreed: z.boolean().refine((v) => v === true, "약관에 동의해야 합니다"),
});

// 기업 등록 신청
export const companyRegisterSchema = z.object({
  company_name: z.string().min(1, "기업명을 입력하세요"),
  biz_number: z.string().regex(/^\d{3}-\d{2}-\d{5}$/, "사업자등록번호 형식: 000-00-00000"),
  ceo: z.string().min(2, "대표자명은 2자 이상이어야 합니다"),
  industry: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

// 기술자 프로필
export const workerProfileSchema = z.object({
  specialty: z.string().optional(),
  experience: z.number().int().min(0).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  hourly_rate: z.number().int().min(0).optional(),
  available: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  preferred_regions: z.array(z.string()).optional(),
});

// 경력 사항
export const workerExperienceSchema = z.object({
  company_name: z.string().min(1, "회사/현장명을 입력하세요"),
  work_period: z.string().optional(),
  responsibility: z.string().optional(),
});

// 자격증
export const workerCertificateSchema = z.object({
  cert_name: z.string().min(1, "자격증명을 입력하세요"),
  acquired_date: z.string().optional(),
  issuing_agency: z.string().optional(),
});

// 기업 프로필
export const companyProfileSchema = z.object({
  company_name: z.string().min(1).optional(),
  biz_number: z.string().regex(/^\d{3}-\d{2}-\d{5}$/, "사업자등록번호 형식: 000-00-00000").optional(),
  ceo: z.string().optional(),
  industry: z.string().optional(),
  employees: z.string().optional(),
  address: z.string().optional(),
  description: z.string().max(1000).optional(),
});

// 공고
export const jobSchema = z.object({
  title: z.string().min(5, "제목은 5자 이상이어야 합니다"),
  location: z.string().optional(),
  salary: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  deadline: z.string().optional(),
});

// 지원
export const applicationSchema = z.object({
  job_id: z.string().uuid(),
  message: z.string().max(500).optional(),
});

// 리뷰 (양방향: 기업→기술자 / 기술자→기업)
export const reviewSchema = z.object({
  worker_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  contract_id: z.string().uuid().optional(),
  review_type: z.enum(["company_to_worker", "worker_to_company"]),
  rating: z.number().int().min(1).max(5),
  categories: z
    .array(z.object({ label: z.string(), score: z.number().int().min(1).max(5) }))
    .optional(),
  comment: z.string().min(20, "리뷰는 20자 이상 작성해야 합니다").max(500),
});

// 메시지
export const messageSchema = z.object({
  text: z.string().min(1).max(2000),
});

// 계약
export const contractSchema = z.object({
  job_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  daily_rate: z.number().int().min(1),
  work_days: z.number().int().min(1),
  total_amount: z.number().int().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// 결제
export const paymentSchema = z.object({
  contract_id: z.string().uuid(),
  amount: z.number().int().min(1),
  method: z.enum(["card", "bank_transfer", "escrow"]),
});

// 설정
export const settingsSchema = z.object({
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  chat_enabled: z.boolean().optional(),
  profile_public: z.boolean().optional(),
  location_enabled: z.boolean().optional(),
  ai_matching_enabled: z.boolean().optional(),
  matching_min_score: z.number().int().min(0).max(100).optional(),
  matching_max_results: z.number().int().min(1).max(20).optional(),
  matching_preferred_locations: z.array(z.string()).optional(),
  matching_preferred_types: z.array(z.string()).optional(),
});

// 쿼리 파라미터
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const workerSearchSchema = paginationSchema.extend({
  specialty: z.string().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  available: z.coerce.boolean().optional(),
  min_rate: z.coerce.number().optional(),
  max_rate: z.coerce.number().optional(),
});

export const jobSearchSchema = paginationSchema.extend({
  location: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["active", "closed", "draft"]).optional(),
});

// AI 자동 지원 설정
export const autoApplySettingsSchema = z.object({
  enabled: z.boolean(),
  max_daily_applications: z.number().int().min(1).max(10).default(3),
  apply_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM 형식"),
  preferred_locations: z.array(z.string()).default([]),
  min_daily_rate: z.number().int().min(0).default(0),
  job_types: z.array(z.string()).default([]),
  exclude_keywords: z.array(z.string()).default([]),
  templates: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    content: z.string().min(20).max(1000),
  })).max(5).default([]),
  active_template_id: z.string().uuid().nullable().default(null),
});

// AI 기업 챗봇 설정
export const companyBotSettingsSchema = z.object({
  enabled: z.boolean(),
  schedule_mode: z.enum(["always", "off_hours", "custom"]),
  custom_start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  custom_end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  tone: z.enum(["formal", "polite", "concise"]).default("polite"),
  escalation_keywords: z.array(z.string()).default([]),
  notify_on_escalation: z.boolean().default(true),
});

// FAQ
export const botFaqSchema = z.object({
  question: z.string().min(5).max(200),
  answer: z.string().min(5).max(500),
  category: z.string().max(20).optional(),
});

// 지원자 확정/거절
export const confirmApplicationSchema = z.object({
  action: z.enum(["accept", "reject"]),
  auto_reject_others: z.boolean().default(false),
  create_contract_draft: z.boolean().default(false),
  contract_data: z.object({
    daily_rate: z.number().int().positive(),
    work_days: z.number().int().positive(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }).optional(),
});
