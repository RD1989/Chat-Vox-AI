
-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all vox_leads (for metrics)
CREATE POLICY "Admins can view all leads"
  ON public.vox_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all vox_messages (for metrics)
CREATE POLICY "Admins can view all messages"
  ON public.vox_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
