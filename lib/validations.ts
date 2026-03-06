import { z } from "zod";

// 인증
export const signupSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  phone: z.string().optional(),
  role: z.enum(["worker", "company"]),
  terms_agreed: z.boolean().refine((v) => v === true, "약관에 동의해야 합니다"),
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

// 리뷰
export const reviewSchema = z.object({
  worker_id: z.string().uuid(),
  contract_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  categories: z
    .array(z.object({ label: z.string(), score: z.number().int().min(1).max(5) }))
    .optional(),
  comment: z.string().max(500).optional(),
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
