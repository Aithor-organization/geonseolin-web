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
