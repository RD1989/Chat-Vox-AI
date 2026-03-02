
-- Create storage bucket for avatar uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Add chat_theme column to vox_settings
ALTER TABLE public.vox_settings ADD COLUMN IF NOT EXISTS chat_theme text NOT NULL DEFAULT 'whatsapp';
ALTER TABLE public.vox_settings ADD COLUMN IF NOT EXISTS chat_theme_config jsonb DEFAULT '{}';
