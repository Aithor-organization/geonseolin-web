-- ============================================================================
-- geonseolin-web: Combined SQL Migration
-- Project: 건설인 (Construction Worker Platform)
-- Generated: 2026-03-12
-- Description: All migration files (001~029) combined into a single file.
--              Execute in order on a fresh Supabase database.
-- ============================================================================


-- ============================================================================
-- Migration: 001_create_profiles.sql
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('worker', 'company')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- Migration: 002_create_worker_profiles.sql
-- ============================================================================

CREATE TABLE public.worker_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty TEXT,
  experience INTEGER DEFAULT 0,
  bio TEXT,
  location TEXT,
  hourly_rate INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  skills TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0
);

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read worker profiles" ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "Workers update own profile" ON public.worker_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Workers insert own profile" ON public.worker_profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================================
-- Migration: 003_create_company_profiles.sql
-- ============================================================================

CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  biz_number TEXT,
  ceo TEXT,
  industry TEXT,
  employees TEXT,
  address TEXT,
  description TEXT
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read company profiles" ON public.company_profiles FOR SELECT USING (true);
CREATE POLICY "Companies update own profile" ON public.company_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Companies insert own profile" ON public.company_profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================================
-- Migration: 004_create_jobs.sql
-- ============================================================================

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  type TEXT,
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  applicant_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active jobs" ON public.jobs FOR SELECT USING (status = 'active' OR company_id = auth.uid());
CREATE POLICY "Companies insert own jobs" ON public.jobs FOR INSERT WITH CHECK (company_id = auth.uid());
CREATE POLICY "Companies update own jobs" ON public.jobs FOR UPDATE USING (company_id = auth.uid());
CREATE POLICY "Companies delete own jobs" ON public.jobs FOR DELETE USING (company_id = auth.uid());

CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_location ON public.jobs(location);


-- ============================================================================
-- Migration: 005_create_applications.sql
-- ============================================================================

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers read own applications" ON public.applications FOR SELECT
  USING (worker_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id = auth.uid()
  ));
CREATE POLICY "Workers insert own applications" ON public.applications FOR INSERT
  WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Companies update application status" ON public.applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.company_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION increment_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs SET applicant_count = applicant_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION increment_applicant_count();

CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_worker_id ON public.applications(worker_id);


-- ============================================================================
-- Migration: 006_create_chat.sql
-- ============================================================================

CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_participants (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read rooms" ON public.chat_rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_participants WHERE room_id = chat_rooms.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated insert rooms" ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants read own entries" ON public.chat_participants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM chat_participants cp WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
  ));
CREATE POLICY "Authenticated insert participants" ON public.chat_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update own last_read" ON public.chat_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Participants read messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_participants WHERE room_id = messages.room_id AND user_id = auth.uid()));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM chat_participants WHERE room_id = messages.room_id AND user_id = auth.uid()
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE INDEX idx_messages_room_id ON public.messages(room_id, created_at);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);


-- ============================================================================
-- Migration: 007_create_reviews.sql
-- ============================================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  contract_id UUID,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  categories JSONB DEFAULT '[]',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Companies insert reviews" ON public.reviews FOR INSERT WITH CHECK (company_id = auth.uid());
CREATE POLICY "Companies update own reviews" ON public.reviews FOR UPDATE USING (company_id = auth.uid());

CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(2,1);
  total_reviews INTEGER;
BEGIN
  SELECT AVG(rating)::NUMERIC(2,1), COUNT(*) INTO avg_rating, total_reviews
  FROM public.reviews WHERE worker_id = NEW.worker_id;

  UPDATE public.worker_profiles
  SET rating = avg_rating, review_count = total_reviews
  WHERE id = NEW.worker_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_insert
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_worker_rating();

CREATE INDEX idx_reviews_worker_id ON public.reviews(worker_id);
CREATE INDEX idx_reviews_company_id ON public.reviews(company_id);


-- ============================================================================
-- Migration: 008_create_contracts_payments.sql
-- ============================================================================

CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id),
  worker_id UUID REFERENCES public.worker_profiles(id),
  company_id UUID REFERENCES public.company_profiles(id),
  daily_rate INTEGER NOT NULL,
  work_days INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id),
  amount INTEGER NOT NULL,
  method TEXT CHECK (method IN ('card', 'bank_transfer', 'escrow')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  escrow_released BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own contracts" ON public.contracts FOR SELECT
  USING (worker_id = auth.uid() OR company_id = auth.uid());
CREATE POLICY "Companies create contracts" ON public.contracts FOR INSERT
  WITH CHECK (company_id = auth.uid());
CREATE POLICY "Parties update contracts" ON public.contracts FOR UPDATE
  USING (worker_id = auth.uid() OR company_id = auth.uid());

CREATE POLICY "Contract parties read payments" ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contracts WHERE contracts.id = payments.contract_id
    AND (contracts.worker_id = auth.uid() OR contracts.company_id = auth.uid())
  ));
CREATE POLICY "Companies create payments" ON public.payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contracts WHERE contracts.id = payments.contract_id AND contracts.company_id = auth.uid()
  ));
CREATE POLICY "System update payments" ON public.payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.contracts WHERE contracts.id = payments.contract_id
    AND (contracts.worker_id = auth.uid() OR contracts.company_id = auth.uid())
  ));

CREATE INDEX idx_contracts_worker_id ON public.contracts(worker_id);
CREATE INDEX idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX idx_payments_contract_id ON public.payments(contract_id);


-- ============================================================================
-- Migration: 009_create_settings.sql
-- ============================================================================

CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  profile_public BOOLEAN DEFAULT true,
  location_enabled BOOLEAN DEFAULT false
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own settings only" ON public.user_settings FOR ALL USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_settings();


-- ============================================================================
-- Migration: 010_seed_demo_data.sql
-- ============================================================================

-- 데모 데이터 시드 (로컬 개발용)
DO $$
DECLARE
  w1_id UUID := '00000000-0000-0000-0000-000000000001';
  w2_id UUID := '00000000-0000-0000-0000-000000000002';
  w3_id UUID := '00000000-0000-0000-0000-000000000003';
  w4_id UUID := '00000000-0000-0000-0000-000000000004';
  w5_id UUID := '00000000-0000-0000-0000-000000000005';
  w6_id UUID := '00000000-0000-0000-0000-000000000006';
  c1_id UUID := '00000000-0000-0000-0000-000000000011';
  c2_id UUID := '00000000-0000-0000-0000-000000000012';
  c3_id UUID := '00000000-0000-0000-0000-000000000013';
  c4_id UUID := '00000000-0000-0000-0000-000000000014';
