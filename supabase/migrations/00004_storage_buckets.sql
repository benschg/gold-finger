-- Gold-Finger Storage Buckets
-- This migration creates storage buckets for receipts and avatars

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Receipts bucket (private - only owner can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  FALSE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
);

-- Avatars bucket (public - anyone can view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- ============================================
-- STORAGE POLICIES FOR RECEIPTS
-- ============================================

-- Users can upload receipts to their own folder
CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own receipts
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Account members can view receipts for shared expenses
-- (Receipt URL is stored in expense, so if they can see expense, they can access receipt)
CREATE POLICY "Account members can view shared receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.account_members am ON am.account_id = e.account_id
      WHERE am.user_id = auth.uid()
        AND e.receipt_url LIKE '%' || name
    )
  );

-- ============================================
-- STORAGE POLICIES FOR AVATARS
-- ============================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
