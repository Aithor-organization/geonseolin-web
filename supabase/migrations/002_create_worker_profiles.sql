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