BEGIN
  -- Auth users
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
  VALUES
    (w1_id, 'worker1@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (w2_id, 'worker2@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (w3_id, 'worker3@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (w4_id, 'worker4@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (w5_id, 'worker5@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (w6_id, 'worker6@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (c1_id, 'company1@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (c2_id, 'company2@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (c3_id, 'company3@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (c4_id, 'company4@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Profiles
  INSERT INTO public.profiles (id, role, name, email) VALUES
    (w1_id, 'worker', '김철수', 'worker1@demo.com'),
    (w2_id, 'worker', '이영희', 'worker2@demo.com'),
    (w3_id, 'worker', '박민호', 'worker3@demo.com'),
    (w4_id, 'worker', '최승현', 'worker4@demo.com'),
    (w5_id, 'worker', '정수민', 'worker5@demo.com'),
    (w6_id, 'worker', '한지우', 'worker6@demo.com'),
    (c1_id, 'company', '한양건설', 'company1@demo.com'),
    (c2_id, 'company', '테크파크건설', 'company2@demo.com'),
    (c3_id, 'company', '드림홈인테리어', 'company3@demo.com'),
    (c4_id, 'company', '대한철강건설', 'company4@demo.com')
  ON CONFLICT (id) DO NOTHING;

  -- Worker profiles
  INSERT INTO public.worker_profiles (id, specialty, experience, bio, location, hourly_rate, available, skills, rating, review_count, completed_jobs) VALUES
    (w1_id, '배관공', 15, '15년 경력의 배관 전문가입니다. 주거/상업 시설 모두 가능합니다.', '서울 강남구', 45000, true, ARRAY['수도배관','난방배관','가스배관','누수수리'], 4.8, 127, 342),
    (w2_id, '전기기사', 10, '전기기사 1급 자격증 보유. 안전한 전기공사를 약속합니다.', '서울 서초구', 50000, true, ARRAY['내선공사','조명설치','분전반','접지공사'], 4.9, 89, 256),
    (w3_id, '인테리어', 8, '감각적인 인테리어 시공을 합리적 가격에 제공합니다.', '경기 성남시', 40000, false, ARRAY['도배','타일','바닥재','목공'], 4.7, 64, 189),
    (w4_id, '철근공', 20, '20년 베테랑 철근 전문가. 대형 건축 프로젝트 다수 경험.', '인천 남동구', 55000, true, ARRAY['철근배근','용접','구조물','콘크리트'], 4.6, 156, 478),
    (w5_id, '도장공', 6, '깔끔한 마감을 자신합니다. 친환경 페인트 전문.', '서울 마포구', 35000, true, ARRAY['내부도장','외부도장','방수','에폭시'], 4.5, 42, 134),
    (w6_id, '목수', 12, '정교한 목공 작업이 전문입니다. 맞춤 가구 제작 가능.', '서울 송파구', 48000, true, ARRAY['가구제작','수장공사','몰딩','데크'], 4.8, 98, 312)
  ON CONFLICT (id) DO NOTHING;

  -- Company profiles
  INSERT INTO public.company_profiles (id, company_name, biz_number, ceo, industry, employees, address, description) VALUES
    (c1_id, '한양건설', '123-45-67890', '김한양', '종합건설', '150명', '서울 강남구 테헤란로', '30년 전통의 종합 건설사'),
    (c2_id, '테크파크건설', '234-56-78901', '이테크', 'IT건설', '80명', '경기 성남시 판교', 'IT빌딩 전문 건설/관리'),
    (c3_id, '드림홈인테리어', '345-67-89012', '박드림', '인테리어', '30명', '서울 송파구 잠실', '주거/상업 인테리어 전문'),
    (c4_id, '대한철강건설', '456-78-90123', '최철강', '철강건설', '200명', '인천 서구 가좌동', '대형 철골 구조물 전문')
  ON CONFLICT (id) DO NOTHING;

  -- Jobs
  INSERT INTO public.jobs (id, company_id, title, location, salary, type, description, requirements, benefits, applicant_count, status, posted_at, deadline) VALUES
    (gen_random_uuid(), c1_id, '강남 오피스텔 배관 교체 공사', '서울 강남구', '일 35만원', '단기 (2주)', '강남구 소재 오피스텔 30세대 배관 교체 작업입니다. 노후 배관을 신규 PVC 배관으로 교체하는 프로젝트로, 경험 있는 배관공을 모집합니다.', ARRAY['배관공 경력 5년 이상','PVC 배관 시공 경험','자격증 소지자 우대'], ARRAY['중식 제공','주차 가능','안전장비 지급'], 12, 'active', '2026-03-01', '2026-03-15'),
    (gen_random_uuid(), c2_id, '판교 IT빌딩 전기 설비 점검', '경기 성남시', '일 40만원', '정기 (월 2회)', '판교 테크노밸리 소재 IT빌딩의 전기 설비 정기 점검 업무입니다.', ARRAY['전기기사 자격증 필수','상업시설 점검 경험 3년 이상','주말 근무 가능자'], ARRAY['교통비 지원','식대 제공','장기 계약 가능'], 8, 'active', '2026-02-28', '2026-03-20'),
    (gen_random_uuid(), c3_id, '송파 아파트 리모델링 인테리어', '서울 송파구', '일 30만원', '단기 (3주)', '32평 아파트 전체 리모델링 프로젝트입니다.', ARRAY['인테리어 경력 3년 이상','도배/타일 동시 가능자 우대','포트폴리오 제출'], ARRAY['자재비 별도','식대 제공','추가 근무 시 수당'], 15, 'active', '2026-03-02', '2026-03-18'),
    (gen_random_uuid(), c4_id, '인천 물류센터 철골 구조물 설치', '인천 서구', '일 50만원', '중기 (2개월)', '대형 물류센터 신축 현장의 철골 구조물 설치 작업입니다.', ARRAY['철근공 경력 10년 이상','고소 작업 가능자','안전교육 이수증'], ARRAY['숙소 제공','3식 제공','안전보험 가입'], 6, 'active', '2026-02-25', '2026-03-10');

  -- Reviews
  INSERT INTO public.reviews (worker_id, company_id, rating, categories, comment, created_at) VALUES
    (w1_id, c1_id, 5, '[{"label":"기술력","score":5},{"label":"시간 준수","score":5},{"label":"의사소통","score":4},{"label":"현장 정리","score":5}]'::jsonb, '배관 교체 작업을 깔끔하게 마무리해주셨습니다.', '2026-02-20'),
    (w2_id, c2_id, 5, '[{"label":"기술력","score":5},{"label":"시간 준수","score":5},{"label":"의사소통","score":5},{"label":"현장 정리","score":4}]'::jsonb, '전기 설비 점검을 꼼꼼하게 진행해주셨어요.', '2026-02-15');
END $$;

-- 채팅 데이터 (별도 DO 블록 - PostgreSQL 중첩 DECLARE 불가)
DO $$
DECLARE
  w1_id UUID := '00000000-0000-0000-0000-000000000001';
  c1_id UUID := '00000000-0000-0000-0000-000000000011';
  room1_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.chat_rooms (id) VALUES (room1_id);
  INSERT INTO public.chat_participants (room_id, user_id) VALUES (room1_id, w1_id), (room1_id, c1_id);
  INSERT INTO public.messages (room_id, sender_id, text, created_at) VALUES
    (room1_id, c1_id, '안녕하세요, 김철수 기술자님!', NOW() - INTERVAL '30 minutes'),
    (room1_id, c1_id, '강남 오피스텔 배관 교체 건으로 연락드립니다.', NOW() - INTERVAL '29 minutes'),
    (room1_id, w1_id, '안녕하세요! 네, 공고 확인했습니다.', NOW() - INTERVAL '20 minutes'),
    (room1_id, w1_id, '30세대 규모면 2주 일정 가능할 것 같습니다.', NOW() - INTERVAL '19 minutes'),
    (room1_id, c1_id, '좋습니다! 현장 방문 한 번 해주시면 좋겠는데요.', NOW() - INTERVAL '5 minutes'),
    (room1_id, c1_id, '내일 현장 미팅 10시에 가능하신가요?', NOW());
END $$;


-- ============================================================================
-- Migration: 011_add_worker_experience_certs.sql
-- ============================================================================

-- 경력 사항 테이블
CREATE TABLE public.worker_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  work_period TEXT,
  responsibility TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자격증 테이블
CREATE TABLE public.worker_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  cert_name TEXT NOT NULL,
  acquired_date DATE,
  issuing_agency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- worker_profiles 추가 컬럼 (대시보드 통계용)
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS preferred_regions TEXT[] DEFAULT '{}';

-- profiles 약관 동의 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT false;

-- RLS 정책
ALTER TABLE public.worker_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read experiences" ON public.worker_experiences FOR SELECT USING (true);
CREATE POLICY "Workers manage own experiences" ON public.worker_experiences FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers update own experiences" ON public.worker_experiences FOR UPDATE USING (worker_id = auth.uid());
CREATE POLICY "Workers delete own experiences" ON public.worker_experiences FOR DELETE USING (worker_id = auth.uid());

ALTER TABLE public.worker_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certificates" ON public.worker_certificates FOR SELECT USING (true);
CREATE POLICY "Workers manage own certificates" ON public.worker_certificates FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers update own certificates" ON public.worker_certificates FOR UPDATE USING (worker_id = auth.uid());
CREATE POLICY "Workers delete own certificates" ON public.worker_certificates FOR DELETE USING (worker_id = auth.uid());

-- 인덱스
CREATE INDEX idx_worker_experiences_worker_id ON public.worker_experiences(worker_id);
CREATE INDEX idx_worker_certificates_worker_id ON public.worker_certificates(worker_id);

-- 프로필 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_profile_views(worker_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.worker_profiles
  SET profile_views = profile_views + 1
  WHERE id = worker_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- total_earnings 자동 업데이트 트리거 (결제 완료 시)
CREATE OR REPLACE FUNCTION update_worker_total_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.worker_profiles
    SET total_earnings = total_earnings + NEW.amount
    WHERE id = (
      SELECT worker_id FROM public.contracts WHERE id = NEW.contract_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_payment_completed
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_worker_total_earnings();


-- ============================================================================
-- Migration: 012_login_attempts.sql
-- ============================================================================

-- 로그인 시도 제한 (5회 실패 시 30분 잠금)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);

-- 30분 지난 잠금 자동 해제를 위한 함수
CREATE OR REPLACE FUNCTION check_login_lock(p_email TEXT)
RETURNS TABLE(is_locked BOOLEAN, remaining_minutes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN la.locked_until IS NOT NULL AND la.locked_until > NOW() THEN TRUE
      ELSE FALSE
    END AS is_locked,
    CASE
      WHEN la.locked_until IS NOT NULL AND la.locked_until > NOW()
        THEN EXTRACT(MINUTE FROM (la.locked_until - NOW()))::INTEGER
      ELSE 0
    END AS remaining_minutes
  FROM public.login_attempts la
  WHERE la.email = p_email
  ORDER BY la.last_attempt_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- Migration: 013_add_urgent_jobs.sql
-- ============================================================================

-- 긴급 공고 플래그
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- 긴급 공고 인덱스
CREATE INDEX IF NOT EXISTS idx_jobs_urgent ON public.jobs (is_urgent) WHERE is_urgent = true;


-- ============================================================================
-- Migration: 013_storage_policies.sql
-- ============================================================================

-- 프로필 이미지 저장용 Storage 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자만 자기 폴더에 업로드 가능
CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 수정 가능
CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 삭제 가능
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 공개 읽기 허용
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');


-- ============================================================================
-- Migration: 014_enhance_contracts_payments.sql
-- ============================================================================

-- 계약 테이블 강화: 디지털 서명 + 작업 완료 확인
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS signed_by_worker BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_by_company BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS worker_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 결제 테이블 강화: Toss Payments 연동
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_key TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS toss_status TEXT,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 양측 확인 완료 시 에스크로 자동 해제 트리거
CREATE OR REPLACE FUNCTION auto_release_escrow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.worker_confirmed = true AND NEW.company_confirmed = true THEN
    NEW.confirmed_at = NOW();
    NEW.status = 'completed';
    -- 해당 계약의 에스크로 결제 해제
    UPDATE public.payments
    SET escrow_released = true, status = 'completed'
    WHERE contract_id = NEW.id AND status = 'processing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_release_escrow ON public.contracts;
CREATE TRIGGER trg_auto_release_escrow
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION auto_release_escrow();


-- ============================================================================
-- Migration: 015_admin_settings_reports.sql
-- ============================================================================

-- 플랫폼 설정 (단일 행)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  fee_rate NUMERIC(4,2) DEFAULT 5.0,
  min_daily_rate INTEGER DEFAULT 150000,
  auto_match BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- admin만 읽기/쓰기 (user_metadata.role = 'admin')
CREATE POLICY "Admin read platform_settings" ON public.platform_settings
  FOR SELECT USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin update platform_settings" ON public.platform_settings
  FOR UPDATE USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 기본 행 삽입
INSERT INTO public.platform_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- 신고/모더레이션 테이블
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_name TEXT NOT NULL,
  target_role TEXT,
  reporter_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- admin만 전체 접근
CREATE POLICY "Admin full access reports" ON public.reports
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 일반 유저는 본인이 신고한 것만 읽기
CREATE POLICY "Reporter read own reports" ON public.reports
  FOR SELECT USING (reporter_user_id = auth.uid());

-- 일반 유저는 신고 생성 가능
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_user_id = auth.uid());


-- ============================================================================
-- Migration: 016_add_biz_certificate.sql
-- ============================================================================

-- 사업자등록증 URL 컬럼 추가
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS biz_certificate_url TEXT;

-- 문서 저장용 Storage 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자만 자기 폴더에 업로드 가능
CREATE POLICY "Document upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 수정 가능
CREATE POLICY "Document update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 파일만 삭제 가능
CREATE POLICY "Document delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 공개 읽기 허용 (관리자 검토용)
CREATE POLICY "Document public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');


-- ============================================================================
-- Migration: 017_company_approval.sql
-- ============================================================================

-- 기업 승인 시스템: company_profiles에 approval_status 추가
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 승인 관련 메타데이터
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 기존 기업 데이터가 있으면 approved로 설정
UPDATE public.company_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;


-- ============================================================================
-- Migration: 018_profile_completeness.sql
-- ============================================================================

-- 프로필 완성도 시스템을 위한 추가 컬럼
-- profiles 테이블에 생년월일, 주소 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;


-- ============================================================================
-- Migration: 019_bidirectional_reviews.sql
-- ============================================================================

-- 양방향 리뷰 시스템: 기업→기술자 + 기술자→기업

-- 1. review_type 컬럼 추가
ALTER TABLE public.reviews
  ADD COLUMN review_type TEXT NOT NULL DEFAULT 'company_to_worker'
  CHECK (review_type IN ('company_to_worker', 'worker_to_company'));

-- 2. 기업 프로필에 평점/리뷰수 추가
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 3. 기술자가 기업 리뷰 작성 가능하도록 RLS 추가
CREATE POLICY "Workers insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (review_type = 'worker_to_company' AND worker_id = auth.uid());

-- 기술자가 본인 작성 리뷰 수정 가능
CREATE POLICY "Workers update own reviews"
  ON public.reviews FOR UPDATE
  USING (review_type = 'worker_to_company' AND worker_id = auth.uid());

-- 4. 기존 기술자 평점 트리거 업데이트 (company_to_worker만 집계)
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(2,1);
  total_reviews INTEGER;
BEGIN
  IF NEW.review_type = 'company_to_worker' THEN
    SELECT AVG(rating)::NUMERIC(2,1), COUNT(*)
    INTO avg_rating, total_reviews
    FROM public.reviews
    WHERE worker_id = NEW.worker_id AND review_type = 'company_to_worker';

    UPDATE public.worker_profiles
    SET rating = avg_rating, review_count = total_reviews
    WHERE id = NEW.worker_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 기업 평점 트리거 추가 (worker_to_company만 집계)
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(2,1);
  total_reviews INTEGER;
BEGIN
  IF NEW.review_type = 'worker_to_company' THEN
    SELECT AVG(rating)::NUMERIC(2,1), COUNT(*)
    INTO avg_rating, total_reviews
    FROM public.reviews
    WHERE company_id = NEW.company_id AND review_type = 'worker_to_company';

    UPDATE public.company_profiles
    SET rating = avg_rating, review_count = total_reviews
    WHERE id = NEW.company_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_company_review_change
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_company_rating();

-- 6. review_type 인덱스
CREATE INDEX idx_reviews_type ON public.reviews(review_type);


-- ============================================================================
-- Migration: 020_auto_apply_settings.sql
-- ============================================================================

CREATE TABLE public.auto_apply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  max_daily_applications INTEGER NOT NULL DEFAULT 3 CHECK (max_daily_applications BETWEEN 1 AND 10),
  apply_time TIME NOT NULL DEFAULT '09:00:00',
  preferred_locations TEXT[] DEFAULT '{}',
  min_daily_rate INTEGER DEFAULT 0,
  job_types TEXT[] DEFAULT '{}',
  exclude_keywords TEXT[] DEFAULT '{}',
  templates JSONB DEFAULT '[]',
  active_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id)
);

ALTER TABLE public.auto_apply_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인만 조회/수정" ON public.auto_apply_settings
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());


-- ============================================================================
-- Migration: 021_auto_apply_logs.sql
-- ============================================================================

CREATE TABLE public.auto_apply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_reasons JSONB DEFAULT '[]',
  generated_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'skipped', 'failed')),
  skip_reason TEXT,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

ALTER TABLE public.auto_apply_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인만 조회" ON public.auto_apply_logs
  FOR SELECT USING (worker_id = auth.uid());

CREATE INDEX idx_auto_apply_logs_worker ON public.auto_apply_logs(worker_id, executed_at DESC);


-- ============================================================================
-- Migration: 022_applications_auto_fields.sql
-- ============================================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_auto_applied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_apply_log_id UUID REFERENCES public.auto_apply_logs(id) ON DELETE SET NULL;


-- ============================================================================
-- Migration: 023_company_bot_settings.sql
-- ============================================================================

CREATE TABLE public.company_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_mode TEXT NOT NULL DEFAULT 'always' CHECK (schedule_mode IN ('always', 'off_hours', 'custom')),
  custom_start_time TIME,
  custom_end_time TIME,
  tone TEXT NOT NULL DEFAULT 'polite' CHECK (tone IN ('formal', 'polite', 'concise')),
  escalation_keywords TEXT[] DEFAULT ARRAY['급여', '계약', '불만', '사고', '보험'],
  notify_on_escalation BOOLEAN DEFAULT true,
  total_responses INTEGER DEFAULT 0,
  total_escalations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 기업만" ON public.company_bot_settings
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());


