
-- Allow public inserts into vox_leads (for chat lead capture)
CREATE POLICY "Public can insert leads via chat" ON public.vox_leads
  FOR INSERT
  WITH CHECK (true);

-- Allow public inserts into vox_messages (for chat messages)
CREATE POLICY "Public can insert messages via chat" ON public.vox_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow public to read vox_settings (for chat config)
CREATE POLICY "Public can read vox_settings" ON public.vox_settings
  FOR SELECT
  USING (true);
