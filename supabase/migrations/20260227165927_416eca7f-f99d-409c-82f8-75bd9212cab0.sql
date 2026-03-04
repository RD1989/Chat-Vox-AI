
-- Create plans table
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  price_brl integer NOT NULL DEFAULT 0,
  lead_limit integer, -- NULL = unlimited
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (public info)
CREATE POLICY "Anyone can view plans" ON public.plans
  FOR SELECT USING (true);

-- Add plan column to profiles
ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free';

-- Insert plan data
INSERT INTO public.plans (slug, name, price_brl, lead_limit) VALUES
  ('free', 'Free', 0, 25),
  ('starter', 'Starter', 4700, 500),
  ('pro', 'Pro', 9700, 2000),
  ('scale', 'Scale', 19700, NULL);

-- Function to check if user can create more leads
CREATE OR REPLACE FUNCTION public.check_lead_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT p.lead_limit IS NULL OR 
            (SELECT COUNT(*) FROM public.vox_leads WHERE user_id = _user_id) < p.lead_limit
     FROM public.plans p
     JOIN public.profiles pr ON pr.plan = p.slug
     WHERE pr.id = _user_id),
    false
  )
$$;