-- ============================================================================
-- Migration: 024_company_bot_faq.sql
-- ============================================================================

CREATE TABLE public.company_bot_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  priority INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_bot_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 기업만" ON public.company_bot_faq
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE INDEX idx_bot_faq_company ON public.company_bot_faq(company_id, priority DESC);


-- ============================================================================
-- Migration: 025_messages_ai_columns.sql
-- ============================================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_ai_response BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false;


-- ============================================================================
-- Migration: 026_message_chatbot_trigger.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_chatbot_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_other_user UUID;
  v_other_role TEXT;
  v_bot_enabled BOOLEAN;
BEGIN
  SELECT user_id INTO v_other_user
  FROM chat_participants
  WHERE room_id = NEW.room_id AND user_id != NEW.sender_id
  LIMIT 1;

  IF v_other_user IS NULL THEN RETURN NEW; END IF;

  SELECT role INTO v_other_role FROM profiles WHERE id = v_other_user;
  IF v_other_role != 'company' THEN RETURN NEW; END IF;

  SELECT enabled INTO v_bot_enabled
  FROM company_bot_settings WHERE company_id = v_other_user;

  IF v_bot_enabled = true THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/api/company-bot/respond',
      body := json_build_object(
        'room_id', NEW.room_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'company_id', v_other_user
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chatbot_on_message();


-- ============================================================================
-- Migration: 027_applicant_analysis.sql
-- ============================================================================

CREATE TABLE public.applicant_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_grade TEXT NOT NULL CHECK (match_grade IN ('A', 'B', 'C', 'D')),
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  concerns JSONB NOT NULL DEFAULT '[]',
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  model_version TEXT DEFAULT 'v1',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id)
);

