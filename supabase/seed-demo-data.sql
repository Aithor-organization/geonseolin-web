-- ============================================
-- 건설人 데모 데이터 시드
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. auth.users에 데모 유저 생성
-- 비밀번호: demo1234 (bcrypt hash)
-- Supabase GoTrue는 bcrypt를 사용

DO $$
DECLARE
  -- demo1234의 bcrypt hash
  pw_hash TEXT := crypt('demo1234', gen_salt('bf'));

  w1_id UUID := gen_random_uuid();
  w2_id UUID := gen_random_uuid();
  w3_id UUID := gen_random_uuid();
  w4_id UUID := gen_random_uuid();
  w5_id UUID := gen_random_uuid();
  w6_id UUID := gen_random_uuid();
  c1_id UUID := gen_random_uuid();
  c2_id UUID := gen_random_uuid();
  c3_id UUID := gen_random_uuid();
  c4_id UUID := gen_random_uuid();
  admin_id UUID := gen_random_uuid();
BEGIN

  -- ============================================
  -- auth.users 삽입
  -- ============================================

  -- 기존 데모 유저 삭제 (이메일 기준)
  DELETE FROM auth.users WHERE email IN (
    'worker1@demo.com', 'worker2@demo.com', 'worker3@demo.com',
    'worker4@demo.com', 'worker5@demo.com', 'worker6@demo.com',
    'company1@demo.com', 'company2@demo.com', 'company3@demo.com', 'company4@demo.com',
    'admin@demo.com'
  );

  -- Workers
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES
    (w1_id, '00000000-0000-0000-0000-000000000000', 'worker1@demo.com', pw_hash, NOW(), '{"name":"김철수","role":"worker"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (w2_id, '00000000-0000-0000-0000-000000000000', 'worker2@demo.com', pw_hash, NOW(), '{"name":"이영희","role":"worker"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (w3_id, '00000000-0000-0000-0000-000000000000', 'worker3@demo.com', pw_hash, NOW(), '{"name":"박민수","role":"worker"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (w4_id, '00000000-0000-0000-0000-000000000000', 'worker4@demo.com', pw_hash, NOW(), '{"name":"최지훈","role":"worker"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (w5_id, '00000000-0000-0000-0000-000000000000', 'worker5@demo.com', pw_hash, NOW(), '{"name":"정하나","role":"worker"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (w6_id, '00000000-0000-0000-0000-000000000000', 'worker6@demo.com', pw_hash, NOW(), '{"name":"오성현","role":"worker"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '');

  -- Companies
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES
    (c1_id, '00000000-0000-0000-0000-000000000000', 'company1@demo.com', pw_hash, NOW(), '{"name":"한양건설","role":"company"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (c2_id, '00000000-0000-0000-0000-000000000000', 'company2@demo.com', pw_hash, NOW(), '{"name":"테크파크건설","role":"company"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (c3_id, '00000000-0000-0000-0000-000000000000', 'company3@demo.com', pw_hash, NOW(), '{"name":"대한인테리어","role":"company"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', ''),
    (c4_id, '00000000-0000-0000-0000-000000000000', 'company4@demo.com', pw_hash, NOW(), '{"name":"서울플랜트","role":"company"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '');

  -- Admin
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES
    (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@demo.com', pw_hash, NOW(), '{"name":"관리자","role":"admin"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '');

  -- ============================================
  -- auth.identities 삽입 (GoTrue v2 필수)
  -- ============================================
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), w1_id, json_build_object('sub', w1_id::text, 'email', 'worker1@demo.com')::jsonb, 'email', w1_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), w2_id, json_build_object('sub', w2_id::text, 'email', 'worker2@demo.com')::jsonb, 'email', w2_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), w3_id, json_build_object('sub', w3_id::text, 'email', 'worker3@demo.com')::jsonb, 'email', w3_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), w4_id, json_build_object('sub', w4_id::text, 'email', 'worker4@demo.com')::jsonb, 'email', w4_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), w5_id, json_build_object('sub', w5_id::text, 'email', 'worker5@demo.com')::jsonb, 'email', w5_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), w6_id, json_build_object('sub', w6_id::text, 'email', 'worker6@demo.com')::jsonb, 'email', w6_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), c1_id, json_build_object('sub', c1_id::text, 'email', 'company1@demo.com')::jsonb, 'email', c1_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), c2_id, json_build_object('sub', c2_id::text, 'email', 'company2@demo.com')::jsonb, 'email', c2_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), c3_id, json_build_object('sub', c3_id::text, 'email', 'company3@demo.com')::jsonb, 'email', c3_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), c4_id, json_build_object('sub', c4_id::text, 'email', 'company4@demo.com')::jsonb, 'email', c4_id::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), admin_id, json_build_object('sub', admin_id::text, 'email', 'admin@demo.com')::jsonb, 'email', admin_id::text, NOW(), NOW(), NOW());

  -- ============================================
  -- profiles (공개 프로필)
  -- ============================================
  INSERT INTO public.profiles (id, role, name, email) VALUES
    (w1_id, 'worker', '김철수', 'worker1@demo.com'),
    (w2_id, 'worker', '이영희', 'worker2@demo.com'),
    (w3_id, 'worker', '박민수', 'worker3@demo.com'),
    (w4_id, 'worker', '최지훈', 'worker4@demo.com'),
    (w5_id, 'worker', '정하나', 'worker5@demo.com'),
    (w6_id, 'worker', '오성현', 'worker6@demo.com'),
    (c1_id, 'company', '한양건설', 'company1@demo.com'),
    (c2_id, 'company', '테크파크건설', 'company2@demo.com'),
    (c3_id, 'company', '대한인테리어', 'company3@demo.com'),
    (c4_id, 'company', '서울플랜트', 'company4@demo.com'),
    (admin_id, 'worker', '관리자', 'admin@demo.com')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

  -- ============================================
  -- worker_profiles (기술자 상세)
  -- ============================================
  INSERT INTO public.worker_profiles (id, specialty, experience, bio, location, hourly_rate, available, skills, rating, review_count, completed_jobs) VALUES
    (w1_id, '배관공', 15, '15년 경력의 배관 전문가입니다. 수도/난방/가스 배관 전문.', '서울 강남구', 45000, true, ARRAY['수도배관','난방배관','가스배관','누수수리'], 4.8, 127, 342),
    (w2_id, '전기기사', 10, '전기기사 1급 자격증 보유. 내선/조명/분전반 전문.', '서울 서초구', 50000, true, ARRAY['내선공사','조명설치','분전반','접지공사'], 4.9, 89, 256),
    (w3_id, '철근공', 8, '아파트/오피스 철근 콘크리트 전문. 안전관리 자격증 보유.', '경기 수원시', 42000, true, ARRAY['철근배근','콘크리트타설','거푸집','안전관리'], 4.6, 64, 178),
    (w4_id, '도장공', 12, '인테리어/외벽 도장 12년 경력. 친환경 도료 전문.', '서울 마포구', 38000, true, ARRAY['내부도장','외벽도장','방수도장','친환경도료'], 4.7, 95, 287),
    (w5_id, '타일공', 7, '욕실/주방 타일 시공 전문. 대리석/포세린 경험 풍부.', '서울 송파구', 40000, true, ARRAY['바닥타일','벽타일','대리석','줄눈시공'], 4.5, 42, 134),
    (w6_id, '용접공', 20, '20년 경력 용접 마스터. 특수강/스테인리스 전문.', '인천 남동구', 55000, true, ARRAY['아크용접','TIG용접','MIG용접','특수강용접'], 4.9, 156, 412)
  ON CONFLICT (id) DO UPDATE SET
    specialty = EXCLUDED.specialty, experience = EXCLUDED.experience, bio = EXCLUDED.bio,
    location = EXCLUDED.location, hourly_rate = EXCLUDED.hourly_rate, skills = EXCLUDED.skills,
    rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, completed_jobs = EXCLUDED.completed_jobs;

  -- ============================================
  -- company_profiles (기업 상세)
  -- ============================================
  INSERT INTO public.company_profiles (id, company_name, biz_number, ceo, industry, employees, address, description) VALUES
    (c1_id, '한양건설', '123-45-67890', '김한양', '종합건설', '150명', '서울 강남구 테헤란로 123', '30년 전통의 종합 건설사. 아파트/오피스 전문.'),
    (c2_id, '테크파크건설', '234-56-78901', '이테크', 'IT건설', '80명', '경기 성남시 판교로 456', 'IT빌딩 전문 건설/관리. 스마트빌딩 시공.'),
    (c3_id, '대한인테리어', '345-67-89012', '박대한', '인테리어', '45명', '서울 마포구 홍대입구역 789', '상업공간/주거공간 인테리어 전문. 디자인 시공 일괄.'),
    (c4_id, '서울플랜트', '456-78-90123', '최서울', '설비건설', '200명', '경기 화성시 동탄대로 101', '대형 플랜트/공장 설비 시공 전문. ISO 14001 인증.')
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name, biz_number = EXCLUDED.biz_number, ceo = EXCLUDED.ceo,
    industry = EXCLUDED.industry, employees = EXCLUDED.employees, address = EXCLUDED.address, description = EXCLUDED.description;

  -- ============================================
  -- jobs (공고)
  -- ============================================
  -- 기존 데모 공고 삭제
  DELETE FROM public.jobs WHERE company_id IN (c1_id, c2_id, c3_id, c4_id);

  INSERT INTO public.jobs (company_id, title, location, salary, type, description, requirements, benefits, applicant_count, status, deadline) VALUES
    -- 한양건설
    (c1_id, '강남 오피스텔 배관 교체 공사', '서울 강남구', '일 35만원', '단기 (2주)', '강남구 소재 오피스텔 30세대 노후 배관 전면 교체 작업입니다. PVC/동파이프 교체 경험 필수.', ARRAY['배관공 경력 5년 이상','PVC 배관 시공 경험','자격증 소지자 우대'], ARRAY['중식 제공','주차 가능','안전장비 지급'], 12, 'active', NOW() + INTERVAL '14 days'),
    (c1_id, '서초 아파트 난방 배관 공사', '서울 서초구', '일 40만원', '단기 (1주)', '서초구 대단지 아파트 난방 배관 교체. 동절기 전 긴급 시공.', ARRAY['난방배관 경력 3년 이상','보일러 배관 경험','자격증 우대'], ARRAY['식대 제공','교통비 지원'], 5, 'active', NOW() + INTERVAL '7 days'),

    -- 테크파크건설
    (c2_id, '판교 IT센터 전기 공사', '경기 성남시', '일 45만원', '장기 (2개월)', '판교 테크노밸리 IT센터 신축 전기 내선 공사. 스마트빌딩 자동화 설비 포함.', ARRAY['전기기사 자격증 필수','내선공사 5년 이상','스마트빌딩 경험 우대'], ARRAY['4대보험','중식 제공','통근버스','성과급'], 8, 'active', NOW() + INTERVAL '21 days'),

    -- 대한인테리어
    (c3_id, '홍대 카페 인테리어 도장 공사', '서울 마포구', '일 30만원', '단기 (5일)', '홍대 신규 카페 매장 내부 도장 공사. 친환경 도료 사용 필수.', ARRAY['도장 경력 3년 이상','실내 도장 경험','친환경 도료 경험 우대'], ARRAY['식대 제공','교통비 지원'], 3, 'active', NOW() + INTERVAL '5 days'),
    (c3_id, '강남 고급 주택 타일 시공', '서울 강남구', '일 42만원', '단기 (1주)', '강남 단독주택 욕실 3곳 + 주방 타일 전면 시공. 대리석/포세린 타일.', ARRAY['타일 시공 5년 이상','대리석 경험 필수','포세린 타일 경험 우대'], ARRAY['재료비 별도','중식 제공','주차 가능'], 7, 'active', NOW() + INTERVAL '10 days'),

    -- 서울플랜트
    (c4_id, '화성 반도체 공장 용접 공사', '경기 화성시', '일 55만원', '장기 (6개월)', '화성 반도체 공장 배관 용접 공사. TIG/특수강 용접 기술 필수. 클린룸 내 작업.', ARRAY['용접기능사 이상','TIG 용접 경력 10년 이상','클린룸 경험 우대','산업안전교육 이수'], ARRAY['4대보험','기숙사 제공','중식/석식','통근버스','연장근무수당'], 4, 'active', NOW() + INTERVAL '30 days'),
    (c4_id, '동탄 물류센터 철골 공사', '경기 화성시', '일 48만원', '장기 (4개월)', '동탄 대형 물류센터 철골 구조물 시공. 고소 작업 포함.', ARRAY['철근공 경력 5년 이상','고소작업 경험','안전관리 자격증 우대'], ARRAY['4대보험','기숙사','중식 제공','안전장비 지급'], 9, 'active', NOW() + INTERVAL '20 days');

  -- ============================================
  -- user_settings (기본 설정)
  -- ============================================
  INSERT INTO public.user_settings (user_id, push_enabled, email_enabled, chat_enabled, profile_public, location_enabled)
  VALUES
    (w1_id, true, true, true, true, false),
    (w2_id, true, true, true, true, false),
    (w3_id, true, true, true, true, false),
    (w4_id, true, true, true, true, false),
    (w5_id, true, true, true, true, false),
    (w6_id, true, true, true, true, false),
    (c1_id, true, true, true, true, false),
    (c2_id, true, true, true, true, false),
    (c3_id, true, true, true, true, false),
    (c4_id, true, true, true, true, false),
    (admin_id, true, true, true, true, false)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '데모 데이터 시드 완료!';
  RAISE NOTICE '기술자 6명, 기업 4명, 관리자 1명, 공고 7건 생성';
  RAISE NOTICE '모든 계정 비밀번호: demo1234';

END $$;
