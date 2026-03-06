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