ALTER TABLE public.applicant_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공고 소유 기업만 조회" ON public.applicant_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applicant_analysis.job_id
      AND jobs.company_id = auth.uid()
    )
  );

CREATE INDEX idx_analysis_job ON public.applicant_analysis(job_id, match_score DESC);


-- ============================================================================
-- Migration: 028_notification_templates.sql
-- ============================================================================

CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN (
    'application_accepted',
    'application_rejected',
    'contract_created',
    'review_requested',
    'auto_apply_result'
  )),
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- Migration: 029_seed_notification_templates.sql
-- ============================================================================

INSERT INTO notification_templates (type, template, variables) VALUES
  ('application_accepted',
   E'🎉 [{job_title}]에 확정되셨습니다!\n{company_name}에서 회원님을 선택했습니다.\n담당자에게 메시지를 보내보세요.',
   ARRAY['job_title', 'company_name']),
  ('application_rejected',
   E'안타깝지만 [{job_title}] 지원이 마감되었습니다.\n다른 공고도 확인해보세요!',
   ARRAY['job_title', 'company_name']),
  ('auto_apply_result',
   E'🤖 AI가 오늘 {count}건의 공고에 지원했습니다.\n지원 내역을 확인해보세요.',
   ARRAY['count'])
ON CONFLICT (type) DO NOTHING;
-- 030: AI 매칭 설정 컬럼 추가
-- 사용자가 AI 자동매칭을 켜고/끌 수 있고, 세부 설정 가능

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS ai_matching_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS matching_min_score INTEGER DEFAULT 50 CHECK (matching_min_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS matching_max_results INTEGER DEFAULT 5 CHECK (matching_max_results BETWEEN 1 AND 20),
  ADD COLUMN IF NOT EXISTS matching_preferred_locations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS matching_preferred_types TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.user_settings.ai_matching_enabled IS 'AI 매칭 기능 활성화 여부';
COMMENT ON COLUMN public.user_settings.matching_min_score IS 'AI 매칭 최소 점수 (0-100)';
COMMENT ON COLUMN public.user_settings.matching_max_results IS '매칭 결과 최대 개수 (1-20)';
COMMENT ON COLUMN public.user_settings.matching_preferred_locations IS '선호 지역 필터';
COMMENT ON COLUMN public.user_settings.matching_preferred_types IS '선호 공종/직종 필터';
