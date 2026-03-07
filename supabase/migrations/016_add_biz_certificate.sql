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
