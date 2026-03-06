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
