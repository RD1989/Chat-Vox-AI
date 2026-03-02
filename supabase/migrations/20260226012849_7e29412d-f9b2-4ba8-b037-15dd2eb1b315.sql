
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_whatsapp text NOT NULL,
  treatment_category text NOT NULL,
  preferred_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (true);
