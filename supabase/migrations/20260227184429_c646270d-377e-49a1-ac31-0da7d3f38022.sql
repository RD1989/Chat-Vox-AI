CREATE TABLE public.lgpd_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  reason text,
  request_type text NOT NULL DEFAULT 'deletion',
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

-- Admins can manage all requests
CREATE POLICY "Admins can manage lgpd_requests"
  ON public.lgpd_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert a request (public form)
CREATE POLICY "Public can insert lgpd_requests"
  ON public.lgpd_requests FOR INSERT
  WITH CHECK (true);