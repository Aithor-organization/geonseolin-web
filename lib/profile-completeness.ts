/**
 * 프로필 완성도 계산 유틸리티
 *
 * 필수 항목 (10개, 각 10%):
 *  1. 이름 (name)
 *  2. 연락처 (phone)
 *  3. 생년월일 (birth_date)
 *  4. 전문 공종 (specialty)
 *  5. 경력 연수 (experience > 0)
 *  6. 보유 기술 1개 이상 (skills)
 *  7. 희망 일당 (hourly_rate > 0)
 *  8. 희망 근무지 (location)
 *  9. 자기소개 (bio)
 * 10. 경력 또는 자격증 1건 이상
 */

export interface ProfileData {
  // profiles 테이블
  name?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  // worker_profiles 테이블
  specialty?: string | null;
  experience?: number | null;
  skills?: string[] | null;
  hourly_rate?: number | null;
  location?: string | null;
  bio?: string | null;
  // 관련 테이블 카운트
  experience_count?: number;
  certificate_count?: number;
}

export interface CompletionField {
  key: string;
  label: string;
  filled: boolean;
  required: boolean;
}

export interface CompletionResult {
  percentage: number;
  fields: CompletionField[];
  filledCount: number;
  totalRequired: number;
  message: string;
}

const REQUIRED_FIELDS: { key: string; label: string; check: (d: ProfileData) => boolean }[] = [
  { key: "name", label: "이름", check: (d) => !!d.name?.trim() },
  { key: "phone", label: "연락처", check: (d) => !!d.phone?.trim() },
  { key: "birth_date", label: "생년월일", check: (d) => !!d.birth_date },
  { key: "specialty", label: "전문 공종", check: (d) => !!d.specialty?.trim() },
  { key: "experience", label: "경력 연수", check: (d) => (d.experience ?? 0) > 0 },
  { key: "skills", label: "보유 기술", check: (d) => (d.skills?.length ?? 0) >= 1 },
  { key: "hourly_rate", label: "희망 일당", check: (d) => (d.hourly_rate ?? 0) > 0 },
  { key: "location", label: "희망 근무지", check: (d) => !!d.location?.trim() },
  { key: "bio", label: "자기소개", check: (d) => !!d.bio?.trim() },
  {
    key: "career_or_cert",
    label: "경력/자격증",
    check: (d) => (d.experience_count ?? 0) + (d.certificate_count ?? 0) > 0,
  },
];

export function calculateCompletion(data: ProfileData): CompletionResult {
  const fields: CompletionField[] = REQUIRED_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    filled: f.check(data),
    required: true,
  }));

  const filledCount = fields.filter((f) => f.filled).length;
  const totalRequired = fields.length;
  const percentage = Math.round((filledCount / totalRequired) * 100);

  let message: string;
  if (percentage === 100) {
    message = "프로필이 완성되었습니다!";
  } else if (percentage >= 70) {
    message = `프로필 ${percentage}% 완성! 조금만 더 채워주세요.`;
  } else if (percentage >= 40) {
    message = `프로필 ${percentage}% 완성. 프로필을 완성하면 더 많은 기회를 얻을 수 있어요.`;
  } else {
    message = `프로필 ${percentage}% 완성. 프로필을 완성해주세요!`;
  }

  return { percentage, fields, filledCount, totalRequired, message };
}
