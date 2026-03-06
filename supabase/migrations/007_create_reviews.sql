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
