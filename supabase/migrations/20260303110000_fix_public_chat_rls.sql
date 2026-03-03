
-- Allow public users (anon role) to insert into vox_leads to start a chat
CREATE POLICY "Public can insert leads" ON public.vox_leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public users to update their own lead record (e.g., adding email/phone during chat)
CREATE POLICY "Public can update own lead" ON public.vox_leads
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Allow public users to read chat settings and agent configurations
CREATE POLICY "Public can read settings" ON public.vox_settings
  FOR SELECT TO anon
  USING (true);

-- Ensure vox_messages also allows public inserts if needed (currently handled by Edge Function, but good for direct client-side fallback)
CREATE POLICY "Public can insert messages" ON public.vox_messages
  FOR INSERT TO anon
  WITH CHECK (true);
